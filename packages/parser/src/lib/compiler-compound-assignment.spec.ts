import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Compound Assignment Operators', () => {
  describe('Addition assignment (+=)', () => {
    it('should compile += for simple variable', () => {
      const source = `
        function main() {
          let x = 10;
          x += 5;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'x' });
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode).toContainEqual({ op: OpCode.ADD });
      
      // Find the second STORE x
      const storeIndices = bytecode.reduce((acc, instr, idx) => {
        if (instr.op === OpCode.STORE && instr.arg === 'x') acc.push(idx);
        return acc;
      }, [] as number[]);
      expect(storeIndices.length).toBe(2);
    });

    it('should compile += with string concatenation', () => {
      const source = `
        function main() {
          let msg = "Hello";
          msg += " World";
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'Hello' });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'msg' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'msg' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: ' World' });
      expect(result.bytecode).toContainEqual({ op: OpCode.ADD }); // VM decides at runtime
    });
  });

  describe('Subtraction assignment (-=)', () => {
    it('should compile -= for simple variable', () => {
      const source = `
        function main() {
          let x = 20;
          x -= 8;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 8 });
      expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
    });
  });

  describe('Multiplication assignment (*=)', () => {
    it('should compile *= for simple variable', () => {
      const source = `
        function main() {
          let x = 5;
          x *= 3;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 3 });
      expect(result.bytecode).toContainEqual({ op: OpCode.MUL });
    });
  });

  describe('Division assignment (/=)', () => {
    it('should compile /= for simple variable', () => {
      const source = `
        function main() {
          let x = 20;
          x /= 4;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 4 });
      expect(result.bytecode).toContainEqual({ op: OpCode.DIV });
    });
  });

  describe('Modulo assignment (%=)', () => {
    it('should compile %= for simple variable', () => {
      const source = `
        function main() {
          let x = 17;
          x %= 5;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(result.bytecode).toContainEqual({ op: OpCode.MOD });
    });
  });

  describe('Complex expressions', () => {
    it('should compile compound assignment with expression on right side', () => {
      const source = `
        function main() {
          let x = 10;
          let y = 5;
          x += y * 2;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should load x, then evaluate y * 2, then add
      const bytecode = result.bytecode;
      
      // Find the compound assignment sequence
      // After storing x=10 and y=5, we should find LOAD x for the compound assignment
      const loadXIndex = bytecode.findIndex((instr, idx) => 
        instr.op === OpCode.LOAD && instr.arg === 'x' && idx > 3
      );
      expect(loadXIndex).toBeGreaterThan(-1);
      
      // After LOAD x, should have y * 2 evaluation
      expect(bytecode[loadXIndex + 1]).toEqual({ op: OpCode.LOAD, arg: 'y' });
      expect(bytecode[loadXIndex + 2]).toEqual({ op: OpCode.PUSH, arg: 2 });
      expect(bytecode[loadXIndex + 3]).toEqual({ op: OpCode.MUL });
      expect(bytecode[loadXIndex + 4]).toEqual({ op: OpCode.ADD });
    });

    it('should compile multiple compound assignments', () => {
      const source = `
        function main() {
          let x = 100;
          x -= 10;
          x *= 2;
          x /= 3;
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Count occurrences of each operation
      const ops = result.bytecode.filter(instr => 
        [OpCode.SUB, OpCode.MUL, OpCode.DIV].includes(instr.op)
      );
      expect(ops).toHaveLength(3);
      expect(ops[0].op).toBe(OpCode.SUB);
      expect(ops[1].op).toBe(OpCode.MUL);
      expect(ops[2].op).toBe(OpCode.DIV);
    });
  });
});