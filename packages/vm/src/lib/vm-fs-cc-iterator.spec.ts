import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - fs.listFiles with CC and iterator', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should maintain iterator state across CC calls', () => {
    // This simulates what analyze-directory.ts does
    const bytecode = [
      // Get files
      { op: OpCode.PUSH, arg: '/test' },
      { op: OpCode.FS_LIST_FILES },
      { op: OpCode.STORE, arg: 'files' },     // 2
      { op: OpCode.POP },                     // 3
      
      // Start iteration
      { op: OpCode.LOAD, arg: 'files' },      // 4
      { op: OpCode.ITER_START },              // 5
      
      // Loop start
      { op: OpCode.ITER_NEXT },               // 6
      { op: OpCode.JUMP_IF_FALSE, arg: 19 }, // 7 - exit if no more
      { op: OpCode.STORE, arg: 'file' },      // 8
      { op: OpCode.POP },                     // 9
      
      // Print current file
      { op: OpCode.LOAD, arg: 'file' },       // 10
      { op: OpCode.PRINT },                   // 11
      
      // Simulate CC call
      { op: OpCode.PUSH, arg: 'Process file?' }, // 12
      { op: OpCode.CC },                         // 13
      { op: OpCode.STORE, arg: 'result' },       // 14
      { op: OpCode.POP },                        // 15
      
      // Print CC result
      { op: OpCode.LOAD, arg: 'result' },        // 16
      { op: OpCode.PRINT },                      // 17
      
      // Continue loop
      { op: OpCode.JUMP, arg: 6 },               // 18
      
      // End loop
      { op: OpCode.ITER_END },                   // 19
      { op: OpCode.HALT }                        // 20
    ];

    // Execute until fs.listFiles
    const state1 = vm.execute(bytecode);
    expect(state1.status).toBe('waiting_fs');

    // Resume with files
    const fsResult = createCVMArray([
      '/test/file1.txt',
      '/test/file2.txt'
    ]);
    const state2 = vm.resumeWithFsResult(state1, fsResult, bytecode);
    
    // Should now be waiting for first CC
    expect(state2.status).toBe('waiting_cc');
    expect(state2.output).toContain('/test/file1.txt');
    
    // Resume after first CC
    const state3 = vm.resume(state2, 'Processing file 1', bytecode);
    
    // Should be waiting for second CC
    expect(state3.status).toBe('waiting_cc');
    expect(state3.output).toContain('Processing file 1');
    expect(state3.output).toContain('/test/file2.txt');
    
    // Resume after second CC
    const state4 = vm.resume(state3, 'Processing file 2', bytecode);
    
    // Should be complete
    expect(state4.status).toBe('complete');
    expect(state4.output).toContain('Processing file 2');
    expect(state4.error).toBeUndefined();
  });
});