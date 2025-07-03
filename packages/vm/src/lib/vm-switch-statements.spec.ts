import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('switch statement VM integration', () => {
  it('should execute basic switch statement', () => {
    const source = `
      function main() {
        const value = 2;
        let result = "";
        switch (value) {
          case 1:
            result = "one";
            break;
          case 2:
            result = "two";
            break;
          case 3:
            result = "three";
            break;
          default:
            result = "other";
        }
        return result;
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe('two');
  });

  it('should handle switch with fall-through', () => {
    const source = `
      function main() {
        const code = 2;
        let priority = "";
        switch (code) {
          case 1:
          case 2:
          case 3:
            priority = "low";
            break;
          case 4:
          case 5:
            priority = "high";
            break;
          default:
            priority = "unknown";
        }
        return priority;
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toBe('low');
  });
});