import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - String Case Operations', () => {
  describe('STRING_TOUPPERCASE', () => {
    it('should convert lowercase to uppercase', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'hello world' },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('HELLO WORLD');
    });

    it('should handle mixed case', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'HeLLo WoRLd' },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('HELLO WORLD');
    });

    it('should handle already uppercase', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'HELLO' },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('HELLO');
    });

    it('should handle numbers and special characters', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'hello123!@#' },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('HELLO123!@#');
    });

    it('should handle empty string', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('');
    });

    it('should error on non-string input', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_TOUPPERCASE requires a string');
    });

    it('should error on stack underflow', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.STRING_TOUPPERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_TOUPPERCASE: Stack underflow');
    });
  });

  describe('STRING_TOLOWERCASE', () => {
    it('should convert uppercase to lowercase', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'HELLO WORLD' },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('hello world');
    });

    it('should handle mixed case', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'HeLLo WoRLd' },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('hello world');
    });

    it('should handle already lowercase', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('hello');
    });

    it('should handle numbers and special characters', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 'HELLO123!@#' },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('hello123!@#');
    });

    it('should handle empty string', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe('');
    });

    it('should error on non-string input', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH, arg: 123 },
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_TOLOWERCASE requires a string');
    });

    it('should error on stack underflow', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.STRING_TOLOWERCASE },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('STRING_TOLOWERCASE: Stack underflow');
    });
  });
});