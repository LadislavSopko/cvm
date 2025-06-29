import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { createCVMObject } from '@cvm/types';
import { arrayHandlers } from './arrays.js';
import { VM } from '../vm.js';

describe('Array Handlers', () => {
  describe('ARRAY_GET', () => {
    it('should return error when ARRAY_GET used on object', () => {
      const vm = new VM();
      const state = vm.createInitialState();
      const objRef = state.heap.allocate('object', createCVMObject());
      state.stack.push(objRef);
      state.stack.push('key');
      
      const result = arrayHandlers[OpCode.ARRAY_GET]!.execute(state, { op: OpCode.ARRAY_GET });
      expect(result?.type).toBe('RuntimeError');
      expect(result?.message).toContain('ARRAY_GET requires an array');
    });
  });

  describe('ARRAY_SET', () => {
    it('should return error when ARRAY_SET used on object', () => {
      const vm = new VM();
      const state = vm.createInitialState();
      const objRef = state.heap.allocate('object', createCVMObject());
      state.stack.push(objRef);
      state.stack.push('key');
      state.stack.push('value');
      
      const result = arrayHandlers[OpCode.ARRAY_SET]!.execute(state, { op: OpCode.ARRAY_SET });
      expect(result?.type).toBe('RuntimeError');
      expect(result?.message).toContain('ARRAY_SET requires an array');
    });
  });
});