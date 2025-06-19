import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - ITER_NEXT opcode', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should push first element and true for non-empty array', () => {
    const array = createCVMArray(['a', 'b', 'c']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe('a'); // First element
    expect(state.stack[1]).toBe(true); // hasMore flag
    expect(state.iterators[0].index).toBe(1); // Index advanced
  });

  it('should advance through array elements correctly', () => {
    const array = createCVMArray(['x', 'y', 'z']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe('z'); // Last element
    expect(state.stack[1]).toBe(true); // Still has more (at last element)
    expect(state.iterators[0].index).toBe(3); // Index at end
  });

  it('should push undefined and false when past end of array', () => {
    const array = createCVMArray(['only']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT }, // Past end
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe(null); // No more elements
    expect(state.stack[1]).toBe(false); // hasMore is false
  });

  it('should handle empty arrays correctly', () => {
    const array = createCVMArray([]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe(null);
    expect(state.stack[1]).toBe(false);
  });

  it('should error when no iterator exists', () => {
    const bytecode = [
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('ITER_NEXT: No active iterator');
  });

  it('should work with nested iterators', () => {
    const array1 = createCVMArray(['a', 'b']);
    const array2 = createCVMArray([1, 2, 3]);
    
    const bytecode = [
      { op: OpCode.PUSH, arg: array1 },
      { op: OpCode.ITER_START },
      { op: OpCode.PUSH, arg: array2 },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT }, // From array2
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe(1); // From inner iterator
    expect(state.stack[1]).toBe(true);
    expect(state.iterators[1].index).toBe(1); // Inner iterator advanced
    expect(state.iterators[0].index).toBe(0); // Outer iterator unchanged
  });

  it('should handle arrays with null and undefined elements', () => {
    const array = createCVMArray([null, null, 'value']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove null
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe(null); // The null element
    expect(state.stack[1]).toBe(true); // Still has more
  });

  it('should maintain correct stack order (element, then hasMore)', () => {
    const array = createCVMArray([42]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.ITER_NEXT },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    // Stack grows upward, so index 0 is bottom
    expect(state.stack[0]).toBe(42);    // Element pushed first
    expect(state.stack[1]).toBe(true);  // hasMore pushed second
  });

  it('should work with array snapshot (modifications dont affect iteration)', () => {
    const array = createCVMArray(['a', 'b']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      // Modify original array after iterator created
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: 'c' },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.POP }, // Remove the array
      // Continue iteration
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT },
      { op: OpCode.POP }, // Remove hasMore
      { op: OpCode.POP }, // Remove element
      { op: OpCode.ITER_NEXT }, // Should be at end (no 'c')
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(2);
    expect(state.stack[0]).toBe(null); // No 'c' in snapshot
    expect(state.stack[1]).toBe(false); // At end
  });
});