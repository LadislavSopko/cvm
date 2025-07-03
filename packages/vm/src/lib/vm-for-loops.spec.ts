import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('for loop VM integration', () => {
  it('should execute basic for loop', () => {
    const source = `
      function main() {
        let sum = 0;
        for (let i = 0; i < 5; i++) {
          sum = sum + i;
        }
        return sum; // Should be 0+1+2+3+4 = 10
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(10);
  });

  it('should handle for loop with break', () => {
    const source = `
      function main() {
        let count = 0;
        for (let i = 0; i < 10; i++) {
          if (i === 3) break;
          count++;
        }
        return count; // Should be 3
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toBe(3);
  });
});