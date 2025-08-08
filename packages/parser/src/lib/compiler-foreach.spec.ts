import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - for-of loops', () => {
  it('should compile simple for-of loop', () => {
    const source = `
      function main() {
        const arr = [1, 2, 3];
        for (const item of arr) {
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain iteration opcodes
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_START });
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_NEXT });
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_END });
    
    // Should contain variable store for loop variable
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'item' });
  });

  it('should compile for-of with array literal', () => {
    const source = `
      function main() {
        for (const x of [10, 20]) {
          console.log(x);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_START });
  });

  it('should compile for-of with variable scope', () => {
    const source = `
      function main() {
        const items = ["a", "b"];
        for (const element of items) {
          console.log(element);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should load the array variable
    expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'items' });
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_START });
  });

  it('should handle nested for-of loops', () => {
    const source = `
      function main() {
        const outer = [1, 2];
        const inner = [3, 4];
        for (const x of outer) {
          for (const y of inner) {
            console.log(x + y);
          }
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should have multiple ITER_START/END pairs for nested loops
    const iterStarts = result.bytecode.filter(instr => instr.op === OpCode.ITER_START);
    const iterEnds = result.bytecode.filter(instr => instr.op === OpCode.ITER_END);
    
    expect(iterStarts).toHaveLength(2);
    expect(iterEnds).toHaveLength(2);
  });

  it('should compile for-of with break statement', () => {
    const source = `
      function main() {
        const arr = [1, 2, 3];
        for (const item of arr) {
          if (item === 2) {
            break;
          }
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain BREAK opcode (may have argument)
    const hasBreak = result.bytecode.some(instr => instr.op === OpCode.BREAK);
    expect(hasBreak).toBe(true);
  });

  it('should compile for-of with continue statement', () => {
    const source = `
      function main() {
        const arr = [1, 2, 3];
        for (const item of arr) {
          if (item === 2) {
            continue;
          }
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should contain CONTINUE opcode (may have argument)
    const hasContinue = result.bytecode.some(instr => instr.op === OpCode.CONTINUE);
    expect(hasContinue).toBe(true);
  });

  it('should handle for-of with let declaration', () => {
    const source = `
      function main() {
        for (let item of [1, 2, 3]) {
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'item' });
  });

  it('should generate correct jump structure for for-of loop', () => {
    const source = `
      function main() {
        for (const x of [1, 2]) {
          console.log(x);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Verify the structure includes proper jumps
    const jumpInstructions = result.bytecode.filter(instr => 
      instr.op === OpCode.JUMP || 
      instr.op === OpCode.JUMP_IF_FALSE
    );
    
    expect(jumpInstructions.length).toBeGreaterThan(0);
  });

  it('should handle for-of loop with multiple continue statements (bug fix)', () => {
    const source = `
      function main() {
        const items = ["item1", "item2", "item3"];
        
        for (const item of items) {
          if (item === "item1") {
            continue;
          }
          
          if (item === "item2") {
            continue;
          }
          
          if (item === "item3") {
            continue;
          }
          
          console.log(item);
        }
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Find JUMP_IF_FALSE and ITER_END instructions
    let jumpIfFalse = null;
    let iterEndIndex = -1;
    
    for (let i = 0; i < result.bytecode.length; i++) {
      const instr = result.bytecode[i];
      
      // Find the JUMP_IF_FALSE that exits the for-of loop
      if (instr.op === OpCode.JUMP_IF_FALSE && !jumpIfFalse) {
        jumpIfFalse = { index: i, target: instr.arg };
      }
      
      if (instr.op === OpCode.ITER_END) {
        iterEndIndex = i;
      }
    }
    
    // Verify the fix: JUMP_IF_FALSE should point to ITER_END, not -1
    expect(jumpIfFalse).not.toBeNull();
    expect(jumpIfFalse?.target).toBe(iterEndIndex);
    expect(jumpIfFalse?.target).not.toBe(-1); // Bug was: invalid jump target -1
    
    // Verify we have proper loop structure
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_START });
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_NEXT });
    expect(result.bytecode).toContainEqual({ op: OpCode.ITER_END });
    
    // Verify continue statements are present
    const continueInstructions = result.bytecode.filter(instr => instr.op === OpCode.CONTINUE);
    expect(continueInstructions.length).toBe(3); // Should have 3 continue statements
  });
});