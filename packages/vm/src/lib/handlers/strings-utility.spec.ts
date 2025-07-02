import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { advancedHandlers } from './advanced.js';
import type { VMState } from '../vm.js';

describe('String utility methods', () => {
  let vm: VM;
  let state: VMState;

  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });

  describe('STRING_LAST_INDEX_OF', () => {
    it('should find last occurrence of substring', () => {
      state.stack.push('hello world hello');
      state.stack.push('hello');
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(12);
    });

    it('should return -1 when not found', () => {
      state.stack.push('hello world');
      state.stack.push('foo');
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(-1);
    });

    it('should find last dot in file path', () => {
      state.stack.push('file.spec.test.ts');
      state.stack.push('.');
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(14);
    });

    it('should handle empty search string', () => {
      state.stack.push('hello');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(5);
    });

    it('should convert non-string search value to string', () => {
      state.stack.push('test123test456');
      state.stack.push(123);
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(4);
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      
      const handler = advancedHandlers[OpCode.STRING_LAST_INDEX_OF]!;
      const error = handler.execute(state, { op: OpCode.STRING_LAST_INDEX_OF });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_LAST_INDEX_OF requires a string');
    });
  });

  describe('STRING_REPEAT', () => {
    it('should repeat string specified number of times', () => {
      state.stack.push('ha');
      state.stack.push(3);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hahaha');
    });

    it('should repeat string zero times to empty string', () => {
      state.stack.push('hello');
      state.stack.push(0);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('');
    });

    it('should handle floating point counts by flooring', () => {
      state.stack.push('x');
      state.stack.push(3.7);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('xxx');
    });

    it('should create separator lines', () => {
      state.stack.push('=');
      state.stack.push(50);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('==================================================');
    });

    it('should handle empty string', () => {
      state.stack.push('');
      state.stack.push(5);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push(3);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_REPEAT requires a string');
    });

    it('should return error for negative count', () => {
      state.stack.push('test');
      state.stack.push(-1);
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_REPEAT requires non-negative number');
    });

    it('should return error for non-numeric count', () => {
      state.stack.push('test');
      state.stack.push('abc');
      
      const handler = advancedHandlers[OpCode.STRING_REPEAT]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPEAT });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_REPEAT requires non-negative number');
    });
  });

  describe('STRING_PAD_START', () => {
    it('should pad string from start to target length', () => {
      state.stack.push('5');
      state.stack.push(3);
      state.stack.push('0');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('005');
    });

    it('should pad with default space when padString is empty', () => {
      state.stack.push('test');
      state.stack.push(8);
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('    test');
    });

    it('should repeat pad string as needed', () => {
      state.stack.push('test');
      state.stack.push(10);
      state.stack.push('ab');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('abababtest');
    });

    it('should return original string if already at target length', () => {
      state.stack.push('hello');
      state.stack.push(5);
      state.stack.push('x');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello');
    });

    it('should return original string if longer than target', () => {
      state.stack.push('hello world');
      state.stack.push(5);
      state.stack.push('x');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should convert non-string pad value to string', () => {
      state.stack.push('42');
      state.stack.push(5);
      state.stack.push(0);
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('00042');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push(5);
      state.stack.push('0');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_PAD_START requires a string');
    });

    it('should return error when length is not a number', () => {
      state.stack.push('test');
      state.stack.push('abc');
      state.stack.push('0');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_START });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_PAD_START requires number for length');
    });
  });

  describe('STRING_PAD_END', () => {
    it('should pad string from end to target length', () => {
      state.stack.push('Name');
      state.stack.push(10);
      state.stack.push('.');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('Name......');
    });

    it('should pad with default space when padString is empty', () => {
      state.stack.push('test');
      state.stack.push(8);
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('test    ');
    });

    it('should repeat pad string as needed', () => {
      state.stack.push('test');
      state.stack.push(10);
      state.stack.push('xy');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('testxyxyxy');
    });

    it('should return original string if already at target length', () => {
      state.stack.push('hello');
      state.stack.push(5);
      state.stack.push('x');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello');
    });

    it('should return original string if longer than target', () => {
      state.stack.push('hello world');
      state.stack.push(5);
      state.stack.push('x');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should convert non-string pad value to string', () => {
      state.stack.push('Price');
      state.stack.push(10);
      state.stack.push(false);
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('Pricefalse');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push(5);
      state.stack.push('0');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_PAD_END requires a string');
    });

    it('should return error when length is not a number', () => {
      state.stack.push('test');
      state.stack.push('abc');
      state.stack.push('0');
      
      const handler = advancedHandlers[OpCode.STRING_PAD_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_PAD_END });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_PAD_END requires number for length');
    });
  });
});