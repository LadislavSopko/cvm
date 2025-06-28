import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';
import { FileSystemService } from './file-system.js';

// Mock FileSystemService
class MockFileSystemService implements FileSystemService {
  listFiles(filePath: string, options?: any) {
    if (filePath === '/test') {
      return createCVMArray([
        '/test/file1.txt',
        '/test/file2.txt'
      ]);
    }
    return createCVMArray([]);
  }

  readFile(filePath: string): string | null {
    return `Content of ${filePath}`;
  }

  writeFile(filePath: string, content: string): boolean {
    return true;
  }
}

describe('VM - fs.listFiles with CC and iterator', () => {
  let vm: VM;
  let fileSystem: FileSystemService;

  beforeEach(() => {
    vm = new VM();
    fileSystem = new MockFileSystemService();
  });

  it('should maintain iterator state across CC calls', () => {
    // This simulates what analyze-directory.ts does
    const bytecode = [
      // Get files
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.STORE, arg: 'files' },     // 2
      
      // Start iteration
      { op: OpCode.LOAD, arg: 'files' },      // 3
      { op: OpCode.ITER_START },              // 4
      
      // Loop start
      { op: OpCode.ITER_NEXT },               // 5
      { op: OpCode.JUMP_IF_FALSE, arg: 16 }, // 6 - exit if no more
      { op: OpCode.STORE, arg: 'file' },      // 7
      
      // Print current file
      { op: OpCode.LOAD, arg: 'file' },       // 8
      { op: OpCode.PRINT },                   // 9
      
      // Simulate CC call
      { op: OpCode.PUSH, arg: 'Process file?' }, // 10
      { op: OpCode.CC },                         // 11
      { op: OpCode.STORE, arg: 'result' },       // 12
      
      // Print CC result
      { op: OpCode.LOAD, arg: 'result' },        // 13
      { op: OpCode.PRINT },                      // 14
      
      // Continue loop
      { op: OpCode.JUMP, arg: 5 },               // 15
      
      // End loop
      { op: OpCode.ITER_END },                   // 16
      { op: OpCode.HALT }                        // 17
    ];

    // Execute with fileSystem until first CC
    const state1 = vm.execute(bytecode, {}, fileSystem);
    
    // Should now be waiting for first CC
    expect(state1.status).toBe('waiting_cc');
    expect(state1.output).toContain('/test/file1.txt');
    
    // Resume after first CC
    const state2 = vm.resume(state1, 'Processing file 1', bytecode, fileSystem);
    
    // Should be waiting for second CC
    expect(state2.status).toBe('waiting_cc');
    expect(state2.output).toContain('Processing file 1');
    expect(state2.output).toContain('/test/file2.txt');
    
    // Resume after second CC
    const state3 = vm.resume(state2, 'Processing file 2', bytecode, fileSystem);
    
    // Should be complete
    expect(state3.status).toBe('complete');
    expect(state3.output).toContain('Processing file 2');
    expect(state3.error).toBeUndefined();
  });
});