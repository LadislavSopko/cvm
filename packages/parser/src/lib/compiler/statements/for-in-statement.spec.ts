import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('for-in loop compilation', () => {
  it('should compile basic for-in loop', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2 };
        for (const key in obj) {
          console.log(key);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have OBJECT_ITER_START and OBJECT_ITER_NEXT
    const hasObjectIterStart = result.bytecode.some(inst => inst.op === OpCode.OBJECT_ITER_START);
    const hasObjectIterNext = result.bytecode.some(inst => inst.op === OpCode.OBJECT_ITER_NEXT);
    expect(hasObjectIterStart).toBe(true);
    expect(hasObjectIterNext).toBe(true);
  });
});