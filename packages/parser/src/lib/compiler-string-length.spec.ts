import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - string.length support', () => {
  it('should compile string literal length', () => {
    const source = `
      function main(): void {
        const msg = "hello world";
        const len = msg.length;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello world' });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'msg' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'msg' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LENGTH });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'len' });
  });

  it('should compile string length in expression', () => {
    const source = `
      function main(): void {
        const password = "mypassword";
        if (password.length >= 8) {
          console.log("Password is long enough");
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'password' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LENGTH });
    expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 8 });
    expect(result.bytecode).toContainEqual({ op: OpCode.GTE });
  });

  it('should compile string length from CC input', () => {
    const source = `
      function main(): void {
        const name = CC("Enter your name:");
        const nameLen = name.length;
        console.log("Your name has " + nameLen + " characters");
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.CC });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'name' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'name' });
    expect(result.bytecode).toContainEqual({ op: OpCode.LENGTH });
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'nameLen' });
  });

  it('should work with both string and array length', () => {
    const source = `
      function main(): void {
        const str = "hello";
        const arr = [1, 2, 3];
        const strLen = str.length;
        const arrLen = arr.length;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    // Both string.length and array.length compile to LENGTH opcode
    const lengthOps = result.bytecode.filter(op => op.op === OpCode.LENGTH);
    expect(lengthOps).toHaveLength(2);
  });
});