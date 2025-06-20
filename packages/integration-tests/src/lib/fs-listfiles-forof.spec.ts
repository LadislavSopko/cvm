import { describe, it, expect } from 'vitest';
import { VM } from '@cvm/vm';
import { Parser } from '@cvm/parser';
import { VMManager } from '@cvm/vm';
import { InMemoryStorage } from '@cvm/storage';
import { fileSystem } from '@cvm/vm';

describe('Integration - fs.listFiles with for-of', () => {
  it('should iterate over fs.listFiles results', async () => {
    const source = `
      function main() {
        // First test with a simple array to ensure for-of works
        let simpleArray = ["a", "b", "c"];
        let simpleCount = 0;
        for (const item of simpleArray) {
          simpleCount = simpleCount + 1;
        }
        console.log("Simple array count: " + simpleCount);
        
        // Now test with fs.listFiles
        let files = fs.listFiles("/home/laco/cvm/test/programs", {
          filter: "test-*.ts"
        });
        console.log("Found " + files.length + " files");
        console.log("Type of files: " + typeof files);
        
        // Try iteration
        let count = 0;
        for (const file of files) {
          count = count + 1;
          console.log("File " + count + ": " + file);
          if (count >= 3) {
            break;
          }
        }
        
        console.log("Iterated over " + count + " files");
        return "Done";
      }
      main();
    `;

    // Set sandbox paths for test
    process.env.CVM_SANDBOX_PATHS = "/home/laco/cvm";

    const parser = new Parser();
    const program = parser.parse(source);
    
    const storage = new InMemoryStorage();
    const manager = new VMManager(storage, fileSystem);
    
    // Store program
    await storage.saveProgram({
      id: 'test-fs-forof',
      source,
      bytecode: program.bytecode,
      created: new Date()
    });
    
    // Start execution
    await manager.startExecution('test-fs-forof', 'exec-1');
    
    // Run to completion
    let result = await manager.getNext('exec-1');
    while (result.type !== 'complete' && result.type !== 'error') {
      if (result.type === 'cc') {
        // No CC calls expected in this test
        throw new Error('Unexpected CC call');
      }
      result = await manager.getNext('exec-1');
    }
    
    expect(result.type).toBe('complete');
    
    // Check output
    const output = await storage.getOutput('exec-1');
    expect(output).toContain('Simple array count: 3');
    expect(output).toContain('Found');
    expect(output).toContain('files');
    
    // Clean up
    delete process.env.CVM_SANDBOX_PATHS;
  });
});