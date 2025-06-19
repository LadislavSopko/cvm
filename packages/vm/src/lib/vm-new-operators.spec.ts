import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - New Operators', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  describe('MOD (Modulo) operator', () => {
    it('should calculate modulo of two numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.MOD },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(1); // 10 % 3 = 1
    });

    it('should handle modulo with string numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "17" },
        { op: OpCode.PUSH, arg: "5" },
        { op: OpCode.MOD },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(2); // 17 % 5 = 2
    });

    it('should handle modulo by zero', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.MOD },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(NaN); // JavaScript behavior
    });

    it('should handle negative numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: -10 },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.MOD },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(-1); // JavaScript: -10 % 3 = -1
    });

    it('should error on stack underflow', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.MOD },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('error');
      expect(result.error).toBe('MOD: Stack underflow');
    });
  });

  describe('LTE (Less Than or Equal) operator', () => {
    it('should return true when left < right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.LTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return true when left == right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.LTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false when left > right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 15 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.LTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should handle string to number conversion', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "5" },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.LTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });
  });

  describe('GTE (Greater Than or Equal) operator', () => {
    it('should return true when left > right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 15 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.GTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return true when left == right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.GTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false when left < right', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.GTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should handle string to number conversion', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "15" },
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.GTE },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });
  });

  describe('EQ_STRICT (===) operator', () => {
    it('should return true for same type and value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false for different types (no coercion)', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: "5" },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false); // No type coercion
    });

    it('should handle null correctly', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return false for null vs 0', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false); // null !== 0
    });

    it('should handle strings correctly', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle booleans correctly', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });
  });

  describe('NEQ_STRICT (!==) operator', () => {
    it('should return false for same type and value', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.NEQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(false);
    });

    it('should return true for different types', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: "5" },
        { op: OpCode.NEQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should return true for null vs 0', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.NEQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });

    it('should handle different values of same type', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.PUSH, arg: "world" },
        { op: OpCode.NEQ_STRICT },
        { op: OpCode.HALT }
      ];

      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(true);
    });
  });
});