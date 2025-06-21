import { describe, it, expect } from 'vitest';
import { compile } from '../compiler.js';
import { OpCode } from '../bytecode.js';

describe('Compiler - toString()', () => {
  it('should compile toString() on a number', () => {
    const source = `
      function main() {
        const x = 42;
        const s = x.toString();
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.TO_STRING });
  });

  it('should compile toString() on a string literal', () => {
    const source = `
      function main() {
        const s = "hello".toString();
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.TO_STRING });
  });

  it('should compile toString() in expression', () => {
    const source = `
      function main() {
        console.log((42).toString());
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.TO_STRING });
  });
});