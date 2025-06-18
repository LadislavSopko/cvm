import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Control Flow', () => {
  describe('if statements', () => {
    it('should compile simple if statement', () => {
      const source = `
        function main() {
          const x = 5;
          if (x > 3) {
            console.log("x is greater than 3");
          }
          console.log("done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Expected bytecode pattern:
      // PUSH 5
      // STORE x
      // LOAD x
      // PUSH 3
      // GT
      // JUMP_IF_FALSE <after-if>
      // PUSH "x is greater than 3"
      // PRINT
      // <after-if>: PUSH "done"
      // PRINT
      // HALT
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'x' });
      expect(bytecode).toContainEqual({ op: OpCode.GT });
      
      // Find JUMP_IF_FALSE and verify it jumps past the if body
      const jumpIndex = bytecode.findIndex(i => i.op === OpCode.JUMP_IF_FALSE);
      expect(jumpIndex).toBeGreaterThan(-1);
      
      // The jump should skip the console.log in the if body
      const jumpTarget = bytecode[jumpIndex].arg;
      expect(bytecode[jumpTarget]).toEqual({ op: OpCode.PUSH, arg: "done" });
    });

    it('should compile if-else statement', () => {
      const source = `
        function main() {
          const x = 2;
          if (x > 3) {
            console.log("x is greater");
          } else {
            console.log("x is not greater");
          }
          console.log("done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      
      // Find key instructions
      const jumpIfFalseIndex = bytecode.findIndex(i => i.op === OpCode.JUMP_IF_FALSE);
      const jumpIndex = bytecode.findIndex(i => i.op === OpCode.JUMP);
      
      expect(jumpIfFalseIndex).toBeGreaterThan(-1);
      expect(jumpIndex).toBeGreaterThan(jumpIfFalseIndex);
      
      // JUMP_IF_FALSE should jump to else block
      const elseTarget = bytecode[jumpIfFalseIndex].arg;
      expect(bytecode[elseTarget]).toEqual({ op: OpCode.PUSH, arg: "x is not greater" });
      
      // JUMP should skip else block
      const endTarget = bytecode[jumpIndex].arg;
      expect(bytecode[endTarget]).toEqual({ op: OpCode.PUSH, arg: "done" });
    });

    it('should compile nested if statements', () => {
      const source = `
        function main() {
          const x = 5;
          const y = 10;
          if (x > 3) {
            console.log("x > 3");
            if (y > 8) {
              console.log("y > 8");
            }
            console.log("inner done");
          }
          console.log("outer done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should have two JUMP_IF_FALSE instructions for the two if statements
      const jumps = result.bytecode.filter(i => i.op === OpCode.JUMP_IF_FALSE);
      expect(jumps).toHaveLength(2);
    });

    it('should compile if with comparison expressions', () => {
      const source = `
        function main() {
          const age = 18;
          if (age == "18") {
            console.log("age equals 18 (with type coercion)");
          }
          if (age != 20) {
            console.log("age not 20");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain EQ and NEQ opcodes
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ });
      expect(result.bytecode).toContainEqual({ op: OpCode.NEQ });
    });

    it('should compile if with complex conditions', () => {
      const source = `
        function main() {
          if ((10 + 5) > (10 - 5)) {
            console.log("sum greater than difference");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain arithmetic and comparison
      expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
      expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
      expect(result.bytecode).toContainEqual({ op: OpCode.GT });
    });

    it('should handle empty if blocks', () => {
      const source = `
        function main() {
          const x = 5;
          if (x > 10) {
            // Empty block
          }
          console.log("done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should still have proper jump structure
      const jumpIfFalse = result.bytecode.find(i => i.op === OpCode.JUMP_IF_FALSE);
      expect(jumpIfFalse).toBeDefined();
    });
  });

  describe('while loops', () => {
    it('should compile simple while loop', () => {
      const source = `
        function main() {
          let i = 0;
          while (i < 5) {
            console.log("i is: " + i);
            i = i + 1;
          }
          console.log("done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Expected pattern:
      // PUSH 0
      // STORE i
      // <loop-start>: LOAD i
      // PUSH 5
      // LT
      // JUMP_IF_FALSE <loop-end>
      // ... loop body ...
      // JUMP <loop-start>
      // <loop-end>: PUSH "done"
      
      const bytecode = result.bytecode;
      
      // Find the two jumps
      const jumpIfFalseIndex = bytecode.findIndex(i => i.op === OpCode.JUMP_IF_FALSE);
      const jumpIndex = bytecode.findIndex(i => i.op === OpCode.JUMP);
      
      expect(jumpIfFalseIndex).toBeGreaterThan(-1);
      expect(jumpIndex).toBeGreaterThan(jumpIfFalseIndex);
      
      // JUMP should go back to loop start (before LT comparison)
      const loopStartIndex = bytecode.findIndex(i => i.op === OpCode.LT) - 2; // LOAD i, PUSH 5
      expect(bytecode[jumpIndex].arg).toBe(loopStartIndex);
      
      // JUMP_IF_FALSE should jump past the loop
      const loopEndIndex = bytecode[jumpIfFalseIndex].arg;
      expect(bytecode[loopEndIndex]).toEqual({ op: OpCode.PUSH, arg: "done" });
    });

    it('should compile while loop with complex condition', () => {
      const source = `
        function main() {
          let x = 10;
          let y = 0;
          while ((x - y) > 5) {
            console.log("diff > 5");
            y = y + 1;
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain arithmetic in condition
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.SUB });
      expect(bytecode).toContainEqual({ op: OpCode.GT });
    });

    it('should compile nested while loops', () => {
      const source = `
        function main() {
          let i = 0;
          while (i < 2) {
            let j = 0;
            while (j < 3) {
              console.log("i,j: " + i + "," + j);
              j = j + 1;
            }
            i = i + 1;
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should have 2 JUMP_IF_FALSE (one per while) and 2 JUMP (back to start)
      const jumpIfFalses = result.bytecode.filter(i => i.op === OpCode.JUMP_IF_FALSE);
      const jumps = result.bytecode.filter(i => i.op === OpCode.JUMP);
      
      expect(jumpIfFalses).toHaveLength(2);
      expect(jumps).toHaveLength(2);
    });

    it('should handle empty while loop body', () => {
      const source = `
        function main() {
          let x = 0;
          while (x > 10) {
            // Empty body - this will be infinite loop if condition was true
          }
          console.log("done");
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should still have proper loop structure
      const jumpIfFalse = result.bytecode.find(i => i.op === OpCode.JUMP_IF_FALSE);
      const jump = result.bytecode.find(i => i.op === OpCode.JUMP);
      
      expect(jumpIfFalse).toBeDefined();
      expect(jump).toBeDefined();
    });

    it('should compile while with assignment expression', () => {
      const source = `
        function main() {
          let x = 5;
          while (x > 0) {
            console.log("x is: " + x);
            x = x - 1;
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should have proper loop with decrement
      expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'x' });
    });
  });
});