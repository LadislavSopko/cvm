import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('OBJECT_KEYS handler', () => {
  it('should return array of object keys', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object {a: 1, b: 2}
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    // Set property a = 1
    state.stack.push(objRef);
    state.stack.push('a');
    state.stack.push({ type: 'number', value: 1 });
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    state.stack.pop(); // Remove returned object ref
    
    // Set property b = 2
    state.stack.push(objRef);
    state.stack.push('b');
    state.stack.push({ type: 'number', value: 2 });
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    state.stack.pop(); // Remove returned object ref
    
    // Test Object.keys()
    state.stack.push(objRef);
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    
    const result = state.stack.pop()!;
    expect(result.type).toBe('array-ref');
    const keysArray = state.heap.get(result.id);
    expect(keysArray.data.elements).toHaveLength(2);
    expect(keysArray.data.elements[0]).toEqual({ type: 'string', value: 'a' });
    expect(keysArray.data.elements[1]).toEqual({ type: 'string', value: 'b' });
  });

  it('should return empty array for empty object', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create empty object {}
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    // Test Object.keys() on empty object
    state.stack.push(objRef);
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    
    const result = state.stack.pop()!;
    expect(result.type).toBe('array-ref');
    const keysArray = state.heap.get(result.id);
    expect(keysArray.data.elements).toHaveLength(0);
  });

  it('should return null for non-object values', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Test with null
    state.stack.push({ type: 'null', value: null });
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    let result = state.stack.pop()!;
    expect(result.type).toBe('null');
    expect(result.value).toBe(null);
    
    // Test with number
    state.stack.push({ type: 'number', value: 42 });
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    result = state.stack.pop()!;
    expect(result.type).toBe('null');
    expect(result.value).toBe(null);
    
    // Test with string
    state.stack.push({ type: 'string', value: 'test' });
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    result = state.stack.pop()!;
    expect(result.type).toBe('null');
    expect(result.value).toBe(null);
  });
});