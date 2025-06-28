import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { compile } from '@cvm/parser';

describe('Reference Semantics', () => {
  it('should share array mutations through references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = a;
        a.push(4);
        console.log(b.length); // Should be 4
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('4');
  });

  it('should maintain separate arrays when assigned separately', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = [1, 2, 3];
        let b = [1, 2, 3];
        a.push(4);
        console.log(b.length); // Should still be 3
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('3');
  });

  it('should handle nested structures', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let obj = { arr: [1, 2, 3] };
        let ref = obj.arr;
        ref.push(4);
        console.log(obj.arr.length); // Should be 4
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('4');
  });

  it('should share object mutations through references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let a = { name: "Alice", age: 30 };
        let b = a;
        a.age = 31;
        console.log(b.age); // Should be 31
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('31');
  });

  it('should handle array of objects with shared references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let obj = { value: 10 };
        let arr = [obj, obj, obj];
        arr[0].value = 20;
        console.log(arr[1].value); // Should be 20
        console.log(arr[2].value); // Should be 20
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('20');
    expect(state.output[1]).toContain('20');
  });

  it('should handle nested object references', () => {
    const vm = new VM();
    const source = `
      function main(): void {
        let parent = { child: { name: "nested" } };
        let ref = parent.child;
        ref.name = "changed";
        console.log(parent.child.name); // Should be "changed"
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('changed');
  });
});