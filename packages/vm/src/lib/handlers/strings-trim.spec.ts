import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { advancedHandlers } from './advanced.js';
import { VMState } from '../types.js';

describe('String trim methods', () => {
  let vm: VM;
  let state: VMState;

  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });

  describe('STRING_TRIM', () => {
    it('should trim whitespace from both ends', () => {
      state.stack.push('  hello world  ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should handle string with only leading whitespace', () => {
      state.stack.push('   hello world');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should handle string with only trailing whitespace', () => {
      state.stack.push('hello world   ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should handle string with no whitespace', () => {
      state.stack.push('hello world');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should handle empty string', () => {
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('');
    });

    it('should handle string with only whitespace', () => {
      state.stack.push('   ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('');
    });

    it('should handle various whitespace characters', () => {
      state.stack.push('\t\n\r hello \t\n\r');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      
      const handler = advancedHandlers[OpCode.STRING_TRIM]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_TRIM requires a string');
    });
  });

  describe('STRING_TRIM_START', () => {
    it('should trim whitespace from start only', () => {
      state.stack.push('  hello world  ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world  ');
    });

    it('should handle string with only leading whitespace', () => {
      state.stack.push('   hello world');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should not affect trailing whitespace', () => {
      state.stack.push('hello world   ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world   ');
    });

    it('should handle various leading whitespace characters', () => {
      state.stack.push('\t\n\r hello world');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_START });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_START]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_START });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_TRIM_START requires a string');
    });
  });

  describe('STRING_TRIM_END', () => {
    it('should trim whitespace from end only', () => {
      state.stack.push('  hello world  ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('  hello world');
    });

    it('should not affect leading whitespace', () => {
      state.stack.push('   hello world');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('   hello world');
    });

    it('should handle string with only trailing whitespace', () => {
      state.stack.push('hello world   ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should handle various trailing whitespace characters', () => {
      state.stack.push('hello world\t\n\r ');
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_END });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      
      const handler = advancedHandlers[OpCode.STRING_TRIM_END]!;
      const error = handler.execute(state, { op: OpCode.STRING_TRIM_END });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_TRIM_END requires a string');
    });
  });
});