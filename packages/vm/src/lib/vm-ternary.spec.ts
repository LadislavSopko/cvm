import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - Ternary Operator', () => {
  it('should execute ternary with true condition', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.JUMP_IF_FALSE, arg: 4 },
      { op: OpCode.PUSH, arg: 'yes' },
      { op: OpCode.JUMP, arg: 5 },
      { op: OpCode.PUSH, arg: 'no' },
      { op: OpCode.HALT }
    ];
    
    const vm = new VM();
    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(1);
    expect(result.stack[0]).toBe('yes');
  });

  it('should execute ternary with false condition', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: false },
      { op: OpCode.JUMP_IF_FALSE, arg: 4 },
      { op: OpCode.PUSH, arg: 'yes' },
      { op: OpCode.JUMP, arg: 5 },
      { op: OpCode.PUSH, arg: 'no' },
      { op: OpCode.HALT }
    ];
    
    const vm = new VM();
    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(1);
    expect(result.stack[0]).toBe('no');
  });

  it('should handle nested ternary operations', () => {
    // score >= 90 ? "A" : score >= 80 ? "B" : "C"
    // with score = 85
    const bytecode = [
      // First comparison: score >= 90
      { op: OpCode.PUSH, arg: 85 },
      { op: OpCode.PUSH, arg: 90 },
      { op: OpCode.GTE },
      { op: OpCode.JUMP_IF_FALSE, arg: 6 },
      { op: OpCode.PUSH, arg: 'A' },
      { op: OpCode.JUMP, arg: 13 },
      // Second comparison: score >= 80
      { op: OpCode.PUSH, arg: 85 },
      { op: OpCode.PUSH, arg: 80 },
      { op: OpCode.GTE },
      { op: OpCode.JUMP_IF_FALSE, arg: 12 },
      { op: OpCode.PUSH, arg: 'B' },
      { op: OpCode.JUMP, arg: 13 },
      { op: OpCode.PUSH, arg: 'C' },
      { op: OpCode.HALT }
    ];
    
    const vm = new VM();
    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(1);
    expect(result.stack[0]).toBe('B');
  });

  it('should work with complex expressions in ternary', () => {
    // (x > 5 && x < 10) ? "in range" : "out of range"
    // with x = 7
    const bytecode = [
      // x > 5
      { op: OpCode.PUSH, arg: 7 },
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.GT },
      // x < 10
      { op: OpCode.PUSH, arg: 7 },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.LT },
      // AND
      { op: OpCode.AND },
      // Ternary
      { op: OpCode.JUMP_IF_FALSE, arg: 10 },
      { op: OpCode.PUSH, arg: 'in range' },
      { op: OpCode.JUMP, arg: 11 },
      { op: OpCode.PUSH, arg: 'out of range' },
      { op: OpCode.HALT }
    ];
    
    const vm = new VM();
    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(1);
    expect(result.stack[0]).toBe('in range');
  });
});