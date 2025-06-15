import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';
import { StorageFactory } from '@cvm/storage';
import { compile } from '@cvm/parser';

// Mock Storage
vi.mock('@cvm/storage');

describe('VMManager - Multiple CC Debug', () => {
  let vmManager: VMManager;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      isConnected: vi.fn().mockReturnValue(true),
      saveProgram: vi.fn(),
      getProgram: vi.fn(),
      createExecution: vi.fn(),
      saveExecution: vi.fn(),
      getExecution: vi.fn()
    };

    (StorageFactory as any).create = vi.fn().mockReturnValue(mockDb);
    vmManager = new VMManager();
  });

  it('should handle back-to-back CC calls', async () => {
    await vmManager.initialize();

    // Simple program with two CCs
    const source = `
function main() {
  const a = CC("First");
  const b = CC("Second");
  console.log(a + b);
}
main();
`;

    const compiled = compile(source);
    expect(compiled.success).toBe(true);

    // Mock program
    mockDb.getProgram.mockResolvedValue({
      id: 'test',
      source,
      bytecode: compiled.bytecode,
      createdAt: new Date()
    });

    await vmManager.loadProgram('test', source);

    // Track all saveExecution calls
    const executionStates: any[] = [];
    mockDb.saveExecution.mockImplementation(async (exec: any) => {
      executionStates.push({
        state: exec.state,
        pc: exec.pc,
        stack: [...exec.stack],
        variables: { ...exec.variables },
        ccPrompt: exec.ccPrompt
      });
      // Update the execution object with the saved state
      Object.assign(execution, exec);
    });

    // Mock execution
    const execution = {
      id: 'exec1',
      programId: 'test',
      state: 'ready',
      pc: 0,
      stack: [],
      variables: {},
      output: [],
      createdAt: new Date()
    };
    
    mockDb.createExecution.mockResolvedValue(execution);
    mockDb.getExecution.mockImplementation(async () => ({ ...execution }));

    await vmManager.startExecution('test', 'exec1');

    // First getNext - should hit first CC
    console.log('\n=== First getNext ===');
    let result = await vmManager.getNext('exec1');
    console.log('Result:', result);
    console.log('Saved states:', executionStates);
    
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('First');

    // Update mock execution with saved state
    const lastSaved = executionStates[executionStates.length - 1];
    Object.assign(execution, lastSaved);

    // Report first CC result
    console.log('\n=== Report CC Result ===');
    await vmManager.reportCCResult('exec1', 'A');
    console.log('Saved states after CC:', executionStates);

    // Update mock execution again
    const savedAfterCC = executionStates[executionStates.length - 1];
    Object.assign(execution, savedAfterCC);
    console.log('Execution state after CC:', execution);

    // Second getNext - should return second CC (read-only)
    console.log('\n=== Second getNext ===');
    result = await vmManager.getNext('exec1');
    console.log('Result:', result);
    console.log('Final saved states:', executionStates);

    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Second');
  });
});