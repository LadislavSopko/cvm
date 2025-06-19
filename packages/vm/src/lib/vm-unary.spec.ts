import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - Unary Operators', () => {
  describe('UNARY_MINUS', () => {
    it('should negate positive numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 42 },
        { op: OpCode.UNARY_MINUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack).toHaveLength(1);
      expect(result.stack[0]).toBe(-42);
    });

    it('should negate negative numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: -15 },
        { op: OpCode.UNARY_MINUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(15);
    });

    it('should convert strings to numbers and negate', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "123" },
        { op: OpCode.UNARY_MINUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(-123);
    });

    it('should handle NaN for non-numeric strings', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "hello" },
        { op: OpCode.UNARY_MINUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBeNaN();
    });
  });

  describe('UNARY_PLUS', () => {
    it('should convert strings to numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "456" },
        { op: OpCode.UNARY_PLUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(456);
    });

    it('should convert booleans to numbers', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.UNARY_PLUS },
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.UNARY_PLUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack).toHaveLength(2);
      expect(result.stack[0]).toBe(1);  // true -> 1
      expect(result.stack[1]).toBe(0);  // false -> 0
    });

    it('should leave numbers unchanged', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 42.5 },
        { op: OpCode.UNARY_PLUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(42.5);
    });

    it('should convert empty string to 0', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "" },
        { op: OpCode.UNARY_PLUS },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(0);
    });
  });

  describe('INC (increment)', () => {
    it('should handle pre-increment', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.STORE, arg: 'x' },
        { op: OpCode.PUSH, arg: 'x' },
        { op: OpCode.INC, arg: false },  // false = pre-increment
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(6);  // Pre-increment returns new value
      expect(result.variables.get('x')).toBe(6);
    });

    it('should handle post-increment', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.STORE, arg: 'x' },
        { op: OpCode.PUSH, arg: 'x' },
        { op: OpCode.INC, arg: true },  // true = post-increment
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(5);  // Post-increment returns old value
      expect(result.variables.get('x')).toBe(6);
    });

    it('should initialize undefined variables to 0', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 'y' },
        { op: OpCode.INC, arg: false },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(1);
      expect(result.variables.get('y')).toBe(1);
    });
  });

  describe('DEC (decrement)', () => {
    it('should handle pre-decrement', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.STORE, arg: 'x' },
        { op: OpCode.PUSH, arg: 'x' },
        { op: OpCode.DEC, arg: false },  // false = pre-decrement
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(9);  // Pre-decrement returns new value
      expect(result.variables.get('x')).toBe(9);
    });

    it('should handle post-decrement', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: 10 },
        { op: OpCode.STORE, arg: 'x' },
        { op: OpCode.PUSH, arg: 'x' },
        { op: OpCode.DEC, arg: true },  // true = post-decrement
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(10);  // Post-decrement returns old value
      expect(result.variables.get('x')).toBe(9);
    });

    it('should handle string variables by converting to number', () => {
      const bytecode = [
        { op: OpCode.PUSH, arg: "20" },
        { op: OpCode.STORE, arg: 'z' },
        { op: OpCode.PUSH, arg: 'z' },
        { op: OpCode.DEC, arg: false },
        { op: OpCode.HALT }
      ];
      
      const vm = new VM();
      const result = vm.execute(bytecode);
      
      expect(result.status).toBe('complete');
      expect(result.stack[0]).toBe(19);
      expect(result.variables.get('z')).toBe(19);
    });
  });
});