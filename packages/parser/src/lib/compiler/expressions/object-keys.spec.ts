import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('Object.keys() compilation', () => {
  it('should compile Object.keys() call', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2 };
        const keys = Object.keys(obj);
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should contain OBJECT_KEYS opcode
    const hasObjectKeys = result.bytecode.some(inst => inst.op === OpCode.OBJECT_KEYS);
    expect(hasObjectKeys).toBe(true);
  });
});