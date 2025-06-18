import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - arithmetic operators', () => {
  it('should compile numeric addition', () => {
    const source = `
      function main(): void {
        const a = 10;
        const b = 20;
        const sum = a + b;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'a' });
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 20 });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'b' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'a' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'b' });
    expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'sum' });
  });

  it('should compile subtraction', () => {
    const source = `
      function main(): void {
        const x = 100;
        const y = 30;
        const diff = x - y;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'y' });
    expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
  });

  it('should compile string concatenation with +', () => {
    const source = `
      function main(): void {
        const greeting = "Hello" + " World";
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "Hello" });
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: " World" });
    expect(result.bytecode).toContainEqual({ op: OpCode.CONCAT });
  });

  it('should compile complex arithmetic expressions', () => {
    const source = `
      function main(): void {
        const result = (10 + 5) - 3;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    // First: 10 + 5
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
    expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
    // Then: result - 3
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 3 });
    expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
  });
});