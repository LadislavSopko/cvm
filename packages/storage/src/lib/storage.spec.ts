import { describe, it, expect } from 'vitest';
import { StorageAdapter } from './storage.js';

describe('StorageAdapter interface', () => {
  it('should define the required methods', () => {
    // This is a compile-time test to ensure the interface is properly defined
    const mockAdapter: StorageAdapter = {
      connect: async () => {},
      disconnect: async () => {},
      isConnected: () => true,
      saveProgram: async () => {},
      getProgram: async () => null,
      saveExecution: async () => {},
      getExecution: async () => null,
      appendOutput: async () => {},
      getOutput: async () => [],
      listExecutions: async () => [],
      getCurrentExecutionId: async () => null,
      setCurrentExecutionId: async () => {},
      deleteExecution: async () => {},
      listPrograms: async () => [],
      deleteProgram: async () => {},
    };
    
    expect(mockAdapter).toBeDefined();
    expect(typeof mockAdapter.connect).toBe('function');
    expect(typeof mockAdapter.disconnect).toBe('function');
    expect(typeof mockAdapter.isConnected).toBe('function');
    expect(typeof mockAdapter.saveProgram).toBe('function');
    expect(typeof mockAdapter.getProgram).toBe('function');
    expect(typeof mockAdapter.saveExecution).toBe('function');
    expect(typeof mockAdapter.getExecution).toBe('function');
  });
});
