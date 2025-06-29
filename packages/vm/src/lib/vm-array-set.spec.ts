import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - ARRAY_SET', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should set array element at index', () => {
    const array = createCVMArray([10, 20, 30]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: 1 },     // index
      { op: OpCode.PUSH, arg: 99 },    // new value
      { op: OpCode.ARRAY_SET },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(array.elements[1]).toBe(99);
    expect(array.elements).toEqual([10, 99, 30]);
  });

  it('should handle setting element beyond current length', () => {
    const array = createCVMArray([1, 2]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: 5 },     // index beyond length
      { op: OpCode.PUSH, arg: 100 },   // value
      { op: OpCode.ARRAY_SET },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(array.elements[5]).toBe(100);
    expect(array.elements.length).toBe(6);
  });

  it('should ignore non-numeric string index', () => {
    const array = createCVMArray([1, 2, 3]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: "one" }, // non-numeric string index
      { op: OpCode.PUSH, arg: 99 },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.POP }, // Remove the array from stack
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.RETURN }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    // Array should be unchanged - first element should still be 1
    expect(result.returnValue).toBe(1);
  });

  it('should error on negative index', () => {
    const array = createCVMArray([1, 2, 3]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: -1 },    // negative index
      { op: OpCode.PUSH, arg: 99 },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('error');
    expect(result.error).toBe('ARRAY_SET: Negative index not allowed');
  });

  it('should error on non-array target', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "not an array" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: 99 },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('error');
    expect(result.error).toBe('ARRAY_SET requires an array');
  });

  it('should store string values from CC', () => {
    const array = createCVMArray([]);
    // Test that CC values (which are strings) can be stored in arrays
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "42" },     // Simulate CC result
      { op: OpCode.ARRAY_SET },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(array.elements[0]).toBe("42");
  });
});