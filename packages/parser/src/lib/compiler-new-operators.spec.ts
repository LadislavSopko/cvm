import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - New Operators', () => {
  describe('Modulo operator (%)', () => {
    it('should compile modulo operation', () => {
      const source = `
        function main() {
          const a = 10;
          const b = 3;
          const remainder = a % b;
          console.log("10 % 3 = " + remainder);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Should contain MOD opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.MOD });
    });

    it('should compile modulo in expressions', () => {
      const source = `
        function main() {
          if (17 % 5 == 2) {
            console.log("Modulo works!");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain MOD and EQ opcodes
      expect(result.bytecode).toContainEqual({ op: OpCode.MOD });
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ });
    });

    it('should handle modulo with parentheses', () => {
      const source = `
        function main() {
          const result = (20 + 5) % 7;
          console.log(result);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should have ADD then MOD
      const addIndex = result.bytecode.findIndex(i => i.op === OpCode.ADD);
      const modIndex = result.bytecode.findIndex(i => i.op === OpCode.MOD);
      expect(addIndex).toBeGreaterThan(-1);
      expect(modIndex).toBeGreaterThan(addIndex);
    });
  });

  describe('Less than or equal (<=)', () => {
    it('should compile <= operator', () => {
      const source = `
        function main() {
          const x = 5;
          if (x <= 10) {
            console.log("x is less than or equal to 10");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain LTE opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.LTE });
    });

    it('should compile <= in while loops', () => {
      const source = `
        function main() {
          let i = 0;
          while (i <= 5) {
            console.log(i);
            i = i + 1;
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain LTE opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.LTE });
    });
  });

  describe('Greater than or equal (>=)', () => {
    it('should compile >= operator', () => {
      const source = `
        function main() {
          const score = 85;
          if (score >= 80) {
            console.log("Grade: B or higher");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain GTE opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.GTE });
    });

    it('should compile >= with expressions', () => {
      const source = `
        function main() {
          if ((10 + 5) >= (20 - 5)) {
            console.log("15 >= 15 is true");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain arithmetic and GTE
      expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
      expect(result.bytecode).toContainEqual({ op: OpCode.SUB });
      expect(result.bytecode).toContainEqual({ op: OpCode.GTE });
    });
  });

  describe('Strict equality (===)', () => {
    it('should compile === operator', () => {
      const source = `
        function main() {
          const x = 5;
          if (x === 5) {
            console.log("x is strictly equal to 5");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain EQ_STRICT opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ_STRICT });
    });

    it('should compile === for type checking', () => {
      const source = `
        function main() {
          const value = "5";
          if (value === "5") {
            console.log("String match");
          }
          if (value === 5) {
            console.log("This won't print");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain two EQ_STRICT opcodes
      const strictEqs = result.bytecode.filter(i => i.op === OpCode.EQ_STRICT);
      expect(strictEqs).toHaveLength(2);
    });
  });

  describe('Strict inequality (!==)', () => {
    it('should compile !== operator', () => {
      const source = `
        function main() {
          const x = "5";
          if (x !== 5) {
            console.log("String '5' is not strictly equal to number 5");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain NEQ_STRICT opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.NEQ_STRICT });
    });

    it('should compile !== with null check', () => {
      const source = `
        function main() {
          const value = null;
          if (value !== 0) {
            console.log("null is not strictly equal to 0");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain NEQ_STRICT opcode
      expect(result.bytecode).toContainEqual({ op: OpCode.NEQ_STRICT });
    });
  });

  describe('Mixed operator usage', () => {
    it('should compile all new operators together', () => {
      const source = `
        function main() {
          const x = 17;
          const y = 5;
          
          if (x % y === 2) {
            console.log("17 % 5 === 2");
          }
          
          if (x >= 15) {
            if (y <= 10) {
              console.log("Range check passed");
            }
          }
          
          if (x !== "17") {
            console.log("Type check: number !== string");
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should contain all new operators
      expect(result.bytecode).toContainEqual({ op: OpCode.MOD });
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ_STRICT });
      expect(result.bytecode).toContainEqual({ op: OpCode.GTE });
      expect(result.bytecode).toContainEqual({ op: OpCode.LTE });
      expect(result.bytecode).toContainEqual({ op: OpCode.NEQ_STRICT });
    });
  });
});