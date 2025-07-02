import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { advancedHandlers } from './advanced.js';
import { VMState } from '../types.js';

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
});