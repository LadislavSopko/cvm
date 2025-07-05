import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Regex Literal Compilation', () => {
  it('should compile basic regex literal to LOAD_REGEX', () => {
    const source = `
      function main() {
        var pattern = /hello/;
        return 0;
      }
    `;
    
    const result = compile(source);
    
    // Verify compilation succeeded
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.bytecode.length).toBeGreaterThan(0);
    
    // Find LOAD_REGEX instruction
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr).toBeDefined();
    
    // Verify instruction payload
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'hello',
      flags: ''
    });
  });

  it('should compile regex with flags', () => {
    const source = `
      function main() {
        var pattern = /test/gi;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'test',
      flags: 'gi'
    });
  });

  it('should handle escape sequences correctly', () => {
    const source = `
      function main() {
        var email = /\\w+@\\w+\\.\\w+/;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: '\\w+@\\w+\\.\\w+',
      flags: ''
    });
  });

  it('should handle complex flags', () => {
    const source = `
      function main() {
        var pattern = /multiline.*text/gims;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'multiline.*text',
      flags: 'gims'
    });
  });

  it('should handle multiple regex literals', () => {
    const source = `
      function main() {
        var pattern1 = /first/g;
        var pattern2 = /second/i;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstrs = result.bytecode.filter(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstrs.length).toBe(2);
    
    expect(loadRegexInstrs[0].arg).toEqual({
      pattern: 'first',
      flags: 'g'
    });
    
    expect(loadRegexInstrs[1].arg).toEqual({
      pattern: 'second',
      flags: 'i'
    });
  });
});