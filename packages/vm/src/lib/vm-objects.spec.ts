import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { isCVMString, isCVMObjectRef, CVMObject } from '@cvm/types';

describe('VM Object Operations', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('OBJECT_CREATE', () => {
    it('should create an empty object on the stack', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const ref = state.stack[0];
      expect(isCVMObjectRef(ref)).toBe(true);
      if (isCVMObjectRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('object');
        const obj = heapObj!.data as CVMObject;
        expect(Object.keys(obj.properties).length).toBe(0);
      }
    });
  });

  describe('PROPERTY_SET', () => {
    it('should set a property on an object', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PUSH, arg: 'John' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const ref = state.stack[0];
      expect(isCVMObjectRef(ref)).toBe(true);
      if (isCVMObjectRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('object');
        const obj = heapObj!.data as CVMObject;
        expect(obj.properties['name']).toBe('John');
      }
    });

    it('should error when setting property on non-object', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'not an object' },
        { op: OpCode.PUSH, arg: 'key' },
        { op: OpCode.PUSH, arg: 'value' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.error).toMatch(/Cannot set property/);
    });

    it('should convert numeric keys to strings', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 42 }, // number as key
        { op: OpCode.PUSH, arg: 'value' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.PUSH, arg: "42" }, // string key
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack[0]).toBe('value');
    });
  });

  describe('PROPERTY_GET', () => {
    it('should get a property from an object', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PUSH, arg: 'Alice' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe('Alice');
    });

    it('should return undefined for missing property', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'missing' },
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      expect(result).toMatchObject({ type: 'undefined' });
    });

    it('should error when getting property from null', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 'key' },
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.error).toMatch(/Cannot read property/);
    });

    it('should error when getting property from undefined', () => {
      const state = vm.execute([
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PUSH, arg: 'key' },
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.error).toMatch(/Cannot read property/);
    });

    it('should return undefined for property access on non-objects', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'string value' },
        { op: OpCode.PUSH, arg: 'length' }, // This would be a special case in real JS
        { op: OpCode.PROPERTY_GET },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      expect(result).toMatchObject({ type: 'undefined' });
    });
  });

  describe('JSON_STRINGIFY', () => {
    it('should stringify a simple object', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PUSH, arg: 'John' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.PUSH, arg: 'age' },
        { op: OpCode.PUSH, arg: 30 },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.JSON_STRINGIFY },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      expect(isCVMString(result)).toBe(true);
      if (isCVMString(result)) {
        const parsed = JSON.parse(result as string);
        expect(parsed).toEqual({ name: 'John', age: 30 });
      }
    });

    it('should stringify nested objects', () => {
      const state = vm.execute([
        // Create inner object
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'city' },
        { op: OpCode.PUSH, arg: 'NYC' },
        { op: OpCode.PROPERTY_SET },
        // Store inner object
        { op: OpCode.STORE, arg: 'inner' },
        // Create outer object
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PUSH, arg: 'John' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.PUSH, arg: 'address' },
        { op: OpCode.LOAD, arg: 'inner' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.JSON_STRINGIFY },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      if (isCVMString(result)) {
        const parsed = JSON.parse(result as string);
        expect(parsed).toEqual({ 
          name: 'John', 
          address: { city: 'NYC' } 
        });
      }
    });

    it('should stringify arrays with objects', () => {
      const state = vm.execute([
        // Create array
        { op: OpCode.ARRAY_NEW },
        // Create and push first object
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'id' },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.ARRAY_PUSH },
        // Create and push second object
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'id' },
        { op: OpCode.PUSH, arg: 2 },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.JSON_STRINGIFY },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      if (isCVMString(result)) {
        const parsed = JSON.parse(result as string);
        expect(parsed).toEqual([{ id: 1 }, { id: 2 }]);
      }
    });

    it('should handle undefined values in objects', () => {
      const state = vm.execute([
        { op: OpCode.OBJECT_CREATE },
        { op: OpCode.PUSH, arg: 'name' },
        { op: OpCode.PUSH, arg: 'John' },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.PUSH, arg: 'missing' },
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PROPERTY_SET },
        { op: OpCode.JSON_STRINGIFY },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      const result = state.stack[0];
      if (isCVMString(result)) {
        const parsed = JSON.parse(result as string);
        // undefined values are omitted in JSON
        expect(parsed).toEqual({ name: 'John' });
      }
    });

    it('should stringify primitive values', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.JSON_STRINGIFY },
        { op: OpCode.HALT }
      ]);
      
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe('"hello"');
    });
  });
});