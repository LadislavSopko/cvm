import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Compiler - return statements', () => {
  it('should compile return with value', () => {
    const source = `
      function main() {
        return 42;
      }
      main();
    `;
    
    const result = compile(source);
    
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
    }
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toBeDefined();
    
    // Should contain: PUSH 42, RETURN
    const hasReturn = result.bytecode.some((inst, i) => 
      inst.op === OpCode.PUSH && inst.arg === 42 &&
      result.bytecode[i + 1]?.op === OpCode.RETURN
    );
    expect(hasReturn).toBe(true);
  });
  
  it('should compile return without value', () => {
    const source = `
      function main() {
        return;
      }
      main();
    `;
    
    const result = compile(source);
    
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
    }
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toBeDefined();
    
    // Should contain: PUSH null, RETURN
    const hasReturn = result.bytecode.some((inst, i) => 
      inst.op === OpCode.PUSH && inst.arg === null &&
      result.bytecode[i + 1]?.op === OpCode.RETURN
    );
    expect(hasReturn).toBe(true);
  });
  
  it('should compile return with expression', () => {
    const source = `
      function main() {
        let x = 10;
        let y = 20;
        return x + y;
      }
      main();
    `;
    
    const result = compile(source);
    
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
    }
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toBeDefined();
    
    // Should contain ADD followed by RETURN (HALT comes after)
    const hasAddReturn = result.bytecode.some((inst, i) => 
      inst.op === OpCode.ADD &&
      result.bytecode[i + 1]?.op === OpCode.RETURN
    );
    expect(hasAddReturn).toBe(true);
  });
  
  it('should compile return with string concatenation', () => {
    const source = `
      function main() {
        return "Hello " + "World";
      }
      main();
    `;
    
    const result = compile(source);
    
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
    }
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toBeDefined();
    
    // Should contain string literals, ADD, RETURN
    const bytecode = result.bytecode;
    const hasAddReturn = bytecode.some((inst, i) => 
      inst.op === OpCode.ADD &&
      bytecode[i + 1]?.op === OpCode.RETURN
    );
    expect(hasAddReturn).toBe(true);
  });
  
  it('should compile multiple returns in if/else', () => {
    const source = `
      function main() {
        let condition = true;
        if (condition) {
          return "yes";
        } else {
          return "no";
        }
      }
      main();
    `;
    
    const result = compile(source);
    
    if (!result.success) {
      console.log('Compilation errors:', result.errors);
    }
    
    expect(result.success).toBe(true);
    expect(result.bytecode).toBeDefined();
    
    // Count RETURN opcodes
    const returnCount = result.bytecode.filter(inst => inst.op === OpCode.RETURN).length;
    expect(returnCount).toBe(2);
  });
});