import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Ternary Operator', () => {
  it('should compile basic ternary operator', () => {
    const source = `
      function main() {
        let result = true ? "yes" : "no";
        console.log(result);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    const bytecode = result.bytecode;
    
    // Should have: condition, JUMP_IF_FALSE, true value, JUMP, false value
    const jumpIfFalseIndex = bytecode.findIndex(i => i.op === OpCode.JUMP_IF_FALSE);
    expect(jumpIfFalseIndex).toBeGreaterThan(-1);
    
    const jumpIndex = bytecode.findIndex((i, idx) => i.op === OpCode.JUMP && idx > jumpIfFalseIndex);
    expect(jumpIndex).toBeGreaterThan(jumpIfFalseIndex);
  });

  it('should compile ternary with variable condition', () => {
    const source = `
      function main() {
        let age = 25;
        let status = age >= 18 ? "adult" : "minor";
        console.log(status);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should compile nested ternary operators', () => {
    const source = `
      function main() {
        let score = 85;
        let grade = score >= 90 ? "A" : score >= 80 ? "B" : "C";
        console.log(grade);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should compile ternary in expressions', () => {
    const source = `
      function main() {
        let x = 10;
        let message = "The value is " + (x > 5 ? "high" : "low");
        console.log(message);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should compile ternary with complex expressions', () => {
    const source = `
      function main() {
        let scores = [85, 92, 78];
        let i = 0;
        let status = scores[i] >= 95 ? "Excellent" : "Needs work";
        console.log(status);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});