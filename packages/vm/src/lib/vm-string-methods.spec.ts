import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray } from '@cvm/types';

describe('VM - String method opcodes', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('STRING_SUBSTRING', () => {
    it('should extract substring with start and end indices', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello, World!' },
        { op: OpCode.PUSH, arg: 7 },
        { op: OpCode.PUSH, arg: 12 },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual(['World']);
    });

    it('should extract substring with only start index', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello, World!' },
        { op: OpCode.PUSH, arg: 7 },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual(['World!']);
    });

    it('should handle negative indices', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: -3 },
        { op: OpCode.PUSH, arg: -1 },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual(['ll']);
    });

    it('should handle out of bounds indices', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: 2 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual(['llo']);
    });

    it('should error on non-string value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.PUSH, arg: 2 },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_SUBSTRING requires a string');
    });

    it('should handle stack underflow', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.STRING_SUBSTRING },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_SUBSTRING: Stack underflow');
    });
  });

  describe('STRING_INDEXOF', () => {
    it('should find index of substring', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello, World!' },
        { op: OpCode.PUSH, arg: 'World' },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual([7]);
    });

    it('should return -1 when substring not found', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello, World!' },
        { op: OpCode.PUSH, arg: 'xyz' },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual([-1]);
    });

    it('should find first occurrence', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'abcabcabc' },
        { op: OpCode.PUSH, arg: 'abc' },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual([0]);
    });

    it('should handle empty search string', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toEqual([0]);
    });

    it('should error on non-string haystack', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.PUSH, arg: '2' },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_INDEXOF requires string arguments');
    });

    it('should error on non-string needle', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.STRING_INDEXOF },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_INDEXOF requires string arguments');
    });
  });

  describe('STRING_SPLIT', () => {
    it('should split string by delimiter', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'apple,banana,cherry' },
        { op: OpCode.PUSH, arg: ',' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toHaveLength(1);
      const result = state.stack[0];
      expect(result).toEqual(createCVMArray(['apple', 'banana', 'cherry']));
    });

    it('should handle empty delimiter (split into characters)', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toHaveLength(1);
      const result = state.stack[0];
      expect(result).toEqual(createCVMArray(['H', 'e', 'l', 'l', 'o']));
    });

    it('should handle delimiter not found', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello World' },
        { op: OpCode.PUSH, arg: ',' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toHaveLength(1);
      const result = state.stack[0];
      expect(result).toEqual(createCVMArray(['Hello World']));
    });

    it('should handle consecutive delimiters', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'a,,b,c' },
        { op: OpCode.PUSH, arg: ',' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toHaveLength(1);
      const result = state.stack[0];
      expect(result).toEqual(createCVMArray(['a', '', 'b', 'c']));
    });

    it('should handle delimiter at start and end', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: ',apple,banana,' },
        { op: OpCode.PUSH, arg: ',' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.error).toBeUndefined();
      expect(state.stack).toHaveLength(1);
      const result = state.stack[0];
      expect(result).toEqual(createCVMArray(['', 'apple', 'banana', '']));
    });

    it('should error on non-string value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.PUSH, arg: ',' },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_SPLIT requires string arguments');
    });

    it('should error on non-string delimiter', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'Hello' },
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.STRING_SPLIT },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_SPLIT requires string arguments');
    });
  });
});