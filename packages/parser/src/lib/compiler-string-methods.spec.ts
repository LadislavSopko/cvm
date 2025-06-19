import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - String methods', () => {
  describe('substring method', () => {
    it('should compile substring with start and end', () => {
      const source = `
        function main() {
          const str = "Hello, World!";
          const sub = str.substring(7, 12);
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'Hello, World!' });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 7 });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 12 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SUBSTRING });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'sub' });
    });

    it('should compile substring with only start', () => {
      const source = `
        function main() {
          const str = "Hello, World!";
          const sub = str.substring(7);
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 7 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SUBSTRING });
    });

    it('should compile substring with no arguments', () => {
      const source = `
        function main() {
          const str = "Hello";
          const sub = str.substring();
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SUBSTRING });
    });
  });

  describe('indexOf method', () => {
    it('should compile indexOf', () => {
      const source = `
        function main() {
          const str = "Hello, World!";
          const index = str.indexOf("World");
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'World' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_INDEXOF });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'index' });
    });

    it('should compile indexOf with no arguments', () => {
      const source = `
        function main() {
          const str = "Hello";
          const index = str.indexOf();
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: '' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_INDEXOF });
    });
  });

  describe('split method', () => {
    it('should compile split', () => {
      const source = `
        function main() {
          const str = "apple,banana,cherry";
          const parts = str.split(",");
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: ',' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SPLIT });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'parts' });
    });

    it('should compile split with empty delimiter', () => {
      const source = `
        function main() {
          const str = "Hello";
          const chars = str.split("");
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: '' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SPLIT });
    });

    it('should compile split with no arguments', () => {
      const source = `
        function main() {
          const str = "Hello";
          const chars = str.split();
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: '' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SPLIT });
    });
  });

  describe('chained string methods', () => {
    it('should compile chained string methods', () => {
      const source = `
        function main() {
          const str = "Hello, World!";
          const result = str.substring(0, 5).indexOf("llo");
        }
        main();
      `;

      const result = compile(source);
      
      if (!result.success) {
        console.log('Compilation errors:', result.errors);
      }
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      // First substring
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'str' });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 0 });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_SUBSTRING });
      // Then indexOf on the result
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'llo' });
      expect(bytecode).toContainEqual({ op: OpCode.STRING_INDEXOF });
    });
  });
});