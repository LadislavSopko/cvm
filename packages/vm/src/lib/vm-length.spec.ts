import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - Universal LENGTH opcode', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('String length', () => {
    it('should get length of string literal', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe(5);
      expect(state.status).toBe('complete');
    });

    it('should get length of empty string', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe(0);
      expect(state.status).toBe('complete');
    });

    it('should work with concatenated strings', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.PUSH, arg: ' world' },
        { op: OpCode.CONCAT },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe(11);
      expect(state.status).toBe('complete');
    });
  });

  describe('Array length', () => {
    it('should get length of array', () => {
      const bytecode = [
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 2 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      // The only thing on stack should be the length
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe(3);
      expect(state.status).toBe('complete');
    });

    it('should get length of empty array', () => {
      const bytecode = [
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe(0);
      expect(state.status).toBe('complete');
    });

    it('should work with array after push', () => {
      const bytecode = [
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 'a' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 'b' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.STORE, arg: 'arr' },
        { op: OpCode.LOAD, arg: 'arr' },
        { op: OpCode.PUSH, arg: 'c' },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe(3);
      expect(state.status).toBe('complete');
    });
  });

  describe('Dynamic type handling', () => {
    it('should handle string from variable', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.STORE, arg: 'value' },
        { op: OpCode.LOAD, arg: 'value' },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack[0]).toBe(11);
      expect(state.status).toBe('complete');
    });

    it('should handle array from variable', () => {
      const bytecode = [
        { op: OpCode.ARRAY_NEW },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.PUSH, arg: 2 },
        { op: OpCode.ARRAY_PUSH },
        { op: OpCode.STORE, arg: 'value' },
        { op: OpCode.LOAD, arg: 'value' },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.stack.length).toBe(1);
      expect(state.stack[0]).toBe(2);
      expect(state.status).toBe('complete');
    });
  });

  describe('Error handling', () => {
    it('should error on number value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('LENGTH requires a string or array');
    });

    it('should error on boolean value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('LENGTH requires a string or array');
    });

    it('should error on null value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('LENGTH requires a string or array');
    });

    it('should error on stack underflow', () => {
      const bytecode = [
        { op: OpCode.LENGTH },
        { op: OpCode.HALT }
      ];

      const state = vm.execute(bytecode);
      expect(state.status).toBe('error');
      expect(state.error).toBe('LENGTH: Stack underflow');
    });
  });
});