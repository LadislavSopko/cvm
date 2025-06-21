import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('compiler - object support', () => {
  describe('object literals', () => {
    it('should compile empty object', () => {
      const source = `
        function main(): void {
          const obj = {};
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.OBJECT_CREATE });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'obj' });
    });

    it('should compile object with single property', () => {
      const source = `
        function main(): void {
          const obj = { name: "John" };
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.OBJECT_CREATE });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "name" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "John" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_SET });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'obj' });
    });

    it('should compile object with multiple properties', () => {
      const source = `
        function main(): void {
          const person = { 
            name: "Alice",
            age: 30,
            active: true
          };
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.OBJECT_CREATE });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "name" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "Alice" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_SET });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "age" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 30 });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_SET });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: "active" });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_SET });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'person' });
    });

    it('should compile object with computed property values', () => {
      const source = `
        function main(): void {
          const x = 10;
          const obj = { 
            value: x + 5
          };
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // Should have the arithmetic operation for x + 5
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'x' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 5 });
      expect(result.bytecode).toContainEqual({ op: OpCode.ADD });
    });

    it('should compile nested objects', () => {
      const source = `
        function main(): void {
          const data = { 
            user: { name: "Bob" }
          };
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // Should create inner object first
      const instructions = result.bytecode!;
      const objectCreates = instructions.filter(i => i.op === OpCode.OBJECT_CREATE);
      expect(objectCreates.length).toBe(2); // One for inner, one for outer
    });
  });

  describe('property access', () => {
    it('should compile property read with dot notation', () => {
      const source = `
        function main(): void {
          const obj = { name: "John" };
          const n = obj.name;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'name' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_GET });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'n' });
    });

    it('should compile property read with bracket notation', () => {
      const source = `
        function main(): void {
          const obj = { name: "John" };
          const n = obj["name"];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'name' });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_GET }); // Bracket notation uses ARRAY_GET
    });

    it('should compile property write with dot notation', () => {
      const source = `
        function main(): void {
          const obj = {};
          obj.name = "John";
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'name' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'John' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PROPERTY_SET });
      expect(result.bytecode).toContainEqual({ op: OpCode.POP }); // Discard result
    });

    it('should compile property write with bracket notation', () => {
      const source = `
        function main(): void {
          const obj = {};
          obj["name"] = "John";
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'name' });
      expect(result.bytecode).toContainEqual({ op: OpCode.PUSH, arg: 'John' });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_SET }); // Bracket notation uses ARRAY_SET
      expect(result.bytecode).toContainEqual({ op: OpCode.POP }); // Discard result
    });

    it('should compile dynamic property access', () => {
      const source = `
        function main(): void {
          const obj = { a: 1, b: 2 };
          const key = "a";
          const value = obj[key];
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'key' });
      expect(result.bytecode).toContainEqual({ op: OpCode.ARRAY_GET }); // Dynamic access uses ARRAY_GET
    });
  });

  describe('JSON.stringify', () => {
    it('should compile JSON.stringify call', () => {
      const source = `
        function main(): void {
          const obj = { name: "John" };
          const json = JSON.stringify(obj);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'obj' });
      expect(result.bytecode).toContainEqual({ op: OpCode.JSON_STRINGIFY });
      expect(result.bytecode).toContainEqual({ op: OpCode.STORE, arg: 'json' });
    });

    it('should compile JSON.stringify with literal', () => {
      const source = `
        function main(): void {
          const json = JSON.stringify({ x: 1, y: 2 });
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      // Should create object inline
      expect(result.bytecode).toContainEqual({ op: OpCode.OBJECT_CREATE });
      expect(result.bytecode).toContainEqual({ op: OpCode.JSON_STRINGIFY });
    });
  });
});