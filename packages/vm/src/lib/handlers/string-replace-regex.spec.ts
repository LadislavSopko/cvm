import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('String Replace Regex VM Handler', () => {
  it('should execute string.replace(regex, replacement) for single match', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // Push string: "hello world"
      { op: OpCode.PUSH, arg: 'hello world' },
      // Create regex: /world/
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      // Push replacement: "universe"
      { op: OpCode.PUSH, arg: 'universe' },
      // Execute replace
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack.length).toBe(1);
    expect(result.stack[0]).toBe('hello universe');
  });

  it('should handle global flag and replace all matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'test and test again test' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.PUSH, arg: 'check' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('check and check again check');
  });

  it('should handle case-insensitive replacement', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Hello WORLD hello' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'gi' } },
      { op: OpCode.PUSH, arg: 'hi' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('hi WORLD hi');
  });

  it('should return original string when no match found', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'replacement' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('hello world');
  });

  it('should handle empty replacement string', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'remove this word' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'this ', flags: '' } },
      { op: OpCode.PUSH, arg: '' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('remove word');
  });

  it('should handle complex patterns', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Contact: user@example.com or admin@test.org' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: 'g' } },
      { op: OpCode.PUSH, arg: '[EMAIL]' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('Contact: [EMAIL] or [EMAIL]');
  });

  it('should handle special replacement patterns ($&, $1, etc.)', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '(\\w+)@(\\w+)', flags: '' } },
      { op: OpCode.PUSH, arg: '$2: $1' }, // Swap username and domain
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('example: user.com');
  });

  it('should handle $& (full match) replacement', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      { op: OpCode.PUSH, arg: '[$&]' }, // Wrap match in brackets
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe('hello [world]');
  });

  describe('Error Handling', () => {
    it('should handle non-string input', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 'replacement' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected string input');
    });

    it('should handle non-regex object', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'replacement' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected regex object');
    });

    it('should handle non-string replacement', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected string replacement');
    });

    it('should handle stack underflow', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'only one item' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Stack underflow');
    });
  });

  it('should handle multiple replace operations', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // First replace
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.PUSH, arg: 'hi' },
      { op: OpCode.STRING_REPLACE_REGEX },
      
      // Second replace on result
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      { op: OpCode.PUSH, arg: 'universe' },
      { op: OpCode.STRING_REPLACE_REGEX },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack.length).toBe(1);
    expect(result.stack[0]).toBe('hi universe');
  });

  it('should preserve original string (immutability)', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // Push original string
      { op: OpCode.PUSH, arg: 'original text' },
      // Duplicate it on stack
      { op: OpCode.PUSH, arg: 'original text' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'original', flags: '' } },
      { op: OpCode.PUSH, arg: 'modified' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack.length).toBe(2);
    
    const replacedString = result.stack[1];
    const originalString = result.stack[0];
    
    expect(originalString).toBe('original text');   // Unchanged
    expect(replacedString).toBe('modified text');   // Changed
  });
});