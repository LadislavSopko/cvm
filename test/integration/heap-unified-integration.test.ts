import { describe, it, expect } from 'vitest';
import { VMManager } from '@cvm/vm';

describe('Heap and Unified Operations Integration', () => {
  it('should handle complex nested structure manipulation', async () => {
    const vmManager = new VMManager();
    await vmManager.initialize();
    
    const program = `
      function main() {
        // Create nested structure
        const data = {
          users: [
            { name: "Alice", scores: [10, 20] },
            { name: "Bob", scores: [15, 25] }
          ]
        };
        
        // Access nested property
        const firstUser = data.users[0];
        const firstName = firstUser.name;
        
        // Modify nested array
        data.users[1].scores[0] = 30;
        
        // Add new property
        data.totalUsers = 2;
        
        return data.users[1].scores[0]; // Should be 30
      }
      main();
    `;
    
    await vmManager.loadProgram('test', program);
    await vmManager.startExecution('test', 'exec1');
    
    const result = await vmManager.getNext('exec1');
    expect(result.type).toBe('completed');
    expect(result.result).toBe(30);
    
    await vmManager.dispose();
  });
});