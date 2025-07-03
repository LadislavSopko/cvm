import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('for-in loop VM integration', () => {
  it('should iterate over object properties', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2, c: 3 };
        let keys = "";
        for (const key in obj) {
          keys = keys + key;
        }
        return keys; // Should be "abc"
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe('abc');
  });

  it('should handle empty objects', () => {
    const source = `
      function main() {
        const empty = {};
        let count = 0;
        for (const key in empty) {
          count++;
        }
        return count; // Should be 0
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toBe(0);
  });
});