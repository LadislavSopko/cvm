import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
    loadProgram: vi.fn(),
    startExecution: vi.fn(),
    getNext: vi.fn(),
    reportCCResult: vi.fn(),
    getExecutionStatus: vi.fn(),
    setCurrentExecutionId: vi.fn(),
    getCurrentExecutionId: vi.fn(),
    listExecutions: vi.fn(),
    deleteExecution: vi.fn(),
    getExecutionWithAttempts: vi.fn(),
    listPrograms: vi.fn(),
    deleteProgram: vi.fn(),
    restartExecution: vi.fn()
  }))
}));

const validPlanContent = `# TDDAB Plan: Test
**Date:** 2026-05-25

<mission>
Test project context. TypeScript with Vitest.
Build: npx nx test sample.
</mission>

<block id="01-greeting">
## TDDAB-1: Add Greeting Function

<intro>
Create a greeting function.
File: src/greeting.ts
</intro>

<red>
- test: greet("World") returns "Hello, World!"
- test: greet("") returns "Hello, !"
</red>

### Implementation
Simple function.

<success>
- [ ] greet function exists
- [ ] all tests pass
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Add Farewell Function

<intro>
Create a farewell function.
File: src/farewell.ts
</intro>

<red>
- test: farewell("World") returns "Goodbye, World!"
</red>

### Implementation
Simple function.

<success>
- [ ] farewell function exists
- [ ] all tests pass
</success>
</block>
`;

describe('CVMMcpServer - parsePlan', () => {
  let server: CVMMcpServer;
  let transport: TestTransport;
  const testDir = './tmp-test-parseplan';
  const dataDir = join(testDir, '.cvm');
  const planFile = join(testDir, 'plan.md');
  let originalDataDir: string | undefined;

  beforeEach(async () => {
    originalDataDir = process.env['CVM_DATA_DIR'];
    process.env['CVM_DATA_DIR'] = dataDir;

    await mkdir(testDir, { recursive: true });
    await writeFile(planFile, validPlanContent);

    server = new CVMMcpServer('test');
    transport = new TestTransport();
    await server.start(transport);
  });

  afterEach(async () => {
    await server.stop();
    if (originalDataDir !== undefined) {
      process.env['CVM_DATA_DIR'] = originalDataDir;
    } else {
      delete process.env['CVM_DATA_DIR'];
    }
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should be callable and return valid result for valid plan', async () => {
    const result = await transport.callTool('parsePlan', {
      filePath: planFile
    });

    expect('content' in result).toBe(true);
    if ('content' in result) {
      const response = JSON.parse(result.content[0].text as string);
      expect(response.valid).toBe(true);
      expect(response.blocks).toBe(2);
      expect(response.path).toContain('uplan.json');
      expect(response.blockIds).toEqual(['01-greeting', '02-farewell']);
    }
  });

  it('should write uplan.json to CVM data dir', async () => {
    await transport.callTool('parsePlan', { filePath: planFile });

    const uplanPath = join(dataDir, 'uplan.json');
    const content = await readFile(uplanPath, 'utf-8');
    const uplan = JSON.parse(content);

    expect(uplan.mission).toContain('Test project context');
    expect(uplan.sourceFile).toBe(planFile);
    expect(uplan.blocks).toHaveLength(2);
  });

  it('should write uplan.json with joined red/success strings', async () => {
    await transport.callTool('parsePlan', { filePath: planFile });

    const uplanPath = join(dataDir, 'uplan.json');
    const content = await readFile(uplanPath, 'utf-8');
    const uplan = JSON.parse(content);

    const block = uplan.blocks[0];
    expect(typeof block.red).toBe('string');
    expect(typeof block.success).toBe('string');
    expect(block.red).toContain('- greet("World") returns "Hello, World!"');
    expect(block.success).toContain('- [ ] greet function exists');
    expect(block.planRef).toMatch(/^See .+ lines \d+-\d+$/);
  });

  it('should return isError true for non-existent file', async () => {
    const result = await transport.callTool('parsePlan', {
      filePath: join(testDir, 'does-not-exist.md')
    });

    expect('content' in result).toBe(true);
    if ('content' in result) {
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error:');
    }
  });

  it('should create uplan.json.bak when overwriting', async () => {
    await transport.callTool('parsePlan', { filePath: planFile });
    await transport.callTool('parsePlan', { filePath: planFile });

    const bakContent = await readFile(join(dataDir, 'uplan.json.bak'), 'utf-8');
    const bak = JSON.parse(bakContent);
    expect(bak.mission).toContain('Test project context');
  });

  it('should return isError true with validation errors for invalid plan', async () => {
    const invalidFile = join(testDir, 'invalid.md');
    await writeFile(invalidFile, '<block id="01-test">\n## TDDAB-1: Test\n<intro>x</intro>\n<red>\n- test: y\n</red>\n<success>\n- [ ] z\n</success>\n</block>');

    const result = await transport.callTool('parsePlan', {
      filePath: invalidFile
    });

    expect('content' in result).toBe(true);
    if ('content' in result) {
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('validation failed');
      expect(result.content[0].text).toContain('mission');
    }
  });

  it('should return isError true with unparseable-line message for malformed actions line', async () => {
    const malformedFile = join(testDir, 'malformed-actions.md');
    const malformedContent = `<mission>Step plan context for strict actions.</mission>

<block id="01-cleanup">
## TDDAB-1: Cleanup
<intro>Remove legacy config.</intro>
<actions>
- action: remove v1 entries
- action @manual: run migration
</actions>
<success>
- [ ] no v1 references
</success>
</block>`;
    await writeFile(malformedFile, malformedContent);

    const result = await transport.callTool('parsePlan', {
      filePath: malformedFile
    });

    expect('content' in result).toBe(true);
    if ('content' in result) {
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('validation failed');
      expect(result.content[0].text).toContain('unparseable line in actions');
    }
  });

  describe('multi-file plans', () => {
    const indexContent = `# TDDAB Plan: Multi-File Test
**Date:** 2026-05-26

<mission>
Multi-file test project context.
</mission>

<files>
- 01-models.md
- 02-services.md
</files>
`;

    const modelsContent = `# Models

<block id="01-model">
## TDDAB-1: Create Model

<intro>
Create the data model.
</intro>

<red>
- test: model exists
</red>

### Implementation
Simple model.

<success>
- [ ] model created
</success>
</block>
`;

    const servicesContent = `# Services

<block id="02-service">
## TDDAB-2: Create Service

<intro>
Create the service layer.
</intro>

<red>
- test: service exists
</red>

### Implementation
Simple service.

<success>
- [ ] service created
</success>
</block>
`;

    it('should parse multi-file plan and merge blocks from sub-files', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, indexContent);
      await writeFile(join(testDir, '01-models.md'), modelsContent);
      await writeFile(join(testDir, '02-services.md'), servicesContent);

      const result = await transport.callTool('parsePlan', { filePath: indexFile });

      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBeUndefined();
        const response = JSON.parse(result.content[0].text as string);
        expect(response.valid).toBe(true);
        expect(response.blocks).toBe(2);
        expect(response.blockIds).toEqual(['01-model', '02-service']);
      }
    });

    it('should write uplan.json with sourceFiles array and correct planRef', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, indexContent);
      await writeFile(join(testDir, '01-models.md'), modelsContent);
      await writeFile(join(testDir, '02-services.md'), servicesContent);

      await transport.callTool('parsePlan', { filePath: indexFile });

      const uplanPath = join(dataDir, 'uplan.json');
      const uplan = JSON.parse(await readFile(uplanPath, 'utf-8'));

      expect(uplan.mission).toContain('Multi-file test project context');
      expect(uplan.sourceFile).toBe(resolve(indexFile));
      expect(uplan.sourceFiles).toHaveLength(3);
      expect(uplan.sourceFiles[0]).toContain('index.md');
      expect(uplan.sourceFiles[1]).toContain('01-models.md');
      expect(uplan.sourceFiles[2]).toContain('02-services.md');
      expect(uplan.blocks).toHaveLength(2);
      expect(uplan.blocks[0].planRef).toContain('01-models.md');
      expect(uplan.blocks[1].planRef).toContain('02-services.md');
    });

    it('should return error for missing sub-file', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, indexContent);
      await writeFile(join(testDir, '01-models.md'), modelsContent);

      const result = await transport.callTool('parsePlan', { filePath: indexFile });

      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Sub-file not found');
        expect(result.content[0].text).toContain('02-services.md');
      }
    });

    it('should return error for duplicate block IDs across files', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, indexContent);
      await writeFile(join(testDir, '01-models.md'), modelsContent);
      const dupContent = servicesContent.replace('02-service', '01-model');
      await writeFile(join(testDir, '02-services.md'), dupContent);

      const result = await transport.callTool('parsePlan', { filePath: indexFile });

      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Duplicate block id');
      }
    });

    it('should ignore mission tag in sub-files', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, indexContent);
      const modelsWithMission = `<mission>This should be ignored</mission>\n\n${modelsContent}`;
      await writeFile(join(testDir, '01-models.md'), modelsWithMission);
      await writeFile(join(testDir, '02-services.md'), servicesContent);

      await transport.callTool('parsePlan', { filePath: indexFile });

      const uplan = JSON.parse(await readFile(join(dataDir, 'uplan.json'), 'utf-8'));
      expect(uplan.mission).toContain('Multi-file test project context');
      expect(uplan.mission).not.toContain('This should be ignored');
    });
  });

  describe('redKeys', () => {
    const longA = 'reportCCResult returns type completed with the program return value';
    const longB = 'reportCCResult returns type completed without result when main returns nothing';

    function blockMd(id: string, listTag: 'red' | 'actions', lines: string[]): string {
      return `<block id="${id}">
## Block ${id}

<intro>
Intro for ${id}.
</intro>

<${listTag}>
${lines.join('\n')}
</${listTag}>

<success>
- [ ] done
</success>
</block>
`;
    }

    function planMd(blocks: string): string {
      return `# Plan

<mission>
Mission for redKeys tests.
</mission>

${blocks}`;
    }

    it('writes the full normalized test text as redKey without truncating at 40 characters', async () => {
      await writeFile(planFile, planMd(blockMd('01-long', 'red', ['- test: ' + longA])));
      await transport.callTool('parsePlan', { filePath: planFile });
      const uplan = JSON.parse(await readFile(join(dataDir, 'uplan.json'), 'utf-8'));
      expect(uplan.blocks[0].redKeys[0]).toBe('reportccresult_returns_type_completed_with_the_program_return_value');
    });

    it('gives two different redKeys to tests sharing the same first 40 characters', async () => {
      await writeFile(planFile, planMd(blockMd('01-prefix', 'red', ['- test: ' + longA, '- test: ' + longB])));
      await transport.callTool('parsePlan', { filePath: planFile });
      const uplan = JSON.parse(await readFile(join(dataDir, 'uplan.json'), 'utf-8'));
      expect(uplan.blocks[0].redKeys).toHaveLength(2);
      expect(new Set(uplan.blocks[0].redKeys).size).toBe(2);
    });

    it('fails validation naming the block when two red tests normalize to the same key', async () => {
      await writeFile(planFile, planMd(blockMd('01-dup', 'red', ['- test: same thing', '- test: Same thing!'])));
      const result = await transport.callTool('parsePlan', { filePath: planFile });
      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Block "01-dup" has duplicate red tests: same_thing');
      }
    });

    it('fails validation for duplicate red tests inside a sub-file of a multi-file plan', async () => {
      const indexFile = join(testDir, 'index.md');
      await writeFile(indexFile, `# Plan

<mission>
Mission for multi-file redKeys test.
</mission>

<files>
- 01-dup.md
</files>
`);
      await writeFile(join(testDir, '01-dup.md'), blockMd('01-dup', 'red', ['- test: same thing', '- test: same thing']));
      const result = await transport.callTool('parsePlan', { filePath: indexFile });
      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('01-dup.md');
        expect(result.content[0].text).toContain('Block "01-dup" has duplicate red tests: same_thing');
      }
    });

    it('still accepts repeated action lines in a step plan block', async () => {
      await writeFile(planFile, planMd(blockMd('01-step', 'actions', ['- action: run build', '- action: run build'])));
      const result = await transport.callTool('parsePlan', { filePath: planFile });
      expect('content' in result).toBe(true);
      if ('content' in result) {
        expect(result.isError).toBeUndefined();
        expect(JSON.parse(result.content[0].text as string).valid).toBe(true);
      }
    });
  });
});
