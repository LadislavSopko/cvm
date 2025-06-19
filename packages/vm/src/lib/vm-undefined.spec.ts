import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMUndefined } from '@cvm/types';

describe('VM - Undefined Operations', () => {
  describe('PUSH_UNDEFINED', () => {
    it('should push undefined onto stack', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toEqual(createCVMUndefined());
    });
  });

  describe('Undefined with operations', () => {
    it('should handle typeof undefined', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.TYPEOF },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe('undefined');
    });

    it('should handle undefined in comparisons', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      if (state.status === 'error') {
        console.log('Error:', state.error);
      }
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(true); // undefined == null is true in JS
    });

    it('should handle undefined in strict comparisons', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.EQ_STRICT },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(false); // undefined === null is false in JS
    });

    it('should handle undefined in PRINT', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PRINT },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.output).toHaveLength(1);
      expect(state.output[0]).toBe('undefined');
    });

    it('should handle undefined in arithmetic operations', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.ADD },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBeNaN(); // undefined + 5 = NaN
    });

    it('should handle undefined in logical operations', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.NOT },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toBe(true); // !undefined = true
    });
  });

  describe('Variable operations with undefined', () => {
    it('should load undefined from uninitialized variable', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.LOAD, arg: 'x' },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toEqual(createCVMUndefined());
    });

    it('should store and load undefined', () => {
      const vm = new VM();
      const bytecode = [
        { op: OpCode.PUSH_UNDEFINED },
        { op: OpCode.STORE, arg: 'x' },
        { op: OpCode.LOAD, arg: 'x' },
        { op: OpCode.HALT }
      ];
      
      const state = vm.execute(bytecode);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toHaveLength(1);
      expect(state.stack[0]).toEqual(createCVMUndefined());
    });
  });
});