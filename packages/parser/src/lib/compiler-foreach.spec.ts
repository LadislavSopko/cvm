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
});