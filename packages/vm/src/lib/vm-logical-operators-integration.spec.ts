import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('Integration - Logical Operators E2E', () => {
  it('should execute AND operator correctly', () => {
    const source = `
      function main() {
        console.log(true && true);      
        console.log(true && false);     
        console.log(false && true);     
        console.log(false && false);    
        
        console.log("hello" && 42);     
        console.log(0 && "world");      
        console.log(null && true);      
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual([
      'true',
      'false',
      'false',
      'false',
      '42',
      '0',
      'null'
    ]);
  });

  it('should execute OR operator correctly', () => {
    const source = `
      function main() {
        console.log(true || false);     
        console.log(false || true);     
        console.log(false || false);    
        
        console.log("hello" || "world"); 
        console.log(0 || "fallback");    
        console.log(null || 42);         
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual([
      'true',
      'true',
      'false',
      'hello',
      'fallback',
      '42'
    ]);
  });

  it('should execute NOT operator correctly', () => {
    const source = `
      function main() {
        console.log(!true);         
        console.log(!false);        
        console.log(!"hello");      
        console.log(!0);            
        console.log(!null);         
        console.log(!!"truthy");    
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual([
      'false',
      'true',
      'false',
      'true',
      'true',
      'true'
    ]);
  });

  it('should handle complex logical expressions', () => {
    const source = `
      function main() {
        console.log(!false && true);         
        console.log(true || false && false); 
        console.log((true || false) && false); 
        
        let a = 5;
        let b = 10;
        console.log(a > 3 && b < 20);       
        console.log(a == 5 || b == 5);      
        console.log(!(a > 10));             
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual([
      'true',
      'true',
      'false',
      'true',
      'true',
      'true'
    ]);
  });

  it('should use logical operators in control flow', () => {
    const source = `
      function main() {
        let count = 0;
        
        if (true && !false) {
          count = count + 1;
        }
        
        if (false || null || 0) {
          count = count + 10;
        }
        
        if (5 > 3 && 10 < 20) {
          count = count + 2;
        }
        
        let i = 0;
        while (i < 5 && i != 3) {
          count = count + 1;
          i = i + 1;
        }
        
        console.log(count);
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual(['6']);
  });

  it('should work with array operations and logical operators', () => {
    const source = `
      function main() {
        let arr = [1, 2, 3, 4, 5];
        let result = [];
        
        let i = 0;
        while (i < arr.length && arr[i] != 4) {
          if (arr[i] > 1 && arr[i] < 5) {
            result.push(arr[i]);
          }
          i = i + 1;
        }
        
        console.log(result.length);
        console.log(result[0] || "empty");
        console.log(result[1] || "empty");
        console.log(result[2] || "empty");
      }
      main();
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(result.bytecode);
    expect(state.status).toBe('complete');
    
    expect(state.output).toEqual(['2', '2', '3', 'empty']);
  });
});