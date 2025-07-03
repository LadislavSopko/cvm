import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('OBJECT_KEYS handler', () => {
  it('should return array of object keys', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object {a: 1, b: 2}
    state.heap.allocate({ a: { type: 'number', value: 1 }, b: { type: 'number', value: 2 } });
    state.stack.push({ type: 'object', value: 0 });
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    
    const result = state.stack.pop()!;
    expect(result.type).toBe('array');
    const keys = state.heap.get(result.value);
    expect(keys).toEqual(['a', 'b']);
  });

  it('should return empty array for empty object', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create empty object {}
    state.heap.allocate({});
    state.stack.push({ type: 'object', value: 0 });
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    
    const result = state.stack.pop()!;
    expect(result.type).toBe('array');
    const keys = state.heap.get(result.value);
    expect(keys).toEqual([]);
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