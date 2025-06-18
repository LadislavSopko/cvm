import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - comparison operators', () => {
  describe('equality operators', () => {
    it('should compile == operator', () => {
      const source = `
        function main(): void {
          const a = 5;
          const b = 5;
          const result = a == b;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'a' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'a' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'b' });
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'result' });
    });

    it('should compile != operator', () => {
      const source = `
        function main(): void {
          const x = 10;
          const y = 20;
          const notEqual = x != y;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'y' });
      expect(result.bytecode).toContainEqual({ op: OpCode.NEQ });
    });
  });

  describe('relational operators', () => {
    it('should compile < operator', () => {
      const source = `
        function main(): void {
          const a = 5;
          const b = 10;
          const less = a < b;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'a' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'b' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LT });
    });

    it('should compile > operator', () => {
      const source = `
        function main(): void {
          const x = 20;
          const y = 10;
          const greater = x > y;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'y' });
      expect(result.bytecode).toContainEqual({ op: OpCode.GT });
    });
  });

  describe('complex expressions', () => {
    it('should compile comparison with literals', () => {
      const source = `
        function main(): void {
          const result = 5 < 10;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
      expect(result.bytecode).toContainEqual({ op: OpCode.LT });
    });

    it('should compile comparison with string and number', () => {
      const source = `
        function main(): void {
          const str = "5";
          const num = 5;
          const equal = str == num;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "5" });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'str' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'num' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'num' });
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ });
    });

    it('should compile nested comparisons', () => {
      const source = `
        function main(): void {
          const a = 5;
          const b = 10;
          const c = 15;
          const result = (a < b) == true;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // First comparison: a < b
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'a' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'b' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LT });
      // Second comparison: result == true
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(result.bytecode).toContainEqual({ op: OpCode.EQ });
    });
  });
});