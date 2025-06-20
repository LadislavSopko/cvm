import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - New String Methods', () => {
  describe('slice()', () => {
    it('should compile slice with start only', () => {
      const source = `
        function main() {
          const str = "hello world";
          const result = str.slice(6);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello world' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 6 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SLICE });
    });

    it('should compile slice with start and end', () => {
      const source = `
        function main() {
          const str = "hello world";
          const result = str.slice(0, 5);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello world' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SLICE });
    });

    it('should compile slice with variable arguments', () => {
      const source = `
        function main() {
          const str = "hello";
          const start = -2;
          const result = str.slice(start);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'start' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SLICE });
    });

    it('should default to 0 when no arguments', () => {
      const source = `
        function main() {
          const str = "hello";
          const result = str.slice();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SLICE });
    });
  });

  describe('charAt()', () => {
    it('should compile charAt with index', () => {
      const source = `
        function main() {
          const str = "hello";
          const char = str.charAt(1);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 1 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_CHARAT });
    });

    it('should compile charAt with variable index', () => {
      const source = `
        function main() {
          const str = "world";
          const index = 0;
          const char = str.charAt(index);
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'index' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_CHARAT });
    });

    it('should default to 0 when no arguments', () => {
      const source = `
        function main() {
          const str = "hello";
          const char = str.charAt();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_CHARAT });
    });
  });

  describe('toUpperCase()', () => {
    it('should compile toUpperCase', () => {
      const source = `
        function main() {
          const str = "hello world";
          const upper = str.toUpperCase();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello world' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_TOUPPERCASE });
    });

    it('should compile toUpperCase on variable', () => {
      const source = `
        function main() {
          const text = "hello";
          const result = text.toUpperCase();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'text' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_TOUPPERCASE });
    });
  });

  describe('toLowerCase()', () => {
    it('should compile toLowerCase', () => {
      const source = `
        function main() {
          const str = "HELLO WORLD";
          const lower = str.toLowerCase();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'HELLO WORLD' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_TOLOWERCASE });
    });

    it('should compile toLowerCase on variable', () => {
      const source = `
        function main() {
          const text = "HELLO";
          const result = text.toLowerCase();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'text' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_TOLOWERCASE });
    });
  });

  describe('chained string methods', () => {
    it('should compile chained string methods', () => {
      const source = `
        function main() {
          const str = "hello world";
          const result = str.slice(0, 5).toUpperCase();
        }
        main();
      `;
      
      const result = compile(source);
      expect(result.success).toBe(true);
      
      const bytecode = result.bytecode;
      // First operation: slice
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'hello world' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SLICE });
      // Second operation: toUpperCase on the result
      expect(bytecode).toContainEqual({ op: OpCode.STRING_TOUPPERCASE });
    });
  });
});