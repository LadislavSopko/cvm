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
        '/test/file2.txt',
        '/test/file3.txt'
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

describe('VM - fs.listFiles iterator compatibility', () => {
  let vm: VM;
  let fileSystem: FileSystemService;

  beforeEach(() => {
    vm = new VM();
    fileSystem = new MockFileSystemService();
  });

  it('should iterate over array returned by fs.listFiles', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.ITER_START },            // 2
      { op: OpCode.ITER_NEXT },             // 3
      { op: OpCode.JUMP_IF_FALSE, arg: 9 },  // 4 - jump to ITER_END if no more items
      { op: OpCode.STORE, arg: 'file' },     // 5 - store current file
      { op: OpCode.LOAD, arg: 'file' },      // 6 - load file for printing
      { op: OpCode.PRINT },                  // 7 - print it
      { op: OpCode.JUMP, arg: 3 },           // 8 - back to ITER_NEXT
      { op: OpCode.ITER_END },               // 9
      { op: OpCode.HALT }                    // 10
    ];

    // Execute with fileSystem
    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.output).toContain('/test/file1.txt');
    expect(state.output).toContain('/test/file2.txt');
    expect(state.output).toContain('/test/file3.txt');
  });

  it('should handle empty array from fs.listFiles', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: '/empty' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.JUMP_IF_FALSE, arg: 8 },
      { op: OpCode.PUSH, arg: 'Should not reach here' },
      { op: OpCode.PRINT },
      { op: OpCode.JUMP, arg: 3 },
      { op: OpCode.ITER_END },
      { op: OpCode.PUSH, arg: 'No files found' },
      { op: OpCode.PRINT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode, {}, fileSystem);
    
    expect(state.status).toBe('complete');
    expect(state.output).toContain('No files found');
    expect(state.output).not.toContain('Should not reach here');
  });
});