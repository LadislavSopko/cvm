import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';
import { MongoDBAdapter } from '@cvm/mongodb';
import { Parser } from '@cvm/parser';

// Mock MongoDB
vi.mock('@cvm/mongodb');

describe('VMManager - Multiple CC Handling', () => {
  let vmManager: VMManager;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      saveProgram: vi.fn(),
      getProgram: vi.fn(),
      createExecution: vi.fn(),
      saveExecution: vi.fn(),
      getExecution: vi.fn(),
      saveHistory: vi.fn()
    };

    (MongoDBAdapter as any).mockImplementation(() => mockDb);
    vmManager = new VMManager();
  });

  it('should handle multiple CC calls correctly', async () => {
    await vmManager.initialize();

    // Test program with multiple CC calls
    const source = `
function main() {
  const first = CC("First prompt");
  console.log("First: " + first);
  const second = CC("Second prompt");
  console.log("Second: " + second);
}
`;

    const parser = new Parser();
    const bytecode = parser.parse(source);

    // Mock program storage
    mockDb.getProgram.mockResolvedValue({
      id: 'test',
      source,
      bytecode,
      createdAt: new Date()
    });

    // Load program
    await vmManager.loadProgram('test', source);

    // Start execution
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
    mockDb.getExecution.mockImplementation(async () => ({...execution}));

    await vmManager.startExecution('test', 'exec1');

    // First getNext - should return first CC prompt
    let result = await vmManager.getNext('exec1');
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('First prompt');

    // Check execution state after first CC
    const savedExecution1 = mockDb.saveExecution.mock.calls[mockDb.saveExecution.mock.calls.length - 1][0];
    console.log('After first CC - PC:', savedExecution1.pc, 'State:', savedExecution1.state);

    // Report first CC result
    execution.pc = savedExecution1.pc;
    execution.stack = savedExecution1.stack;
    execution.variables = savedExecution1.variables;
    execution.output = savedExecution1.output;
    execution.state = savedExecution1.state;
    
    await vmManager.reportCCResult('exec1', 'Response 1');

    // Check execution state after CC result
    const savedExecution2 = mockDb.saveExecution.mock.calls[mockDb.saveExecution.mock.calls.length - 1][0];
    console.log('After CC result - PC:', savedExecution2.pc, 'State:', savedExecution2.state);

    // Update mock execution for next call
    execution.pc = savedExecution2.pc;
    execution.stack = savedExecution2.stack;
    execution.variables = savedExecution2.variables;
    execution.output = savedExecution2.output;
    execution.state = savedExecution2.state;

    // Second getNext - should continue execution and reach second CC
    result = await vmManager.getNext('exec1');
    console.log('Second getNext result:', result);
    
    expect(result.type).toBe('waiting');
    expect(result.message).toBe('Second prompt');
  });
});