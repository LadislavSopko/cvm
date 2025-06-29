import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { isCVMArrayRef, isCVMObjectRef } from '@cvm/types';

describe('Heap Reference Behavior', () => {
  it('should create heap reference for array literal', () => {
    const vm = new VM();
    const compileResult = compile('function main() { return [1, 2, 3]; } main();');
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    const result = state.returnValue;
    
    expect(isCVMArrayRef(result)).toBe(true);
  });
  
  it('should create heap reference for object literal', () => {
    const vm = new VM();
    const compileResult = compile('function main() { return { a: 1, b: 2 }; } main();');
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    const result = state.returnValue;
    
    expect(isCVMObjectRef(result)).toBe(true);
  });
  
  it('should share mutations through references', () => {
    const vm = new VM();
    const compileResult = compile(`
      function main() {
        var a = [1, 2, 3];
        var b = a;
        a.push(4);
        return b.length;
      }
      main();
    `);
    expect(compileResult.success).toBe(true);
    
    const state = vm.execute(compileResult.bytecode);
    const result = state.returnValue;
    
    expect(result).toBe(4);
  });
});