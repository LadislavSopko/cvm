import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Object iterator handlers', () => {
  it('should start object iteration', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object {a: 1, b: 2}
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    // Set property a = 1
    state.stack.push(objRef);
    state.stack.push('a');
    state.stack.push(1);
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    state.stack.pop(); // Remove returned object ref
    
    // Set property b = 2
    state.stack.push(objRef);
    state.stack.push('b');
    state.stack.push(2);
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    state.stack.pop(); // Remove returned object ref
    
    // Push object and start iteration
    state.stack.push(objRef);
    vm.executeInstruction(state, { op: OpCode.OBJECT_ITER_START });
    
    // Should setup iterator context
    expect(state.iterators.length).toBe(1);
    expect(state.iterators[0].keys).toEqual(['a', 'b']);
    expect(state.iterators[0].index).toBe(0);
  });

  it('should get next key in iteration', () => {
    // Test OBJECT_ITER_NEXT
  });

  it('should handle empty objects', () => {
    // Test iteration over {}
  });
});