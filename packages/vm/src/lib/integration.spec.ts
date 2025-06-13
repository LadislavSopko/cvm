import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('CVM Integration', () => {
  it('should compile and execute hello world', () => {
    const source = `
      function main(): void {
        console.log("Hello CVM!");
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    const state = vm.execute(compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['Hello CVM!']);
  });

  it('should compile and execute CC program', () => {
    const source = `
      function main(): void {
        const answer = CC("What is the capital of France?");
        console.log("The answer is: " + answer);
      }
      main();
    `;
    
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const vm = new VM();
    let state = vm.execute(compileResult.bytecode);
    
    // Should pause at CC
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('What is the capital of France?');
    
    // Resume with answer
    state = vm.resume(state, 'Paris', compileResult.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['The answer is: Paris']);
  });
});