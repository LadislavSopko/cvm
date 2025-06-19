import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - array support', () => {
  describe('array literals', () => {
    it('should compile empty array', () => {
      const source = `
        function main(): void {
          const arr = [];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_NEW });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'arr' });
    });

    it('should compile array with string elements', () => {
      const source = `
        function main(): void {
          const arr = ["hello", "world"];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_NEW });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "hello" });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "world" });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'arr' });
    });

    it('should compile array with number elements', () => {
      const source = `
        function main(): void {
          const arr = [1, 2, 3];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_NEW });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 1 });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 2 });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 3 });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
    });

    it('should compile array with mixed types', () => {
      const source = `
        function main(): void {
          const arr = ["text", 123, true, null];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_NEW });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "text" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 123 });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: null });
    });
  });

  describe('array access', () => {
    it('should compile array element access', () => {
      const source = `
        function main(): void {
          const arr = ["a", "b", "c"];
          const second = arr[1];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // After creating array
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'arr' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 1 });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_GET });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'second' });
    });

    it('should compile array access with variable index', () => {
      const source = `
        function main(): void {
          const arr = ["a", "b", "c"];
          const i = 2;
          const item = arr[i];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // Should load arr, then load i, then ARRAY_GET
      const bytecode = result.bytecode;
      const loadArrIndex = bytecode.findIndex(op => op.op === OpCode.LOAD && op.arg === 'arr');
      const loadIIndex = bytecode.findIndex((op, idx) => idx > loadArrIndex && op.op === OpCode.LOAD && op.arg === 'i');
      const arrayGetIndex = bytecode.findIndex((op, idx) => idx > loadIIndex && op.op === OpCode.ARRAY_GET);
      
      expect(loadArrIndex).toBeGreaterThan(-1);
      expect(loadIIndex).toBeGreaterThan(loadArrIndex);
      expect(arrayGetIndex).toBeGreaterThan(loadIIndex);
    });
  });

  describe('array methods', () => {
    it('should compile array.push()', () => {
      const source = `
        function main(): void {
          const arr = [];
          arr.push("item");
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'arr' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "item" });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_PUSH });
    });

    it('should compile array.length', () => {
      const source = `
        function main(): void {
          const arr = [1, 2, 3];
          const len = arr.length;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'arr' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LENGTH });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'len' });
    });
  });

  describe('JSON parsing', () => {
    it('should compile JSON.parse()', () => {
      const source = `
        function main(): void {
          const jsonStr = '["a", "b", "c"]';
          const arr = JSON.parse(jsonStr);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'jsonStr' });
      expect(result.bytecode).toContainEqual({ op: OpCode.JSON_PARSE });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'arr' });
    });
  });

  describe('typeof operator', () => {
    it('should compile typeof operator', () => {
      const source = `
        function main(): void {
          const arr = [];
          const type = typeof arr;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'arr' });
      expect(result.bytecode).toContainEqual({ op: OpCode.TYPEOF });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'type' });
    });
  });
});