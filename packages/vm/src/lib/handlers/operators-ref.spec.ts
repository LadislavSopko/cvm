import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { compile } from '@cvm/parser';

describe('Reference Equality', () => {
  it('should compare array references correctly', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = a;
        let c = [1, 2, 3];
        console.log(a === b); // true - same reference
        console.log(a === c); // false - different references
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('true');
    expect(state.output).toContain('false');
  });

  it('should compare object references correctly', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let obj1 = { x: 10, y: 20 };
        let obj2 = obj1;
        let obj3 = { x: 10, y: 20 };
        console.log(obj1 === obj2); // true - same reference
        console.log(obj1 === obj3); // false - different references
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('true');
    expect(state.output).toContain('false');
  });

  it('should handle typeof with array references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let arr = [1, 2, 3];
        console.log(typeof arr); // 'array' for CVM arrays
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('array');
  });

  it('should handle typeof with object references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let obj = { name: "test" };
        console.log(typeof obj); // 'object'
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('object');
  });

  it('should handle equality with null and undefined', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let arr = [1, 2, 3];
        let obj = { x: 1 };
        console.log(arr === null); // false
        console.log(obj === null); // false
        console.log(arr === undefined); // false
        console.log(obj === undefined); // false
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['false', 'false', 'false', 'false']);
  });

  it('should handle non-strict equality with references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = a;
        let c = [1, 2, 3];
        console.log(a == b); // true - same reference
        console.log(a == c); // false - different references
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('true');
    expect(state.output).toContain('false');
  });

  it('should handle inequality operators with references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = a;
        let c = [1, 2, 3];
        console.log(a != b); // false - same reference
        console.log(a != c); // true - different references
        console.log(a !== b); // false - same reference
        console.log(a !== c); // true - different references
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['false', 'true', 'false', 'true']);
  });
});