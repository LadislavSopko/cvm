import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Unary Operators', () => {
  describe('Unary minus', () => {
    it('should compile unary minus with numbers', () => {
      const source = `
        function main() {
          let x = -42;
          let y = -x;
          console.log(y);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      // Check for UNARY_MINUS opcodes
      const unaryMinusOps = bytecode.filter(i => i.op === OpCode.UNARY_MINUS);
      expect(unaryMinusOps).toHaveLength(2);
    });

    it('should compile unary minus with expressions', () => {
      const source = `
        function main() {
          let a = 10;
          let b = -(a + 5);
          console.log(b);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      // Should have: LOAD a, PUSH 5, ADD, UNARY_MINUS
      const bytecode = result.bytecode;
      const unaryMinusIndex = bytecode.findIndex(i => i.op === OpCode.UNARY_MINUS);
      expect(unaryMinusIndex).toBeGreaterThan(-1);
      expect(bytecode[unaryMinusIndex - 1].op).toBe(OpCode.ADD);
    });
  });

  describe('Unary plus', () => {
    it('should compile unary plus for type conversion', () => {
      const source = `
        function main() {
          let str = "123";
          let num = +str;
          console.log(num);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const unaryPlusOps = result.bytecode.filter(i => i.op === OpCode.UNARY_PLUS);
      expect(unaryPlusOps).toHaveLength(1);
    });

    it('should compile unary plus with boolean', () => {
      const source = `
        function main() {
          let bool = true;
          let num = +bool;
          console.log(num);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const unaryPlusOps = result.bytecode.filter(i => i.op === OpCode.UNARY_PLUS);
      expect(unaryPlusOps).toHaveLength(1);
    });
  });

  describe('Pre-increment and pre-decrement', () => {
    it('should compile pre-increment', () => {
      const source = `
        function main() {
          let i = 5;
          let j = ++i;
          console.log(j);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const incOps = result.bytecode.filter(i => i.op === OpCode.INC);
      expect(incOps).toHaveLength(1);
      expect(incOps[0].arg).toBe(false); // false = pre-increment
    });

    it('should compile pre-decrement', () => {
      const source = `
        function main() {
          let i = 10;
          let j = --i;
          console.log(j);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const decOps = result.bytecode.filter(i => i.op === OpCode.DEC);
      expect(decOps).toHaveLength(1);
      expect(decOps[0].arg).toBe(false); // false = pre-decrement
    });
  });

  describe('Post-increment and post-decrement', () => {
    it('should compile post-increment', () => {
      const source = `
        function main() {
          let i = 5;
          let j = i++;
          console.log(j);
          console.log(i);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const incOps = result.bytecode.filter(i => i.op === OpCode.INC);
      expect(incOps).toHaveLength(1);
      expect(incOps[0].arg).toBe(true); // true = post-increment
    });

    it('should compile post-decrement', () => {
      const source = `
        function main() {
          let i = 10;
          let j = i--;
          console.log(j);
          console.log(i);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const decOps = result.bytecode.filter(i => i.op === OpCode.DEC);
      expect(decOps).toHaveLength(1);
      expect(decOps[0].arg).toBe(true); // true = post-decrement
    });
  });

  describe('Complex expressions', () => {
    it('should compile increment in loop', () => {
      const source = `
        function main() {
          let i = 0;
          while (i < 3) {
            console.log(i);
            i++;
          }
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const incOps = result.bytecode.filter(i => i.op === OpCode.INC);
      expect(incOps).toHaveLength(1);
    });

    it('should compile multiple unary operators', () => {
      const source = `
        function main() {
          let x = 5;
          let a = -x;
          let b = +x;
          let c = ++x;
          let d = x--;
          console.log(a);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode.filter(i => i.op === OpCode.UNARY_MINUS)).toHaveLength(1);
      expect(bytecode.filter(i => i.op === OpCode.UNARY_PLUS)).toHaveLength(1);
      expect(bytecode.filter(i => i.op === OpCode.INC)).toHaveLength(1);
      expect(bytecode.filter(i => i.op === OpCode.DEC)).toHaveLength(1);
    });
  });
});