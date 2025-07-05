import { describe, it, expect } from 'vitest';
import { OpCode } from './bytecode.js';

describe('RegExp Bytecode Support', () => {
  it('should have LOAD_REGEX opcode defined', () => {
    // Test that LOAD_REGEX exists in enum
    expect(OpCode.LOAD_REGEX).toBe('LOAD_REGEX');
    expect(typeof OpCode.LOAD_REGEX).toBe('string');
  });
  
  it('should be included in OpCode enum values', () => {
    // Test that LOAD_REGEX is part of the enum
    const opcodes = Object.values(OpCode);
    expect(opcodes).toContain('LOAD_REGEX');
  });

  it('should be accessible as enum member', () => {
    // Test enum member access
    expect(OpCode['LOAD_REGEX']).toBeDefined();
    expect(OpCode['LOAD_REGEX']).toBe('LOAD_REGEX');
  });

  it('should maintain enum integrity', () => {
    // Ensure we didn't break existing opcodes
    expect(OpCode.PUSH).toBe('PUSH');
    expect(OpCode.HALT).toBe('HALT');
    expect(Object.values(OpCode).length).toBeGreaterThan(50); // CVM has many opcodes
  });
});