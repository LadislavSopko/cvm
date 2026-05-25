import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';
import { writeFile, unlink, mkdir, rm, readFile } from 'node:fs/promises';
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
      const response = JSON.parse(result.content[0].text);
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
});
