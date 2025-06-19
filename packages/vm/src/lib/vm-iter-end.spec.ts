import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - ITER_END opcode', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should remove the current iterator', () => {
    const array = createCVMArray(['a', 'b', 'c']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(0); // Iterator removed
    expect(state.stack).toHaveLength(0); // No stack operations
  });

  it('should handle nested iterators correctly', () => {
    const array1 = createCVMArray(['a', 'b']);
    const array2 = createCVMArray([1, 2, 3]);
    
    const bytecode = [
      { op: OpCode.PUSH, arg: array1 },
      { op: OpCode.ITER_START },
      { op: OpCode.PUSH, arg: array2 },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END }, // Remove inner iterator
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(1); // Only outer iterator remains
    expect(state.iterators[0].array).toEqual(array1);
  });

  it('should error when no iterator exists', () => {
    const bytecode = [
      { op: OpCode.ITER_END },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('ITER_END: No active iterator');
  });

  it('should work in a complete foreach loop pattern', () => {
    const array = createCVMArray(['x', 'y']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },    // 0
      { op: OpCode.ITER_START },          // 1
      // Loop start
      { op: OpCode.ITER_NEXT },           // 2
      { op: OpCode.JUMP_IF_FALSE, arg: 7 }, // 3 - Jump to ITER_END
      { op: OpCode.STORE, arg: 'item' },  // 4
      { op: OpCode.POP }, // Remove hasMore // 5
      // Loop body would go here
      { op: OpCode.JUMP, arg: 2 }, // 6 - Jump back to ITER_NEXT
      // Loop end
      { op: OpCode.ITER_END },            // 7
      { op: OpCode.HALT }                 // 8
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(0); // Iterator cleaned up
    expect(state.variables.get('item')).toBe('y'); // Last item
  });

  it('should handle multiple sequential iterators', () => {
    const array1 = createCVMArray(['a']);
    const array2 = createCVMArray(['b']);
    
    const bytecode = [
      // First iterator
      { op: OpCode.PUSH, arg: array1 },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END },
      // Second iterator
      { op: OpCode.PUSH, arg: array2 },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(0);
  });

  it('should not affect the stack', () => {
    const array = createCVMArray([1, 2]);
    const bytecode = [
      { op: OpCode.PUSH, arg: 'before' },
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toBe('before'); // Stack unchanged
  });

  it('should properly clean up nested iterators in reverse order', () => {
    const array1 = createCVMArray(['outer']);
    const array2 = createCVMArray(['inner']);
    
    const bytecode = [
      { op: OpCode.PUSH, arg: array1 },
      { op: OpCode.ITER_START },
      { op: OpCode.PUSH, arg: array2 },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_END }, // Remove inner
      { op: OpCode.ITER_END }, // Remove outer
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(0);
  });

  it('should handle iterator cleanup after partial iteration', () => {
    const array = createCVMArray(['a', 'b', 'c', 'd']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT }, // Get 'a'
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT }, // Get 'b'
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      // Stop iteration early
      { op: OpCode.ITER_END },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(0);
    expect(state.stack).toHaveLength(0);
  });
});