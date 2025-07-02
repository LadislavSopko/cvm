import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { arraysHandlers } from './arrays.js';
import { VMState } from '../types.js';
import { createCVMArray } from '@cvm/types';

describe('Array new methods', () => {
  let vm: VM;
  let state: VMState;

  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });

  describe('ARRAY_SLICE', () => {
    it('should slice array with start and end indices', () => {
      const array = createCVMArray(['a', 'b', 'c', 'd', 'e']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(1);
      state.stack.push(3);
      
      const handler = arraysHandlers[OpCode.ARRAY_SLICE]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_SLICE });
      
      expect(error).toBeUndefined();
      const resultRef = state.stack.pop()!;
      expect(typeof resultRef).toBe('object');
      expect(resultRef.type).toBe('array-ref');
      const heapObj = state.heap.get(resultRef.id);
      expect(heapObj?.type).toBe('array');
      expect((heapObj?.data as any)?.elements).toEqual(['b', 'c']);
    });

    it('should slice array with only start index', () => {
      const array = createCVMArray(['a', 'b', 'c', 'd', 'e']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(2);
      state.stack.push(undefined);
      
      const handler = arraysHandlers[OpCode.ARRAY_SLICE]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_SLICE });
      
      expect(error).toBeUndefined();
      const resultRef = state.stack.pop()!;
      const heapObj = state.heap.get(resultRef.id);
      expect(heapObj?.type).toBe('array');
      expect((heapObj?.data as any)?.elements).toEqual(['c', 'd', 'e']);
    });

    it('should handle negative indices', () => {
      const array = createCVMArray(['a', 'b', 'c', 'd', 'e']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(-3);
      state.stack.push(-1);
      
      const handler = arraysHandlers[OpCode.ARRAY_SLICE]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_SLICE });
      
      expect(error).toBeUndefined();
      const resultRef = state.stack.pop()!;
      const heapObj = state.heap.get(resultRef.id);
      expect(heapObj?.type).toBe('array');
      expect((heapObj?.data as any)?.elements).toEqual(['c', 'd']);
    });

    it('should return empty array when start >= end', () => {
      const array = createCVMArray(['a', 'b', 'c']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(2);
      state.stack.push(1);
      
      const handler = arraysHandlers[OpCode.ARRAY_SLICE]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_SLICE });
      
      expect(error).toBeUndefined();
      const resultRef = state.stack.pop()!;
      const heapObj = state.heap.get(resultRef.id);
      expect(heapObj?.type).toBe('array');
      expect((heapObj?.data as any)?.elements).toEqual([]);
    });

    it('should return error when target is not an array', () => {
      state.stack.push('not an array');
      state.stack.push(0);
      state.stack.push(1);
      
      const handler = arraysHandlers[OpCode.ARRAY_SLICE]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_SLICE });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('ARRAY_SLICE requires an array');
    });
  });

  describe('ARRAY_JOIN', () => {
    it('should join array elements with separator', () => {
      const array = createCVMArray(['hello', 'world', 'test']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('-');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello-world-test');
    });

    it('should join with default comma separator', () => {
      const array = createCVMArray(['a', 'b', 'c']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(',');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('a,b,c');
    });

    it('should join with empty string separator', () => {
      const array = createCVMArray(['1', '2', '3']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('123');
    });

    it('should convert non-string elements to strings', () => {
      const array = createCVMArray([1, true, null, undefined]);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('|');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('1|true|null|undefined');
    });

    it('should handle empty array', () => {
      const array = createCVMArray([]);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(',');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('');
    });

    it('should return error when target is not an array', () => {
      state.stack.push('not an array');
      state.stack.push(',');
      
      const handler = arraysHandlers[OpCode.ARRAY_JOIN]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_JOIN });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('ARRAY_JOIN requires an array');
    });
  });

  describe('ARRAY_INDEX_OF', () => {
    it('should find index of element in array', () => {
      const array = createCVMArray(['a', 'b', 'c', 'd']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('c');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(2);
    });

    it('should return -1 when element not found', () => {
      const array = createCVMArray(['a', 'b', 'c']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('x');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(-1);
    });

    it('should find first occurrence of duplicate element', () => {
      const array = createCVMArray(['a', 'b', 'a', 'c', 'a']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('a');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(0);
    });

    it('should use strict equality for comparison', () => {
      const array = createCVMArray([1, '1', true, 'true']);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('1');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(1); // Finds string '1', not number 1
    });

    it('should handle null and undefined', () => {
      const array = createCVMArray([null, undefined, 0, false]);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push(null);
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(0);
    });

    it('should handle empty array', () => {
      const array = createCVMArray([]);
      const arrayRef = state.heap.allocate('array', array);
      
      state.stack.push(arrayRef);
      state.stack.push('anything');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(-1);
    });

    it('should return error when target is not an array', () => {
      state.stack.push('not an array');
      state.stack.push('x');
      
      const handler = arraysHandlers[OpCode.ARRAY_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.ARRAY_INDEX_OF });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('ARRAY_INDEX_OF requires an array');
    });
  });
});