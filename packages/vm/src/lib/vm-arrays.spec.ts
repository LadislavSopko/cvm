import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { isCVMNumber, isCVMArrayRef, isCVMObjectRef, CVMArray, CVMObject, CVMObjectRef } from '@cvm/types';

describe('VM Array Operations', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('ARRAY_NEW', () => {
    it('should create an empty array', () => {
      const state = vm.execute([
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      const ref = state.stack[0];
      expect(isCVMArrayRef(ref)).toBe(true);
      if (isCVMArrayRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('array');
        const arr = heapObj!.data as CVMArray;
        expect(arr.elements.length).toBe(0);
      }
    });
  });

  describe('ARRAY_PUSH', () => {
    it('should push elements to array', () => {
      const state = vm.execute([
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      const ref = state.stack[0];
      expect(isCVMArrayRef(ref)).toBe(true);
      if (isCVMArrayRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('array');
        const arr = heapObj!.data as CVMArray;
        expect(arr.elements.length).toBe(2);
        expect(arr.elements[0]).toBe('hello');
        expect(arr.elements[1]).toBe(123);
      }
    });

    it('should error when pushing to non-array', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'not-an-array' },
        { op: OpCode.PUSH, arg: 'value' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.HALT }
      ]);

      expect(state.status).toBe('error');
      expect(state.error).toContain('ARRAY_PUSH requires an array');
    });
  });

  describe('ARRAY_GET', () => {
    it('should get element by index', () => {
      const state = vm.execute([
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 'first' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 'second' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.ARRAY_GET },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe('second');
    });

    it('should return null for out-of-bounds index', () => {
      const state = vm.execute([
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 'only-one' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.ARRAY_GET },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toEqual({ type: 'undefined' });
    });
  });

  describe('ARRAY_LEN', () => {
    it('should return array length', () => {
      const state = vm.execute([
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 'a' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 'b' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 'c' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.ARRAY_LEN },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe(3);
      expect(isCVMNumber(state.stack[0])).toBe(true);
    });
  });

  describe('JSON_PARSE', () => {
    it('should parse valid JSON array', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: '["a", "b", "c"]' },
        { op: OpCode.JSON_PARSE },
        { op: OpCode.HALT }
      ]);

      expect(state.stack.length).toBe(1);
      const ref = state.stack[0];
      expect(isCVMArrayRef(ref)).toBe(true);
      if (isCVMArrayRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('array');
        const arr = heapObj!.data as CVMArray;
        expect(arr.elements).toEqual(['a', 'b', 'c']);
      }
    });

    it('should parse JSON with mixed types', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: '[1, true, "text", null]' },
        { op: OpCode.JSON_PARSE },
        { op: OpCode.HALT }
      ]);

      const ref = state.stack[0];
      expect(isCVMArrayRef(ref)).toBe(true);
      if (isCVMArrayRef(ref)) {
        const heapObj = state.heap.get(ref.id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('array');
        const arr = heapObj!.data as CVMArray;
        expect(arr.elements).toEqual([1, true, 'text', null]);
      }
    });

    it('should return null for invalid JSON', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'not json' },
        { op: OpCode.JSON_PARSE },
        { op: OpCode.HALT }
      ]);

      expect(state.stack[0]).toBe(null);
    });

    it('should parse JSON objects', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: '{"name": "John", "age": 30}' },
        { op: OpCode.JSON_PARSE },
        { op: OpCode.HALT }
      ]);

      const ref = state.stack[0];
      expect(isCVMObjectRef(ref)).toBe(true);
      if (isCVMObjectRef(ref)) {
        const heapObj = state.heap.get((ref as CVMObjectRef).id);
        expect(heapObj).toBeDefined();
        expect(heapObj!.type).toBe('object');
        const obj = heapObj!.data as CVMObject;
        expect(obj.properties['name']).toBe('John');
        expect(obj.properties['age']).toBe(30);
      }
    });
  });

  describe('TYPEOF', () => {
    it('should return correct types', () => {
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.TYPEOF },
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.TYPEOF },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.TYPEOF },
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.TYPEOF },
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.TYPEOF },
        { op: OpCode.HALT }
      ]);

      expect(state.stack).toEqual(['string', 'number', 'boolean', 'null', 'array']);
    });
  });
});