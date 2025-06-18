import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - array set', () => {
  it('should compile array element assignment', () => {
    const source = `
      function main(): void {
        const arr = [1, 2, 3];
        arr[0] = 10;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Should contain ARRAY_SET opcode
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET });
    
    // Check that temp variable approach is used
    const arraySetIndex = result.bytecode.findIndex(i => i.op === OpCode.ARRAY_SET);
    expect(arraySetIndex).toBeGreaterThan(-1);
    
    // With temp variable approach, we should see:
    // PUSH 10 (value)
    // STORE __temp_X 
    // LOAD arr (array)
    // PUSH 0 (index)
    // LOAD __temp_X (value)
    // ARRAY_SET
    
    // Find the STORE for temp variable
    const storeIndex = result.bytecode.findIndex(i => 
      i.op === OpCode.STORE && i.arg?.startsWith('__temp_'));
    expect(storeIndex).toBeGreaterThan(-1);
    expect(storeIndex).toBeLessThan(arraySetIndex);
    
    // The value should be pushed before the store
    expect(result.bytecode[storeIndex - 1]).toEqual({ op: OpCode.PUSH, arg: 10 });
    
    // Before ARRAY_SET, we should have array, index, then temp load
    expect(result.bytecode[arraySetIndex - 3]).toEqual({ op: OpCode.LOAD, arg: 'arr' });
    expect(result.bytecode[arraySetIndex - 2]).toEqual({ op: OpCode.PUSH, arg: 0 });
    expect(result.bytecode[arraySetIndex - 1].op).toBe(OpCode.LOAD);
    expect(result.bytecode[arraySetIndex - 1].arg).toMatch(/^__temp_/);
  });

  it('should compile array assignment with variable index', () => {
    const source = `
      function main(): void {
        const arr = [1, 2, 3];
        const i = 1;
        arr[i] = 20;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET });
    
    // With temp variable approach, the last instruction before ARRAY_SET
    // should be loading the temp variable (value), not the index
    const arraySetIndex = result.bytecode.findIndex(i => i.op === OpCode.ARRAY_SET);
    expect(result.bytecode[arraySetIndex - 1].op).toBe(OpCode.LOAD);
    expect(result.bytecode[arraySetIndex - 1].arg).toMatch(/^__temp_/);
  });

  it('should compile array assignment with expression', () => {
    const source = `
      function main(): void {
        const arr = [1, 2, 3];
        arr[1 + 1] = 30;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET });
    
    // Should have ADD for the index expression
    expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
  });

  it('should compile CC value assignment to array', () => {
    const source = `
      function main(): void {
        const responses = [];
        responses[0] = CC("Enter value:");
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.CC });
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET });
  });

  it('should handle nested array access', () => {
    const source = `
      function main(): void {
        const matrix = [[1, 2], [3, 4]];
        matrix[0][1] = 99;
      }
      main();
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    // Should have ARRAY_GET for matrix[0], then ARRAY_SET for the assignment
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_GET });
    expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET });
  });
});