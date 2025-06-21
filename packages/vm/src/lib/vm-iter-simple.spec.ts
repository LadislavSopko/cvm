import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - Simple Iterator Tests', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should iterate and print all elements', () => {
    const array = createCVMArray(['a', 'b', 'c']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },      // 0
      { op: OpCode.ITER_START },            // 1
      { op: OpCode.ITER_NEXT },             // 2
      { op: OpCode.JUMP_IF_FALSE, arg: 7 }, // 3
      { op: OpCode.STORE, arg: 'x' },       // 4  
      { op: OpCode.JUMP, arg: 2 },          // 5
      { op: OpCode.ITER_END },              // 6
      { op: OpCode.HALT }                   // 7
    ];

    const state = vm.execute(bytecode);
    
    if (state.status === 'error') {
      console.log('Error:', state.error);
    }
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.variables.get('x')).toBe('c'); // Last value
  });
});