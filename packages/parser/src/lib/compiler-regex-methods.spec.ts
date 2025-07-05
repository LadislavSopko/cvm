import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('RegExp Method Compilation', () => {
  it('should compile regex.test(string) to REGEX_TEST', () => {
    const source = `
      function main() {
        var pattern = /test/i;
        var text = "Testing";
        var result = pattern.test(text);
        return 0;
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    
    // Find REGEX_TEST instruction
    const regexTestInstr = result.bytecode.find(instr => instr.op === OpCode.REGEX_TEST);
    expect(regexTestInstr).toBeDefined();
  });

  it('should compile string.match(regex) to STRING_MATCH', () => {
    const source = `
      function main() {
        var text = "hello world";
        var pattern = /world/;
        var matches = text.match(pattern);
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const stringMatchInstr = result.bytecode.find(instr => instr.op === OpCode.STRING_MATCH);
    expect(stringMatchInstr).toBeDefined();
  });

  it('should compile string.replace(regex, replacement) to STRING_REPLACE_REGEX', () => {
    const source = `
      function main() {
        var text = "hello world";
        var pattern = /world/;
        var result = text.replace(pattern, "universe");
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const stringReplaceRegexInstr = result.bytecode.find(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
    expect(stringReplaceRegexInstr).toBeDefined();
  });

  it('should handle complex regex method chains', () => {
    const source = `
      function main() {
        var emailPattern = /\\w+@\\w+\\.\\w+/;
        var text = "Contact: user@example.com or admin@test.org";
        
        var hasEmail = emailPattern.test(text);
        var matches = text.match(emailPattern);
        var cleaned = text.replace(emailPattern, "[EMAIL]");
        
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should have all three method instructions
    const regexTest = result.bytecode.filter(instr => instr.op === OpCode.REGEX_TEST);
    const stringMatch = result.bytecode.filter(instr => instr.op === OpCode.STRING_MATCH);
    const stringReplaceRegex = result.bytecode.filter(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
    
    expect(regexTest.length).toBe(1);
    expect(stringMatch.length).toBe(1);
    expect(stringReplaceRegex.length).toBe(1);
  });

  it('should handle regex method calls with variables', () => {
    const source = `
      function main() {
        var pattern = /test/gi;
        var input = "Test this testing";
        var replacement = "check";
        
        var isMatch = pattern.test(input);
        var allMatches = input.match(pattern);
        var replaced = input.replace(pattern, replacement);
        
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Verify correct instruction order and count
    const regexOpcodes = result.bytecode.filter(instr => 
      instr.op === OpCode.REGEX_TEST || 
      instr.op === OpCode.STRING_MATCH || 
      instr.op === OpCode.STRING_REPLACE_REGEX
    );
    expect(regexOpcodes.length).toBe(3);
  });
});