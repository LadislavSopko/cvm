import { describe, it, expect } from 'vitest';
import { OpCode } from './bytecode.js';

describe('RegExp Method Bytecode Support', () => {
  it('should have REGEX_TEST opcode defined', () => {
    expect(OpCode.REGEX_TEST).toBe('REGEX_TEST');
    expect(typeof OpCode.REGEX_TEST).toBe('string');
  });

  it('should have STRING_MATCH opcode defined', () => {
    expect(OpCode.STRING_MATCH).toBe('STRING_MATCH');
    expect(typeof OpCode.STRING_MATCH).toBe('string');
  });

  it('should have STRING_REPLACE_REGEX opcode defined', () => {
    expect(OpCode.STRING_REPLACE_REGEX).toBe('STRING_REPLACE_REGEX');
    expect(typeof OpCode.STRING_REPLACE_REGEX).toBe('string');
  });
  
  it('should be included in OpCode enum values', () => {
    const opcodes = Object.values(OpCode);
    expect(opcodes).toContain('REGEX_TEST');
    expect(opcodes).toContain('STRING_MATCH');
    expect(opcodes).toContain('STRING_REPLACE_REGEX');
  });

  it('should maintain enum integrity', () => {
    // Ensure we didn't break existing opcodes
    expect(OpCode.LOAD_REGEX).toBe('LOAD_REGEX');
    expect(OpCode.STRING_REPLACE).toBe('STRING_REPLACE');
    expect(Object.values(OpCode).length).toBeGreaterThan(80); // CVM has many opcodes
  });
});