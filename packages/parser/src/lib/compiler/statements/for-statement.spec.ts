import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('for loop compilation', () => {
  it('should compile basic for loop', () => {
    const source = `
      function main() {
        for (let i = 0; i < 5; i++) {
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have JUMP_IF_FALSE for condition and JUMP for loop back
    const hasConditionalJump = result.bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE);
    const hasJump = result.bytecode.some(inst => inst.op === OpCode.JUMP);
    expect(hasConditionalJump).toBe(true);
    expect(hasJump).toBe(true);
  });

  it('should handle for loop with break', () => {
    const source = `
      function main() {
        for (let i = 0; i < 10; i++) {
          if (i === 3) {
            break;
          }
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have BREAK opcode
    const hasBreak = result.bytecode.some(inst => inst.op === OpCode.BREAK);
    expect(hasBreak).toBe(true);
  });

  it('should handle for loop with continue', () => {
    const source = `
      function main() {
        for (let i = 0; i < 5; i++) {
          if (i === 2) {
            continue;
          }
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have CONTINUE opcode
    const hasContinue = result.bytecode.some(inst => inst.op === OpCode.CONTINUE);
    expect(hasContinue).toBe(true);
    
    // Find the CONTINUE instruction and verify it has a valid target
    const continueInst = result.bytecode.find(inst => inst.op === OpCode.CONTINUE);
    expect(continueInst).toBeDefined();
    expect(continueInst?.arg).toBeGreaterThan(0);
  });

  it('should handle for loop without init', () => {
    const source = `
      function main() {
        let i = 0;
        for (; i < 5; i++) {
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should still have proper loop structure
    const hasConditionalJump = result.bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE);
    const hasJump = result.bytecode.some(inst => inst.op === OpCode.JUMP);
    expect(hasConditionalJump).toBe(true);
    expect(hasJump).toBe(true);
  });

  it('should handle for loop without condition', () => {
    const source = `
      function main() {
        for (let i = 0; ; i++) {
          if (i >= 3) {
            break;
          }
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should not have JUMP_IF_FALSE for missing condition
    // But should have BREAK to exit
    const hasBreak = result.bytecode.some(inst => inst.op === OpCode.BREAK);
    expect(hasBreak).toBe(true);
  });

  it('should handle for loop without update', () => {
    const source = `
      function main() {
        for (let i = 0; i < 3; ) {
          console.log(i);
          i++;
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should still have proper loop structure
    const hasConditionalJump = result.bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE);
    const hasJump = result.bytecode.some(inst => inst.op === OpCode.JUMP);
    expect(hasConditionalJump).toBe(true);
    expect(hasJump).toBe(true);
  });
});