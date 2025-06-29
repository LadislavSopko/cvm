import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('ADD opcode type handling', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should concatenate when either operand is string', () => {
    const source = `
      function main() {
        var a = "hello";
        var b = 5;
        console.log(a + b);
      }
      main();
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.output).toContain("hello5");
  });

  it('should concatenate number + string', () => {
    const source = `
      function main() {
        var a = 10;
        var b = " apples";
        console.log(a + b);
      }
      main();
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.output).toContain("10 apples");
  });

  it('should add when both operands are numbers', () => {
    const source = `
      function main() {
        var a = 10;
        var b = 20;
        console.log(a + b);
      }
      main();
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.output).toContain("30");
  });

  it('should handle dynamic string concatenation', () => {
    const source = `
      function main() {
        var name = "World";
        var greeting = "Hello, " + name + "!";
        console.log(greeting);
      }
      main();
    `;
    const compileResult = compile(source);
    expect(compileResult.success).toBe(true);
    
    const result = vm.execute(compileResult.bytecode);
    expect(result.status).toBe('complete');
    expect(result.output).toContain("Hello, World!");
  });
});