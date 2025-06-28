import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { compile } from '@cvm/parser';

describe('Complete Reference Operator Tests', () => {
  it('should handle all comparison operators with array references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = a;
        let c = [1, 2, 3];
        
        // Strict equality
        console.log(a === b);     // true
        console.log(a === c);     // false
        console.log(a !== b);     // false
        console.log(a !== c);     // true
        
        // Non-strict equality
        console.log(a == b);      // true
        console.log(a == c);      // false
        console.log(a != b);      // false
        console.log(a != c);      // true
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual([
      'true', 'false', 'false', 'true',  // strict
      'true', 'false', 'false', 'true'   // non-strict
    ]);
  });

  it('should handle all comparison operators with object references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let obj1 = { x: 10, y: 20 };
        let obj2 = obj1;
        let obj3 = { x: 10, y: 20 };
        
        // Strict equality
        console.log(obj1 === obj2);   // true
        console.log(obj1 === obj3);   // false
        console.log(obj1 !== obj2);   // false
        console.log(obj1 !== obj3);   // true
        
        // Non-strict equality
        console.log(obj1 == obj2);    // true
        console.log(obj1 == obj3);    // false
        console.log(obj1 != obj2);    // false
        console.log(obj1 != obj3);    // true
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual([
      'true', 'false', 'false', 'true',  // strict
      'true', 'false', 'false', 'true'   // non-strict
    ]);
  });

  it('should handle typeof for all reference types', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let arr = [1, 2, 3];
        let obj = { name: "test" };
        let num = 42;
        let str = "hello";
        let bool = true;
        let nul = null;
        let undef = undefined;
        
        console.log(typeof arr);    // 'array'
        console.log(typeof obj);    // 'object'
        console.log(typeof num);    // 'number'
        console.log(typeof str);    // 'string'
        console.log(typeof bool);   // 'boolean'
        console.log(typeof nul);    // 'null'
        console.log(typeof undef);  // 'undefined'
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual([
      'array',
      'object',
      'number',
      'string',
      'boolean',
      'null',
      'undefined'
    ]);
  });

  it('should handle mixed comparisons with references and primitives', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let arr = [1, 2, 3];
        let obj = { x: 1 };
        let num = 123;
        let str = "test";
        
        // Arrays/objects compared with primitives
        console.log(arr === num);     // false
        console.log(arr === str);     // false
        console.log(obj === num);     // false
        console.log(obj === str);     // false
        
        console.log(arr == num);      // false
        console.log(arr == str);      // false
        console.log(obj == num);      // false
        console.log(obj == str);      // false
        
        // null/undefined comparisons
        console.log(arr === null);    // false
        console.log(obj === undefined); // false
        console.log(arr == null);     // false
        console.log(obj == undefined); // false
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual([
      'false', 'false', 'false', 'false',  // === comparisons
      'false', 'false', 'false', 'false',  // == comparisons
      'false', 'false', 'false', 'false'   // null/undefined
    ]);
  });

  it('should maintain reference equality through operations', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let original = [1, 2, 3];
        let copy = original;
        
        // Modify through one reference
        copy.push(4);
        
        // Still the same reference
        console.log(original === copy);  // true
        console.log(original.length);    // 4
        
        // Assignment breaks reference
        copy = [1, 2, 3, 4];
        console.log(original === copy);  // false
        console.log(original == copy);   // false
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['true', '4', 'false', 'false']);
  });
});