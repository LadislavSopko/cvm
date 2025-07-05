import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('Regex VM Handler', () => {
  it('should create RegExp object from LOAD_REGEX instruction', () => {
    const vm = new VM();
    
    // Execute LOAD_REGEX instruction
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'gi' } },
      { op: OpCode.HALT }
    ]);
    
    // Verify execution succeeded
    expect(result.status).toBe('complete');
    expect(result.error).toBeUndefined();
    
    // Verify stack has one item (the regex reference)
    expect(result.stack.length).toBe(1);
    
    // Get the heap reference from stack
    const regexRef = result.stack[0];
    expect(regexRef).toHaveProperty('type', 'object-ref');
    expect(regexRef).toHaveProperty('id');
    
    // Verify object exists on heap
    const regexObj = result.heap.get((regexRef as any).id);
    expect(regexObj).toBeDefined();
    expect(regexObj!.type).toBe('object');
    expect((regexObj!.data as any).type).toBe('regex');
    expect((regexObj!.data as any).data).toBeInstanceOf(RegExp);
    
    // Verify RegExp object properties
    const regex = (regexObj!.data as any).data as RegExp;
    expect(regex.source).toBe('hello');
    expect(regex.flags).toBe('gi');
    expect(regex.global).toBe(true);
    expect(regex.ignoreCase).toBe(true);
  });

  it('should handle regex without flags', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const regexRef = result.stack[0];
    const regexObj = result.heap.get((regexRef as any).id);
    const regex = (regexObj!.data as any).data as RegExp;
    
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('');
    expect(regex.global).toBe(false);
    expect(regex.ignoreCase).toBe(false);
  });

  it('should handle complex regex patterns', () => {
    const vm = new VM();
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: 'i' } },
      { op: OpCode.HALT }
    ]);
    
    expect(result.status).toBe('complete');
    
    const regexRef = result.stack[0];
    const regexObj = result.heap.get((regexRef as any).id);
    const regex = (regexObj!.data as any).data as RegExp;
    
    expect(regex.source).toBe('\\w+@\\w+\\.\\w+');
    expect(regex.flags).toBe('i');
    expect(regex.ignoreCase).toBe(true);
  });

  it('should handle all standard flags', () => {
    const testCases = [
      { flags: 'g', expected: { global: true, ignoreCase: false, multiline: false } },
      { flags: 'i', expected: { global: false, ignoreCase: true, multiline: false } },
      { flags: 'm', expected: { global: false, ignoreCase: false, multiline: true } },
      { flags: 'gi', expected: { global: true, ignoreCase: true, multiline: false } },
      { flags: 'gim', expected: { global: true, ignoreCase: true, multiline: true } }
    ];

    testCases.forEach(({ flags, expected }) => {
      const vm = new VM();
      
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('complete');
      
      const regexRef = result.stack[0];
      const regexObj = result.heap.get((regexRef as any).id);
      const regex = (regexObj!.data as any).data as RegExp;
      
      expect(regex.global).toBe(expected.global);
      expect(regex.ignoreCase).toBe(expected.ignoreCase);
      expect(regex.multiline).toBe(expected.multiline);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid regex patterns', () => {
      const vm = new VM();
      
      // Invalid regex: unclosed bracket
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: '[unclosed', flags: '' } },
        { op: OpCode.HALT }
      ]);
      
      // Should fail gracefully
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid regular expression');
    });

    it('should handle invalid flags', () => {
      const vm = new VM();
      
      // Invalid flag 'x'
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'x' } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid regular expression');
    });

    it('should handle multiple invalid cases', () => {
      const invalidCases = [
        { pattern: '(unclosed', flags: '', description: 'unclosed parenthesis' },
        { pattern: '*invalid', flags: '', description: 'invalid quantifier' },
        { pattern: 'test', flags: 'z', description: 'invalid flag' },
        { pattern: '+', flags: '', description: 'invalid pattern start' }
      ];

      invalidCases.forEach(({ pattern, flags, description }) => {
        const vm = new VM();
        
        const result = vm.execute([
          { op: OpCode.LOAD_REGEX, arg: { pattern, flags } },
          { op: OpCode.HALT }
        ]);
        
        expect(result.status).toBe('error');
        expect(result.error).toBeDefined();
      });
    });

    it('should not modify stack on error', () => {
      const vm = new VM();
      
      // Execute invalid regex (can't pre-populate stack via vm.stack.push)
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test-value' },
        { op: OpCode.LOAD_REGEX, arg: { pattern: '[invalid', flags: '' } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.status).toBe('error');
      expect(result.stack.length).toBe(1); // Only the initial push, regex failed
    });
  });
});