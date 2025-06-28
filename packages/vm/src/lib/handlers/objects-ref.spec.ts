import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { isCVMObjectRef, CVMObjectRef, CVMObject } from '@cvm/types';

describe('Object Reference Operations', () => {
  it('should create object reference on OBJECT_CREATE', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    
    const result = state.stack[0];
    expect(isCVMObjectRef(result)).toBe(true);
  });

  it('should handle PROPERTY_SET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    // Set property
    state.stack.push(objRef);
    state.stack.push('key');
    state.stack.push('value');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    
    // Verify
    const heapObj = state.heap.objects.get((objRef as CVMObjectRef).id)!;
    expect((heapObj.data as CVMObject).properties['key']).toBe('value');
  });

  it('should handle PROPERTY_GET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object and set property
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    state.stack.push(objRef);
    state.stack.push('name');
    state.stack.push('John');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    
    // Get property
    state.stack.push(objRef);
    state.stack.push('name');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_GET });
    
    // Verify
    expect(state.stack.pop()).toBe('John');
  });

  it('should handle multiple PROPERTY_SET with references', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object and set properties
    vm.executeInstruction(state, { op: OpCode.OBJECT_CREATE });
    const objRef = state.stack.pop()!;
    
    state.stack.push(objRef);
    state.stack.push('prop1');
    state.stack.push('value1');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    
    state.stack.push(objRef);
    state.stack.push('prop2');
    state.stack.push('value2');
    vm.executeInstruction(state, { op: OpCode.PROPERTY_SET });
    
    // Verify both properties exist
    const heapObj = state.heap.objects.get((objRef as CVMObjectRef).id)!;
    const properties = (heapObj.data as CVMObject).properties;
    expect(properties['prop1']).toBe('value1');
    expect(properties['prop2']).toBe('value2');
  });
});