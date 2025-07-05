import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';
import { CVMArray } from '@cvm/types';

describe('String Match VM Handler', () => {
  it('should execute string.match(regex) and return array for matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // Push string: "hello world"
      { op: OpCode.PUSH, arg: 'hello world' },
      // Create regex: /world/
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      // Execute match
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack.length).toBe(1);
    
    const matchRef = result.stack[0];
    expect(matchRef).toHaveProperty('type', 'array-ref');
    
    const matchObj = result.heap.get((matchRef as any).id);
    expect(matchObj!.type).toBe('array');
    const arrayData = matchObj!.data as CVMArray;
    expect(arrayData.elements.length).toBe(1);
    expect(arrayData.elements[0]).toBe('world');
  });

  it('should return null for non-matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack[0]).toBe(null);
  });

  it('should handle global flag and return all matches', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'test and test again' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const matchRef = result.stack[0];
    const matchObj = result.heap.get((matchRef as any).id);
    const arrayData = matchObj!.data as CVMArray;
    expect(arrayData.elements.length).toBe(2);
    expect(arrayData.elements[0]).toBe('test');
    expect(arrayData.elements[1]).toBe('test');
  });

  it('should handle case-insensitive matching', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Hello WORLD' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'i' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const matchRef = result.stack[0];
    const matchObj = result.heap.get((matchRef as any).id);
    const arrayData = matchObj!.data as CVMArray;
    expect(arrayData.elements[0]).toBe('Hello');
  });

  it('should handle complex patterns with groups', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '(\\w+)@(\\w+)\\.(\\w+)', flags: '' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const matchRef = result.stack[0];
    const matchObj = result.heap.get((matchRef as any).id);
    const arrayData = matchObj!.data as CVMArray;
    // Should include full match and capture groups
    expect(arrayData.elements.length).toBe(4);
    expect(arrayData.elements[0]).toBe('user@example.com'); // Full match
    expect(arrayData.elements[1]).toBe('user');             // First group
    expect(arrayData.elements[2]).toBe('example');          // Second group
    expect(arrayData.elements[3]).toBe('com');              // Third group
  });

  describe('Error Handling', () => {
    it('should handle non-string input', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.STRING_MATCH },
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
        { op: OpCode.STRING_MATCH },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Expected regex object');
    });

    it('should handle stack underflow', () => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.STRING_MATCH }, // No arguments
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Stack underflow');
    });
  });

  it('should handle empty matches correctly', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'abc' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '', flags: 'g' } }, // Empty pattern
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const matchRef = result.stack[0];
    const matchObj = result.heap.get((matchRef as any).id);
    const arrayData = matchObj!.data as CVMArray;
    // Empty pattern matches at each position
    expect(arrayData.elements.length).toBeGreaterThan(0);
  });

  it('should handle multiple match operations', () => {
    const vm = new VM();
    
    const result = vm.execute([
      // First match
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.STRING_MATCH },
      
      // Second match  
      { op: OpCode.PUSH, arg: 'test data' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.STRING_MATCH },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    expect(result.stack.length).toBe(2);
    
    const secondResult = result.stack[1];
    const firstResult = result.stack[0];
    
    expect(secondResult).toBe(null); // No match for 'xyz'
    
    const firstMatchObj = result.heap.get((firstResult as any).id);
    const firstArrayData = firstMatchObj!.data as CVMArray;
    expect(firstArrayData.elements[0]).toBe('hello');
  });
});