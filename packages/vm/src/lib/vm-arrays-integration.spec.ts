import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('integration - arrays end-to-end', () => {
  it('should compile and execute array operations', () => {
    const source = `
      function main(): void {
        const arr = ["hello", "world"];
        console.log(arr[0]);
        console.log(arr[1]);
        
        const numbers = [1, 2, 3];
        const len = numbers.length;
        console.log(len);
        
        numbers.push(4);
        console.log(numbers.length);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['hello', 'world', '3', '4']);
  });

  it('should handle JSON parsing', () => {
    const source = `
      function main(): void {
        const jsonStr = '["apple", "banana", "cherry"]';
        const fruits = JSON.parse(jsonStr);
        console.log(fruits[1]);
        console.log(fruits.length);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['banana', '3']);
  });

  it('should handle typeof operator', () => {
    const source = `
      function main(): void {
        const arr = [1, 2, 3];
        const str = "hello";
        const num = 42;
        const bool = true;
        const nothing = null;
        
        console.log(typeof arr);
        console.log(typeof str);
        console.log(typeof num);
        console.log(typeof bool);
        console.log(typeof nothing);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['array', 'string', 'number', 'boolean', 'null']);
  });

  it('should work with CC and arrays', () => {
    const source = `
      function main(): void {
        const prompt = "List three colors as JSON array";
        const response = CC(prompt);
        const colors = JSON.parse(response);
        console.log(colors.length);
        console.log(colors[0]);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    let state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe("List three colors as JSON array");
    
    // Simulate CC response
    state = vm.resume(state, '["red", "green", "blue"]', compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['3', 'red']);
  });
});