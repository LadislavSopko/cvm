import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { isCVMArrayRef, CVMArrayRef, CVMArray } from '@cvm/types';

describe('Array Reference Operations', () => {
  it('should create array reference on ARRAY_NEW', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    
    const result = state.stack[0];
    expect(isCVMArrayRef(result)).toBe(true);
    expect(state.heap.objects.has((result as CVMArrayRef).id)).toBe(true);
  });

  it('should handle ARRAY_PUSH with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create array
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push value
    state.stack.push(arrayRef);
    state.stack.push('hello');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Verify
    const heapArray = state.heap.objects.get((arrayRef as CVMArrayRef).id)!;
    expect((heapArray.data as CVMArray).elements).toEqual(['hello']);
  });

  it('should handle ARRAY_GET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create array with some values
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push some values
    state.stack.push(arrayRef);
    state.stack.push('first');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    state.stack.push(arrayRef);
    state.stack.push('second');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Get element at index 1
    state.stack.push(arrayRef);
    state.stack.push(1);
    vm.executeInstruction(state, { op: OpCode.ARRAY_GET });
    
    // Verify
    expect(state.stack.pop()).toBe('second');
  });

  it('should handle ARRAY_SET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create array with initial value
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    state.stack.push(arrayRef);
    state.stack.push('old');
    vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    
    // Set new value at index 0
    state.stack.push(arrayRef);
    state.stack.push(0);
    state.stack.push('new');
    vm.executeInstruction(state, { op: OpCode.ARRAY_SET });
    
    // Verify
    const heapArray = state.heap.objects.get((arrayRef as CVMArrayRef).id)!;
    expect((heapArray.data as CVMArray).elements[0]).toBe('new');
  });

  it('should handle ARRAY_LEN with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create array with some values
    vm.executeInstruction(state, { op: OpCode.ARRAY_NEW });
    const arrayRef = state.stack.pop()!;
    
    // Push 3 values
    for (let i = 0; i < 3; i++) {
      state.stack.push(arrayRef);
      state.stack.push(`item${i}`);
      vm.executeInstruction(state, { op: OpCode.ARRAY_PUSH });
    }
    
    // Get length
    state.stack.push(arrayRef);
    vm.executeInstruction(state, { op: OpCode.ARRAY_LEN });
    
    // Verify
    expect(state.stack.pop()).toBe(3);
  });
});