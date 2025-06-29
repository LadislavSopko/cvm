import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Object property access with numeric keys', () => {
  it('should handle numeric index on object property access', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create object
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;

    // Set property '0'
    state.stack.push(objRef);
    state.stack.push('0');
    state.stack.push('first');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });

    // Set property '1'
    state.stack.push(objRef);
    state.stack.push('1');
    state.stack.push('second');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });

    // Clear stack before testing
    state.stack.length = 0;

    // Now test numeric index access
    state.stack.push(objRef);
    state.stack.push(0); // Numeric index
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });

    // Should access property '0'
    expect(state.stack.length).toBe(1);
    expect(state.stack[0]).toEqual('first');
  });

  it('should convert numeric index to string for object properties', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create object
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;

    // Set property '42'
    state.stack.push(objRef);
    state.stack.push('42');
    state.stack.push('answer');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });

    // Clear stack before testing
    state.stack.length = 0;

    // Test numeric index access
    state.stack.push(objRef);
    state.stack.push(42); // Numeric index
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });

    expect(state.stack.length).toBe(1);
    expect(state.stack[0]).toEqual('answer');
  });
});

describe('Array access with string indices', () => {
  it('should handle string indices that are valid array indices', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create array with elements
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push elements
    state.stack.push(arrayRef);
    state.stack.push('first');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    state.stack.push(arrayRef);
    state.stack.push('second');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    state.stack.push(arrayRef);
    state.stack.push('third');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Clear stack
    state.stack.length = 0;
    
    // Access with string index "0"
    state.stack.push(arrayRef);
    state.stack.push('0'); // String index
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    
    expect(state.stack.length).toBe(1);
    expect(state.stack[0]).toEqual('first');
  });

  it('should handle string indices for array set operations', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create array with elements
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push initial elements
    state.stack.push(arrayRef);
    state.stack.push('first');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    state.stack.push(arrayRef);
    state.stack.push('second');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Clear stack
    state.stack.length = 0;
    
    // Set element at string index "1"
    state.stack.push(arrayRef);
    state.stack.push('1'); // String index
    state.stack.push('modified');
    vm.executeInstruction(state, { op: OpCode.ARRAY_SET });
    
    // Clear stack and verify
    state.stack.length = 0;
    state.stack.push(arrayRef);
    state.stack.push(1); // Numeric index
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    
    expect(state.stack[0]).toEqual('modified');
  });

  it('should return undefined for non-numeric string indices on arrays', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create array
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    state.stack.push(arrayRef);
    state.stack.push('element');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Clear stack
    state.stack.length = 0;
    
    // Try to access with non-numeric string
    state.stack.push(arrayRef);
    state.stack.push('foo'); // Non-numeric string
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    
    expect(state.stack.length).toBe(1);
    expect(state.stack[0]).toEqual({ type: 'undefined' });
  });
});

describe('Array properties support', () => {
  it('should store non-numeric string properties on arrays', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create array
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Add numeric elements
    state.stack.push(arrayRef);
    state.stack.push('first');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Set string property
    state.stack.push(arrayRef);
    state.stack.push('foo'); // Non-numeric string key
    state.stack.push('bar'); // Value
    vm.executeInstruction(state, { op: OpCode.ARRAY_SET });
    
    // Clear stack and verify property access
    state.stack.length = 0;
    state.stack.push(arrayRef);
    state.stack.push('foo');
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    
    expect(state.stack.length).toBe(1);
    expect(state.stack[0]).toBe('bar');
  });

  it('should keep array elements and properties separate', () => {
    const vm = new VM();
    const state = vm.createInitialState();

    // Create array
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Add elements
    state.stack.push(arrayRef);
    state.stack.push('element0');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    state.stack.push(arrayRef);
    state.stack.push('element1');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Set string property
    state.stack.push(arrayRef);
    state.stack.push('name');
    state.stack.push('myArray');
    vm.executeInstruction(state, { op: OpCode.ARRAY_SET });
    
    // Verify element access still works
    state.stack.length = 0;
    state.stack.push(arrayRef);
    state.stack.push(0);
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    expect(state.stack[0]).toBe('element0');
    
    // Verify property access
    state.stack.length = 0;
    state.stack.push(arrayRef);
    state.stack.push('name');
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    expect(state.stack[0]).toBe('myArray');
    
    // Verify array length is not affected by properties
    state.stack.length = 0;
    state.stack.push(arrayRef);
    vm.executeInstruction(state, { op: OpCode.ARRAY_LEN });
    expect(state.stack[0]).toBe(2);
  });
});