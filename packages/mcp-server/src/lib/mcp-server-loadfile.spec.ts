import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';
import { writeFile, unlink, mkdir, rmdir } from 'node:fs/promises';
import { join } from 'node:path';

// Mock VMManager for controlled testing
vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
    loadProgram: vi.fn(),
    startExecution: vi.fn(),
    getNext: vi.fn().mockResolvedValue({ type: 'completed', result: 42 }),
    reportCCResult: vi.fn(),
    getExecutionStatus: vi.fn()
  }))
}));

describe('CVMMcpServer - loadFile', () => {
  let server: CVMMcpServer;
  let transport: TestTransport;
  const testDir = './tmp-test-loadfile';
  const testFile = join(testDir, 'test-program.ts');

  beforeEach(async () => {
    server = new CVMMcpServer('test');
    transport = new TestTransport();
    
    // Create test directory and file
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, `
function main() {
  console.log("Hello from file!");
  return 42;
}
    `.trim());
    
    await server.start(transport);
  });

  afterEach(async () => {
    await server.stop();
    // Cleanup test files
    try {
      await unlink(testFile);
      await rmdir(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should load program from file path', async () => {
    const result = await transport.callTool('loadFile', {
      programId: 'test-file-program',
      filePath: testFile
    });

    expect(result.content).toEqual([
      { type: 'text', text: `Program loaded successfully from ${testFile}: test-file-program` }
    ]);
    expect(result.isError).toBeUndefined();
  });

  it('should handle file not found error', async () => {
    const nonExistentFile = join(testDir, 'does-not-exist.ts');
    
    const result = await transport.callTool('loadFile', {
      programId: 'test-missing',
      filePath: nonExistentFile
    });

    expect(result.content).toEqual([
      { type: 'text', text: `Error: File not found: ${nonExistentFile}` }
    ]);
    expect(result.isError).toBe(true);
  });

  it('should load and execute program from file', async () => {
    // Load from file
    const loadResult = await transport.callTool('loadFile', {
      programId: 'file-exec-test',
      filePath: testFile
    });

    expect(loadResult.isError).toBeUndefined();

    // Start execution
    const startResult = await transport.callTool('start', {
      programId: 'file-exec-test',
      executionId: 'exec1'
    });

    expect(startResult.isError).toBeUndefined();

    // Get result
    const taskResult = await transport.callTool('getTask', {
      executionId: 'exec1'
    });

    expect(taskResult.content[0].text).toContain('Execution completed with result: 42');
  });

  it('should handle compilation errors in loaded file', async () => {
    const invalidFile = join(testDir, 'invalid.ts');
    await writeFile(invalidFile, `
function main() {
  // Invalid syntax
  let x = ;
}
    `.trim());

    // Mock VMManager to throw an error for this specific program
    const vmManager = server.getVMManager();
    vi.mocked(vmManager.loadProgram).mockRejectedValueOnce(new Error('Compilation failed: Unexpected token'));

    const result = await transport.callTool('loadFile', {
      programId: 'invalid-program',
      filePath: invalidFile
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error:');
    
    // Cleanup
    await unlink(invalidFile);
  });

  it('should resolve relative paths safely', async () => {
    // Test with relative path
    const relativeFile = './tmp-test-loadfile/test-program.ts';
    
    const result = await transport.callTool('loadFile', {
      programId: 'relative-test',
      filePath: relativeFile
    });

    expect(result.content).toEqual([
      { type: 'text', text: `Program loaded successfully from ${relativeFile}: relative-test` }
    ]);
    expect(result.isError).toBeUndefined();
  });
});