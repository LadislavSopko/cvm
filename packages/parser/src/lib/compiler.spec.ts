import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler', () => {
  it('should compile minimal program', () => {
    const source = `
      function main(): void {
        console.log("Hello World");
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "Hello World" });
    expect(result.bytecode).toContainEqual({ op: OpCode.PRINT });
    expect(result.bytecode[result.bytecode.length - 1]).toEqual({ op: OpCode.HALT });
  });

  it('should compile CC call', () => {
    const source = `
      function main(): void {
        const answer = CC("What is 2+2?");
        console.log(answer);
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "What is 2+2?" });
    expect(result.bytecode).toContainEqual({ op: OpCode.CC });
    expect(result.bytecode).toContainEqual(expect.objectContaining({ op: OpCode.STORE }));
  });
});