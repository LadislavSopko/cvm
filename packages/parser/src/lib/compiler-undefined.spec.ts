import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - Undefined', () => {
  it('should compile undefined identifier', () => {
    const source = `
      function main() {
        const x = undefined;
      }
      main();
    `;
    
    const result = compile(source);
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
      throw new Error('Compilation failed');
    }
    const bytecode = result.bytecode;
    
    const instructions = bytecode.filter(i => 
      i.op === OpCode.PUSH_UNDEFINED || 
      i.op === OpCode.STORE
    );
    
    expect(instructions).toHaveLength(2);
    expect(instructions[0].op).toBe(OpCode.PUSH_UNDEFINED);
    expect(instructions[1].op).toBe(OpCode.STORE);
    expect(instructions[1].arg).toBe('x');
  });

  it('should handle undefined in comparisons', () => {
    const source = `
      function main() {
        const a = undefined;
        const b = null;
        const result = a == b;
      }
      main();
    `;
    
    const result = compile(source);
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
      throw new Error('Compilation failed');
    }
    const bytecode = result.bytecode;
    
    // Should have PUSH_UNDEFINED for a = undefined
    const pushUndefined = bytecode.find(i => i.op === OpCode.PUSH_UNDEFINED);
    expect(pushUndefined).toBeTruthy();
    
    // Should have EQ for comparison
    const eq = bytecode.find(i => i.op === OpCode.EQ);
    expect(eq).toBeTruthy();
  });

  it('should handle undefined in logical operations', () => {
    const source = `
      function main() {
        const x = undefined || "default";
      }
      main();
    `;
    
    const result = compile(source);
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
      throw new Error('Compilation failed');
    }
    const bytecode = result.bytecode;
    
    // Should have PUSH_UNDEFINED
    const pushUndefined = bytecode.find(i => i.op === OpCode.PUSH_UNDEFINED);
    expect(pushUndefined).toBeTruthy();
    
    // Should have OR operation
    const or = bytecode.find(i => i.op === OpCode.OR);
    expect(or).toBeTruthy();
  });

  it('should handle typeof undefined', () => {
    const source = `
      function main() {
        const type = typeof undefined;
      }
      main();
    `;
    
    const result = compile(source);
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
      throw new Error('Compilation failed');
    }
    const bytecode = result.bytecode;
    
    // Should have PUSH_UNDEFINED and TYPEOF
    const pushUndefined = bytecode.find(i => i.op === OpCode.PUSH_UNDEFINED);
    const typeofOp = bytecode.find(i => i.op === OpCode.TYPEOF);
    
    expect(pushUndefined).toBeTruthy();
    expect(typeofOp).toBeTruthy();
  });

  it('should handle undefined in return statement', () => {
    const source = `
      function main() {
        return undefined;
      }
      main();
    `;
    
    const result = compile(source);
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
      throw new Error('Compilation failed');
    }
    const bytecode = result.bytecode;
    
    // Should have PUSH_UNDEFINED followed by RETURN
    const pushUndefinedIndex = bytecode.findIndex(i => i.op === OpCode.PUSH_UNDEFINED);
    const returnIndex = bytecode.findIndex(i => i.op === OpCode.RETURN);
    
    expect(pushUndefinedIndex).toBeGreaterThan(-1);
    expect(returnIndex).toBeGreaterThan(pushUndefinedIndex);
  });
});