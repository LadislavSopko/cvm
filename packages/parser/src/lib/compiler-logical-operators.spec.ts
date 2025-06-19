import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Logical Operators', () => {
  describe('AND (&&) operator', () => {
    it('should compile simple AND expression', () => {
      const source = `
        function main() {
          let result = true && false;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: false });
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'result' });
    });

    it('should compile AND with variable operands', () => {
      const source = `
        function main() {
          let a = true;
          let b = false;
          let result = a && b;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'a' });
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'b' });
      expect(bytecode).toContainEqual({ op: OpCode.AND });
    });

    it('should compile chained AND expressions', () => {
      const source = `
        function main() {
          let result = true && false && true;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      // Should compile as (true && false) && true
      const andOps = bytecode.filter(inst => inst.op === OpCode.AND);
      expect(andOps).toHaveLength(2);
    });

    it('should compile AND in if condition', () => {
      const source = `
        function main() {
          if (true && false) {
            console.log("yes");
          }
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE)).toBe(true);
    });
  });

  describe('OR (||) operator', () => {
    it('should compile simple OR expression', () => {
      const source = `
        function main() {
          let result = true || false;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: false });
      expect(bytecode).toContainEqual({ op: OpCode.OR });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'result' });
    });

    it('should compile OR with expressions', () => {
      const source = `
        function main() {
          let result = (5 > 3) || (2 < 1);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.GT });
      expect(bytecode).toContainEqual({ op: OpCode.LT });
      expect(bytecode).toContainEqual({ op: OpCode.OR });
    });

    it('should compile mixed AND/OR expressions', () => {
      const source = `
        function main() {
          let result = true && false || true;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      // AND has higher precedence than OR
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode).toContainEqual({ op: OpCode.OR });
    });
  });

  describe('NOT (!) operator', () => {
    it('should compile NOT expression', () => {
      const source = `
        function main() {
          let result = !true;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: true });
      expect(bytecode).toContainEqual({ op: OpCode.NOT });
      expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'result' });
    });

    it('should compile NOT with variable', () => {
      const source = `
        function main() {
          let flag = false;
          let result = !flag;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: 'flag' });
      expect(bytecode).toContainEqual({ op: OpCode.NOT });
    });

    it('should compile double negation', () => {
      const source = `
        function main() {
          let result = !!42;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      const notOps = bytecode.filter(inst => inst.op === OpCode.NOT);
      expect(notOps).toHaveLength(2);
    });

    it('should compile NOT in complex expression', () => {
      const source = `
        function main() {
          let result = !(true && false);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode).toContainEqual({ op: OpCode.NOT });
    });
  });

  describe('Complex logical expressions', () => {
    it('should compile expression with parentheses correctly', () => {
      const source = `
        function main() {
          let result = true || (false && true);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // Should evaluate (false && true) first, then OR with true
      const bytecode = result.bytecode;
      const andIndex = bytecode.findIndex(inst => inst.op === OpCode.AND);
      const orIndex = bytecode.findIndex(inst => inst.op === OpCode.OR);
      expect(andIndex).toBeLessThan(orIndex);
    });

    it('should compile logical operators with comparisons', () => {
      const source = `
        function main() {
          let x = 5;
          let y = 10;
          let result = (x > 3) && (y < 20) || (x == y);
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.GT });
      expect(bytecode).toContainEqual({ op: OpCode.LT });
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode).toContainEqual({ op: OpCode.EQ });
      expect(bytecode).toContainEqual({ op: OpCode.OR });
    });

    it('should compile NOT with other operators', () => {
      const source = `
        function main() {
          let result = !true || false && true;
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      // NOT has highest precedence, then AND, then OR
      const bytecode = result.bytecode;
      const notIndex = bytecode.findIndex(inst => inst.op === OpCode.NOT);
      const andIndex = bytecode.findIndex(inst => inst.op === OpCode.AND);
      const orIndex = bytecode.findIndex(inst => inst.op === OpCode.OR);
      
      expect(notIndex).toBeLessThan(andIndex);
      expect(andIndex).toBeLessThan(orIndex);
    });
  });

  describe('Logical operators in control flow', () => {
    it('should compile logical operators in while condition', () => {
      const source = `
        function main() {
          let i = 0;
          while (i < 10 && i != 5) {
            i = i + 1;
          }
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.LT });
      expect(bytecode).toContainEqual({ op: OpCode.NEQ });
      expect(bytecode).toContainEqual({ op: OpCode.AND });
      expect(bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE)).toBe(true);
    });

    it('should compile nested if with logical operators', () => {
      const source = `
        function main() {
          if (true || false) {
            if (!false) {
              console.log("nested");
            }
          }
        }
        main();
      `;
      
      const result = compile(source);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      
      const bytecode = result.bytecode;
      expect(bytecode).toContainEqual({ op: OpCode.OR });
      expect(bytecode).toContainEqual({ op: OpCode.NOT });
      const jumpIfFalseOps = bytecode.filter(inst => inst.op === OpCode.JUMP_IF_FALSE);
      expect(jumpIfFalseOps.length).toBeGreaterThanOrEqual(2);
    });
  });
});