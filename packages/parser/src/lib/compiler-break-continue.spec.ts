import { describe, expect, it } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler Break/Continue Statements', () => {
  it('should compile break statement in while loop', () => {
    const source = `
      function main() {
        let i = 0;
        while (i < 10) {
          if (i === 3) {
            break;
          }
          console.log(i);
          i++;
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain BREAK opcode
    const hasBreak = result.bytecode.some(instr => instr.op === OpCode.BREAK);
    expect(hasBreak).toBe(true);
  });

  it('should compile continue statement in while loop', () => {
    const source = `
      function main() {
        let i = 0;
        while (i < 5) {
          i++;
          if (i % 2 === 0) {
            continue;
          }
          console.log(i);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain CONTINUE opcode
    const hasContinue = result.bytecode.some(instr => instr.op === OpCode.CONTINUE);
    expect(hasContinue).toBe(true);
  });

  it('should compile break statement in for-of loop', () => {
    const source = `
      function main() {
        const arr = [1, 2, 3, 4, 5];
        for (const item of arr) {
          if (item === 3) {
            break;
          }
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain BREAK opcode
    const hasBreak = result.bytecode.some(instr => instr.op === OpCode.BREAK);
    expect(hasBreak).toBe(true);
    
    // Should also contain foreach opcodes
    const hasIterStart = result.bytecode.some(instr => instr.op === OpCode.ITER_START);
    const hasIterNext = result.bytecode.some(instr => instr.op === OpCode.ITER_NEXT);
    const hasIterEnd = result.bytecode.some(instr => instr.op === OpCode.ITER_END);
    expect(hasIterStart).toBe(true);
    expect(hasIterNext).toBe(true);
    expect(hasIterEnd).toBe(true);
  });

  it('should compile continue statement in for-of loop', () => {
    const source = `
      function main() {
        const arr = [1, 2, 3, 4, 5];
        for (const item of arr) {
          if (item % 2 === 0) {
            continue;
          }
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain CONTINUE opcode
    const hasContinue = result.bytecode.some(instr => instr.op === OpCode.CONTINUE);
    expect(hasContinue).toBe(true);
    
    // Should also contain foreach opcodes
    const hasIterStart = result.bytecode.some(instr => instr.op === OpCode.ITER_START);
    const hasIterNext = result.bytecode.some(instr => instr.op === OpCode.ITER_NEXT);
    const hasIterEnd = result.bytecode.some(instr => instr.op === OpCode.ITER_END);
    expect(hasIterStart).toBe(true);
    expect(hasIterNext).toBe(true);
    expect(hasIterEnd).toBe(true);
  });

  it('should compile nested loops with break/continue', () => {
    const source = `
      function main() {
        for (const i of [1, 2, 3]) {
          for (const j of [4, 5, 6]) {
            if (j === 5) {
              continue;
            }
            if (i === 2 && j === 6) {
              break;
            }
            console.log(i + "-" + j);
          }
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain both BREAK and CONTINUE opcodes
    const hasBreak = result.bytecode.some(instr => instr.op === OpCode.BREAK);
    const hasContinue = result.bytecode.some(instr => instr.op === OpCode.CONTINUE);
    expect(hasBreak).toBe(true);
    expect(hasContinue).toBe(true);
  });

  it('should error on break outside of loop', () => {
    const source = `
      function main() {
        console.log("before");
        break;
        console.log("after");
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe('break statement not in loop');
  });

  it('should error on continue outside of loop', () => {
    const source = `
      function main() {
        console.log("before");
        continue;
        console.log("after");
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe('continue statement not in loop');
  });

  it('should compile break with proper jump targets', () => {
    const source = `
      function main() {
        while (true) {
          break;
        }
        console.log("after loop");
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Find the BREAK instruction
    const breakInstr = result.bytecode.find(instr => instr.op === OpCode.BREAK);
    expect(breakInstr).toBeDefined();
    expect(typeof breakInstr!.arg).toBe('number');
    expect(breakInstr!.arg).toBeGreaterThan(0);
  });

  it('should compile continue with proper jump targets', () => {
    const source = `
      function main() {
        let i = 0;
        while (i < 3) {
          i++;
          continue;
          console.log("unreachable");
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Find the CONTINUE instruction
    const continueInstr = result.bytecode.find(instr => instr.op === OpCode.CONTINUE);
    expect(continueInstr).toBeDefined();
    expect(typeof continueInstr!.arg).toBe('number');
    expect(continueInstr!.arg).toBeGreaterThan(0);
  });
});