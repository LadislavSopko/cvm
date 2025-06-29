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