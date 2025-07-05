import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('RegExp Test VM Handler', () => {
  it('should execute regex.test(string) and return true for matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // Create regex: /test/i
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'i' } },
      // Push string: "Testing"
      { op: OpCode.PUSH, arg: 'Testing' },
      // Execute test
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(1);
    expect(result.stack[0]).toBe(true);
  });

  it('should return false for non-matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'Testing' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(false);
  });

  it('should handle case-sensitive vs case-insensitive flags', () => {
    const vm1 = new VM();
    const vm2 = new VM();
    
    // Case sensitive (should not match)
    const result1 = vm1.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'TEST', flags: '' } },
      { op: OpCode.PUSH, arg: 'test' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    // Case insensitive (should match)
    const result2 = vm2.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'TEST', flags: 'i' } },
      { op: OpCode.PUSH, arg: 'test' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result1.status).toBe('complete');
    expect(result1.stack[0]).toBe(false);
    
    expect(result2.status).toBe('complete');
    expect(result2.stack[0]).toBe(true);
  });

  it('should handle complex regex patterns', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // Email pattern
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: '' } },
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(true);
  });

  it('should handle global flag correctly (should not affect test)', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.PUSH, arg: 'test multiple test matches' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(true);
  });

  describe('Error Handling', () => {
    it('should handle non-regex object on stack', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'test-string' },
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected regex object');
    });

    it('should handle non-string argument', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected string argument');
    });

    it('should handle stack underflow', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.REGEX_TEST }, // No arguments on stack
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Stack underflow');
    });

    it('should not modify stack on error', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'test-string' },
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      // Stack should be empty in error state since the handler reverted changes
      expect(result.stack).toHaveLength(0);
    });
  });

  it('should handle multiple test operations', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // First test
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.REGEX_TEST },
      
      // Second test
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.REGEX_TEST },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack).toHaveLength(2);
    
    const firstResult = result.stack[0];
    const secondResult = result.stack[1];
    
    expect(firstResult).toBe(true);  // hello matches
    expect(secondResult).toBe(false); // xyz doesn't match
  });
});