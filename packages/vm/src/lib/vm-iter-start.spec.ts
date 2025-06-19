import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - ITER_START opcode', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should initialize iterator for a valid array', () => {
    const array = createCVMArray(['a', 'b', 'c']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(1);
    expect(state.iterators[0].array).toEqual(array);
    expect(state.iterators[0].index).toBe(0);
    expect(state.stack).toHaveLength(0); // ITER_START consumes the array
  });

  it('should handle empty arrays', () => {
    const emptyArray = createCVMArray([]);
    const bytecode = [
      { op: OpCode.PUSH, arg: emptyArray },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(1);
    expect(state.iterators[0].array.elements).toHaveLength(0);
    expect(state.iterators[0].index).toBe(0);
  });

  it('should error on non-array values', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'not an array' },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('TypeError: Cannot iterate over non-array value');
    expect(state.iterators).toHaveLength(0);
  });

  it('should error on null value', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: null },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('TypeError: Cannot iterate over null or undefined');
    expect(state.iterators).toHaveLength(0);
  });

  it('should error on undefined value', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: undefined },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('TypeError: Cannot iterate over null or undefined');
    expect(state.iterators).toHaveLength(0);
  });

  it('should handle stack underflow', () => {
    const bytecode = [
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('ITER_START: Stack underflow');
  });

  it('should support nested iterators', () => {
    const array1 = createCVMArray(['a', 'b']);
    const array2 = createCVMArray([1, 2, 3]);
    
    const bytecode = [
      { op: OpCode.PUSH, arg: array1 },
      { op: OpCode.ITER_START },
      { op: OpCode.PUSH, arg: array2 },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(2);
    expect(state.iterators[0].array).toEqual(array1);
    expect(state.iterators[1].array).toEqual(array2);
  });

  it('should limit iterator depth to prevent stack overflow', () => {
    const bytecode = [];
    
    // Try to create 11 iterators (limit should be 10)
    for (let i = 0; i < 11; i++) {
      bytecode.push(
        { op: OpCode.PUSH, arg: createCVMArray([i]) },
        { op: OpCode.ITER_START }
      );
    }
    bytecode.push({ op: OpCode.HALT });

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('error');
    expect(state.error).toBe('RuntimeError: Maximum iterator depth exceeded');
    expect(state.iterators.length).toBeLessThanOrEqual(10);
  });

  it('should create a snapshot of the array', () => {
    const array = createCVMArray(['a', 'b', 'c']);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    // Modify the original array after iterator creation
    array.elements.push('d');
    
    // Iterator should still have the original snapshot
    expect(state.iterators[0].array.elements).toHaveLength(3);
    expect(state.iterators[0].array.elements).toEqual(['a', 'b', 'c']);
  });

  it('should handle arrays with mixed types including null and undefined', () => {
    const array = createCVMArray(['string', 42, true, null, undefined, createCVMArray([1, 2])]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.ITER_START },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.error).toBeUndefined();
    expect(state.iterators).toHaveLength(1);
    expect(state.iterators[0].array.elements).toHaveLength(6);
  });
});