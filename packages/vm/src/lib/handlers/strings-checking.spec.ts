import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { advancedHandlers } from './advanced.js';
import type { VMState } from '../vm.js';

describe('String checking methods', () => {
  let vm: VM;
  let state: VMState;

  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });

  describe('STRING_INCLUDES', () => {
    it('should return true when string contains search string', () => {
      state.stack.push('hello world');
      state.stack.push('world');
      
      const handler = advancedHandlers[OpCode.STRING_INCLUDES]!;
      const error = handler.execute(state, { op: OpCode.STRING_INCLUDES });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should return false when string does not contain search string', () => {
      state.stack.push('hello world');
      state.stack.push('foo');
      
      const handler = advancedHandlers[OpCode.STRING_INCLUDES]!;
      const error = handler.execute(state, { op: OpCode.STRING_INCLUDES });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(false);
    });

    it('should handle empty search string', () => {
      state.stack.push('hello world');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_INCLUDES]!;
      const error = handler.execute(state, { op: OpCode.STRING_INCLUDES });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should convert non-string search value to string', () => {
      state.stack.push('hello 123 world');
      state.stack.push(123);
      
      const handler = advancedHandlers[OpCode.STRING_INCLUDES]!;
      const error = handler.execute(state, { op: OpCode.STRING_INCLUDES });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      
      const handler = advancedHandlers[OpCode.STRING_INCLUDES]!;
      const error = handler.execute(state, { op: OpCode.STRING_INCLUDES });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_INCLUDES requires a string');
    });
  });

  describe('STRING_ENDS_WITH', () => {
    it('should return true when string ends with search string', () => {
      state.stack.push('hello world');
      state.stack.push('world');
      
      const handler = advancedHandlers[OpCode.STRING_ENDS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_ENDS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should return false when string does not end with search string', () => {
      state.stack.push('hello world');
      state.stack.push('hello');
      
      const handler = advancedHandlers[OpCode.STRING_ENDS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_ENDS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(false);
    });

    it('should handle empty search string', () => {
      state.stack.push('hello world');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_ENDS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_ENDS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should be case sensitive', () => {
      state.stack.push('hello WORLD');
      state.stack.push('world');
      
      const handler = advancedHandlers[OpCode.STRING_ENDS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_ENDS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(false);
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      
      const handler = advancedHandlers[OpCode.STRING_ENDS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_ENDS_WITH });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_ENDS_WITH requires a string');
    });
  });

  describe('STRING_STARTS_WITH', () => {
    it('should return true when string starts with search string', () => {
      state.stack.push('hello world');
      state.stack.push('hello');
      
      const handler = advancedHandlers[OpCode.STRING_STARTS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_STARTS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should return false when string does not start with search string', () => {
      state.stack.push('hello world');
      state.stack.push('world');
      
      const handler = advancedHandlers[OpCode.STRING_STARTS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_STARTS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(false);
    });

    it('should handle empty search string', () => {
      state.stack.push('hello world');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_STARTS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_STARTS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should handle file path patterns', () => {
      state.stack.push('/home/user/documents/file.txt');
      state.stack.push('/home');
      
      const handler = advancedHandlers[OpCode.STRING_STARTS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_STARTS_WITH });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe(true);
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      
      const handler = advancedHandlers[OpCode.STRING_STARTS_WITH]!;
      const error = handler.execute(state, { op: OpCode.STRING_STARTS_WITH });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_STARTS_WITH requires a string');
    });
  });
});