import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { advancedHandlers } from './advanced.js';
import { VMState } from '../types.js';

describe('String replace methods', () => {
  let vm: VM;
  let state: VMState;

  beforeEach(() => {
    vm = new VM();
    state = vm.createInitialState();
  });

  describe('STRING_REPLACE', () => {
    it('should replace first occurrence only', () => {
      state.stack.push('hello world hello');
      state.stack.push('hello');
      state.stack.push('hi');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hi world hello');
    });

    it('should handle no matches', () => {
      state.stack.push('hello world');
      state.stack.push('foo');
      state.stack.push('bar');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should replace with empty string', () => {
      state.stack.push('hello world');
      state.stack.push('hello ');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('world');
    });

    it('should handle empty search string', () => {
      state.stack.push('hello');
      state.stack.push('');
      state.stack.push('X');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('Xhello');
    });

    it('should convert non-string search and replacement to string', () => {
      state.stack.push('hello 123 world');
      state.stack.push(123);
      state.stack.push(456);
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello 456 world');
    });

    it('should handle file path replacement', () => {
      state.stack.push('/home/user/documents/file.txt');
      state.stack.push('/home/user');
      state.stack.push('~');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('~/documents/file.txt');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      state.stack.push('replacement');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_REPLACE requires a string');
    });
  });

  describe('STRING_REPLACE_ALL', () => {
    it('should replace all occurrences', () => {
      state.stack.push('hello world hello');
      state.stack.push('hello');
      state.stack.push('hi');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hi world hi');
    });

    it('should handle multiple replacements', () => {
      state.stack.push('a-b-c-d-e');
      state.stack.push('-');
      state.stack.push('/');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('a/b/c/d/e');
    });

    it('should handle no matches', () => {
      state.stack.push('hello world');
      state.stack.push('foo');
      state.stack.push('bar');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('hello world');
    });

    it('should replace all with empty string', () => {
      state.stack.push('hello world');
      state.stack.push(' ');
      state.stack.push('');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('helloworld');
    });

    it('should handle path separator replacement', () => {
      state.stack.push('/home/user/documents/file.txt');
      state.stack.push('/');
      state.stack.push('\\\\');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('\\\\home\\\\user\\\\documents\\\\file.txt');
    });

    it('should handle overlapping replacements', () => {
      state.stack.push('aaaa');
      state.stack.push('aa');
      state.stack.push('b');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeUndefined();
      expect(state.stack.pop()).toBe('bb');
    });

    it('should return error when target is not a string', () => {
      state.stack.push(123);
      state.stack.push('test');
      state.stack.push('replacement');
      
      const handler = advancedHandlers[OpCode.STRING_REPLACE_ALL]!;
      const error = handler.execute(state, { op: OpCode.STRING_REPLACE_ALL });
      
      expect(error).toBeDefined();
      expect(error?.type).toBe('RuntimeError');
      expect(error?.message).toBe('STRING_REPLACE_ALL requires a string');
    });
  });
});