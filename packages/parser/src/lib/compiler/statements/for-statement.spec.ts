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
    // Test break statement
  });

  it('should handle for loop with continue', () => {
    // Test continue statement
  });

  it('should handle for loop without init', () => {
    // for (; i < 5; i++)
  });

  it('should handle for loop without condition', () => {
    // for (let i = 0; ; i++) - infinite loop
  });

  it('should handle for loop without update', () => {
    // for (let i = 0; i < 5; )
  });
});