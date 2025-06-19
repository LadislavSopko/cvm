import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { compile } from '@cvm/parser';

describe('VM + Compiler Integration', () => {
  it('should execute compiled return statement', () => {
    const source = `
      function main() {
        return 42;
      }
      main();
    `;
    
    // Compile the source code
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    expect(compileResult.bytecode).toBeDefined();
    
    // Execute the bytecode
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(42);
  });
  
  it('should execute return without value', () => {
    const source = `
      function main() {
        return;
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(null);
  });
  
  it('should execute return with console output', () => {
    const source = `
      function main() {
        console.log("Before return");
        return "result";
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe("result");
    expect(state.output).toEqual(["Before return"]);
  });
  
  it('should stop execution after return', () => {
    const source = `
      function main() {
        console.log("Before");
        return 123;
        console.log("After - should not print");
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(123);
    expect(state.output).toEqual(["Before"]);
    expect(state.output).not.toContain("After - should not print");
  });
  
  it('should handle return in if/else branches', () => {
    const source = `
      function main() {
        let x = true;
        if (x) {
          return "yes";
        } else {
          return "no";
        }
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe("yes");
  });
});