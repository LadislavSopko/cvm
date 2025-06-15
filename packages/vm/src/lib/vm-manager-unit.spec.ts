import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VMManager } from './vm-manager.js';

// Mock the storage module
vi.mock('@cvm/storage', () => {
  const mockPrograms = new Map();
  const mockExecutions = new Map();

  const mockAdapter = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    isConnected: vi.fn().mockReturnValue(true),
    saveProgram: vi.fn().mockImplementation(async (program) => {
      mockPrograms.set(program.id, program);
    }),
    getProgram: vi.fn().mockImplementation(async (id) => {
      return mockPrograms.get(id);
    }),
    saveExecution: vi.fn().mockImplementation(async (execution) => {
      mockExecutions.set(execution.id, execution);
    }),
    getExecution: vi.fn().mockImplementation(async (id) => {
      return mockExecutions.get(id);
    })
  };

  return {
    StorageFactory: {
      create: vi.fn().mockReturnValue(mockAdapter)
    }
  };
});

describe('VMManager Unit Tests', () => {
  let vmManager: VMManager;

  beforeEach(async () => {
    vi.clearAllMocks();
    vmManager = new VMManager();
    await vmManager.initialize();
  });

  describe('loadProgram', () => {
    it('should compile and store a valid program', async () => {
      const source = `
        function main() {
          console.log("Hello VMManager");
        }
        main();
      `;

      await expect(vmManager.loadProgram('test-1', source)).resolves.not.toThrow();
    });

    it('should throw error for invalid program', async () => {
      const source = `
        function helper() {
          console.log("No main");
        }
      `;

      await expect(vmManager.loadProgram('test-2', source))
        .rejects.toThrow('Compilation failed');
    });
  });

  describe('execution flow', () => {
    it('should handle complete program execution', async () => {
      const source = `
        function main() {
          const greeting = "Hello";
          const name = "World";
          const message = greeting + " " + name;
          console.log(message);
        }
        main();
      `;

      await vmManager.loadProgram('test-3', source);
      await vmManager.startExecution('test-3', 'exec-1');
      
      const result = await vmManager.getNext('exec-1');
      expect(result.type).toBe('completed');
    });

    it('should handle cognitive calls', async () => {
      const source = `
        function main() {
          const answer = CC("What is 2+2?");
          console.log("Answer: " + answer);
        }
        main();
      `;

      await vmManager.loadProgram('test-4', source);
      await vmManager.startExecution('test-4', 'exec-2');
      
      // First call should return waiting
      const result1 = await vmManager.getNext('exec-2');
      expect(result1.type).toBe('waiting');
      expect(result1.message).toBe('What is 2+2?');

      // Report result
      await vmManager.reportCCResult('exec-2', '4');

      // Next call should complete
      const result2 = await vmManager.getNext('exec-2');
      expect(result2.type).toBe('completed');
    });
  });
});