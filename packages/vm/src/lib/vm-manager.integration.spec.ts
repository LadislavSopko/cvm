import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VMManager } from './vm-manager.js';

describe('VMManager Integration Tests', () => {
  let vmManager: VMManager;

  beforeAll(async () => {
    // VMManager will use MONGODB_URI from .env file
    vmManager = new VMManager();
    await vmManager.initialize();
  });

  afterAll(async () => {
    await vmManager.dispose();
  });

  describe('loadProgram', () => {
    it('should compile and store a valid program', async () => {
      const source = `
        function main() {
          console.log("Hello VMManager");
        }
        main();
      `;

      // Should not throw
      await expect(vmManager.loadProgram('vm-test-1', source)).resolves.not.toThrow();
    });

    it('should throw error for invalid program', async () => {
      const source = `
        function helper() {
          console.log("No main");
        }
      `;

      await expect(vmManager.loadProgram('vm-test-2', source))
        .rejects.toThrow('Compilation failed');
    });
  });

  describe('full execution flow', () => {
    it('should handle complete program execution', async () => {
      // Load program - CVM currently only supports strings
      const source = `
        function main() {
          const greeting = "Hello";
          const name = "World";
          const message = greeting + " " + name;
          console.log(message);
        }
        main();
      `;

      await vmManager.loadProgram('vm-test-3', source);

      // Start execution
      await vmManager.startExecution('vm-test-3', 'exec-vm-1');

      // Get next - should complete immediately for this simple program
      const result = await vmManager.getNext('exec-vm-1');
      expect(result.type).toBe('completed');
      expect(result.message).toBe('Execution completed');

      // Check execution state
      const status = await vmManager.getExecutionStatus('exec-vm-1');
      expect(status.state).toBe('COMPLETED');
      
      // Check output separately
      const output = await vmManager.getExecutionOutput('exec-vm-1');
      expect(output).toContain('Hello World');
    });

    it('should handle cognitive calls correctly', async () => {
      // Load program with CC
      const source = `
        function main() {
          const prompt = "What is your name?";
          const response = CC(prompt);
          console.log("Hello, " + response);
        }
        main();
      `;

      await vmManager.loadProgram('vm-test-4', source);
      await vmManager.startExecution('vm-test-4', 'exec-vm-2');

      // Get next - should return CC prompt
      const result1 = await vmManager.getNext('exec-vm-2');
      expect(result1.type).toBe('waiting');
      expect(result1.message).toBe('What is your name?');

      // Report CC result
      await vmManager.reportCCResult('exec-vm-2', 'Alice');

      // Get next again - should complete
      const result2 = await vmManager.getNext('exec-vm-2');
      expect(result2.type).toBe('completed');

      // Check final state
      const status = await vmManager.getExecutionStatus('exec-vm-2');
      expect(status.state).toBe('COMPLETED');
      
      // Check output separately
      const output = await vmManager.getExecutionOutput('exec-vm-2');
      expect(output).toContain('Hello, Alice');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent program', async () => {
      await expect(vmManager.startExecution('non-existent', 'exec-vm-3'))
        .rejects.toThrow('Program not found');
    });

    it('should handle non-existent execution', async () => {
      await expect(vmManager.getNext('non-existent-exec'))
        .rejects.toThrow('Execution not found');
    });
  });

  describe('deep nesting handling', () => {
    it('should handle deeply nested structures without stack overflow', async () => {
      const deeplyNested = `
        function main() {
          var obj = {};
          var current = obj;
          var i = 0;
          while (i < 1000) {
            current.child = {};
            current = current.child;
            i = i + 1;
          }
          CC("Ready");
        }
        main();
      `;
      await vmManager.loadProgram('deep', deeplyNested);
      await vmManager.startExecution('deep', 'exec1');
      
      // Should not throw stack overflow - heap is already serialized as flat structure
      const task = await vmManager.getNext('exec1');
      expect(task).toBeDefined();
      expect(task.type).toBe('waiting');
      expect(task.message).toBe('Ready');
    });
  });
});