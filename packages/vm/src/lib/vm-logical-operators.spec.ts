import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - Logical Operators', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('AND (&&) operator', () => {
    it('should return true when both operands are true', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false when first operand is false', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should return false when second operand is false', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should handle truthy/falsy values', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(42); // Returns second value when first is truthy
    });

    it('should return first falsy value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.PUSH, arg: "world" },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(0); // Returns first falsy value
    });

    it('should handle null and undefined-like values', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(null); // Returns first falsy value
    });

    it('should error on stack underflow', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.AND },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('AND: Stack underflow');
    });
  });

  describe('OR (||) operator', () => {
    it('should return true when first operand is true', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return true when second operand is true', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false when both operands are false', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should return first truthy value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.PUSH, arg: "world" },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe("hello"); // Returns first truthy value
    });

    it('should return second value when first is falsy', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.PUSH, arg: "fallback" },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe("fallback");
    });

    it('should handle both falsy values', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(0); // Returns last value when both falsy
    });

    it('should error on stack underflow', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('OR: Stack underflow');
    });
  });

  describe('NOT (!) operator', () => {
    it('should negate true to false', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should negate false to true', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle truthy values', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should handle falsy values', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle null', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle empty string', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "" },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should error on empty stack', () => {
      const bytecode = [
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('NOT: Stack underflow');
    });

    it('should handle double negation', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.NOT },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true); // !!42 = true
    });
  });

  describe('Complex logical expressions', () => {
    it('should handle (true && false) || true', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.AND },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.OR },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle !(true && false)', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.AND },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });
  });
});