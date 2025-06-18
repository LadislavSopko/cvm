import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - Arithmetic E2E', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should perform numeric addition correctly', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.PUSH, arg: 20 },
      { op: OpCode.ADD },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(30); // Not "1020"!
  });

  it('should handle addition with string numbers from CC', () => {
    // Simulate CC returning string numbers
    const bytecode = [
      { op: OpCode.PUSH, arg: "10" }, // CC returns strings
      { op: OpCode.PUSH, arg: "20" },
      { op: OpCode.ADD },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(30); // Should convert to numbers
  });

  it('should handle mixed numeric operations', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "5" },  // String
      { op: OpCode.PUSH, arg: 3 },    // Number
      { op: OpCode.ADD },
      { op: OpCode.PUSH, arg: 2 },
      { op: OpCode.MUL },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(16); // (5 + 3) * 2 = 16
  });

  it('should use CONCAT for string literals', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "Hello" },
      { op: OpCode.PUSH, arg: " World" },
      { op: OpCode.CONCAT },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe("Hello World");
  });

  it('should handle division with string numbers', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "20" },
      { op: OpCode.PUSH, arg: "4" },
      { op: OpCode.DIV },
      { op: OpCode.HALT }
    ];

    const result = vm.execute(bytecode);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(5);
  });
});