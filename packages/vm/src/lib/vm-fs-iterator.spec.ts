import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - fs.listFiles iterator compatibility', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should iterate over array returned by resumeWithFsResult', () => {
    // First, simulate fs.listFiles call
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

    // Execute until waiting_fs
    const state1 = vm.execute(bytecode);
    expect(state1.status).toBe('waiting_fs');

    // Simulate file system result - this is what fileSystem.listFiles returns
    const fsResult = createCVMArray([
      '/test/file1.txt',
      '/test/file2.txt',
      '/test/file3.txt'
    ]);

    // Resume with the result
    const state2 = vm.resumeWithFsResult(state1, fsResult, bytecode);
    
    expect(state2.status).toBe('complete');
    expect(state2.error).toBeUndefined();
    expect(state2.output).toContain('/test/file1.txt');
    expect(state2.output).toContain('/test/file2.txt');
    expect(state2.output).toContain('/test/file3.txt');
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

    const state1 = vm.execute(bytecode);
    expect(state1.status).toBe('waiting_fs');

    // Empty array result
    const fsResult = createCVMArray([]);

    const state2 = vm.resumeWithFsResult(state1, fsResult, bytecode);
    
    expect(state2.status).toBe('complete');
    expect(state2.output).toContain('No files found');
    expect(state2.output).not.toContain('Should not reach here');
  });
});