import { describe, it, expect, beforeEach } from 'vitest';
import { VMManager } from './vm-manager.js';
import { VMState } from './vm.js';
import { createVMHeap } from './vm-heap.js';

describe('VMManager', () => {
  let vmManager: VMManager;

  beforeEach(() => {
    vmManager = new VMManager();
  });

  describe('Centralized state serialization', () => {
    it('should correctly serialize and deserialize VM state', () => {
      const originalState: VMState = {
        pc: 10,
        stack: [1, "test", true],
        variables: new Map([["x", 5], ["y", "hello"]] as [string, any][]),
        heap: createVMHeap(),
        iterators: [],
        status: 'running',
        error: undefined,
        ccPrompt: undefined,
        output: [],
        returnValue: undefined
      };
      
      // These methods don't exist yet - test should fail
      const serialized = (vmManager as any).serializeVMState(originalState);
      const deserialized = (vmManager as any).deserializeVMState(serialized);
      
      expect(deserialized.pc).toBe(originalState.pc);
      expect(deserialized.stack).toEqual(originalState.stack);
      expect(deserialized.variables.get("x")).toBe(5);
      expect(deserialized.variables.get("y")).toBe("hello");
      expect(deserialized.status).toBe(originalState.status);
    });

    it('should handle VM state with heap objects', () => {
      const state: VMState = {
        pc: 5,
        stack: [],
        variables: new Map(),
        heap: createVMHeap(),
        iterators: [],
        status: 'running',
        error: undefined,
        ccPrompt: undefined,
        output: [],
        returnValue: undefined
      };

      // Add array to heap
      const arrayRef = state.heap.allocate('array', {
        type: 'array',
        elements: [1, 2, 3]
      });
      
      // Add object to heap
      const objRef = state.heap.allocate('object', {
        type: 'object',
        properties: { name: 'test', value: 42 }
      });

      state.stack.push(arrayRef, objRef);
      
      // These methods don't exist yet - test should fail
      const serialized = (vmManager as any).serializeVMState(state);
      const deserialized = (vmManager as any).deserializeVMState(serialized);
      
      expect(deserialized.heap.objects.size).toBe(2);
      expect(deserialized.stack).toHaveLength(2);
      expect(deserialized.stack[0]).toMatchObject({ type: 'array-ref', id: expect.any(Number) });
      expect(deserialized.stack[1]).toMatchObject({ type: 'object-ref', id: expect.any(Number) });
    });

    it('should preserve all VMState fields during serialization', () => {
      const state: VMState = {
        pc: 25,
        stack: ['foo', 123, false, null],
        variables: new Map([
          ['var1', 'value1'],
          ['var2', 99],
          ['var3', true]
        ] as [string, any][]),
        heap: createVMHeap(),
        iterators: [{ array: { type: 'array', elements: [] }, index: 0, length: 0 }],
        status: 'waiting_cc',
        error: undefined,
        ccPrompt: 'What is next?',
        output: ['Line 1', 'Line 2'],
        returnValue: 'result'
      };
      
      // These methods don't exist yet - test should fail
      const serialized = (vmManager as any).serializeVMState(state);
      const deserialized = (vmManager as any).deserializeVMState(serialized);
      
      expect(deserialized.pc).toBe(state.pc);
      expect(deserialized.stack).toEqual(state.stack);
      expect(deserialized.variables.size).toBe(3);
      expect(deserialized.variables.get('var1')).toBe('value1');
      expect(deserialized.variables.get('var2')).toBe(99);
      expect(deserialized.variables.get('var3')).toBe(true);
      expect(deserialized.iterators).toEqual(state.iterators);
      expect(deserialized.status).toBe(state.status);
      expect(deserialized.ccPrompt).toBe(state.ccPrompt);
      expect(deserialized.output).toEqual(state.output);
      expect(deserialized.returnValue).toBe(state.returnValue);
    });
  });
});