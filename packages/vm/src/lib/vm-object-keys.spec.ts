import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('Object.keys() VM integration', () => {
  it('should execute Object.keys() in compiled program', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2, c: 3 };
        const keys = Object.keys(obj);
        return keys;
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue?.type).toBe('array-ref');
    // Verify the keys array contains ["a", "b", "c"]
    const keysArray = state.heap.get(state.returnValue.id);
    expect(keysArray.data.elements.map(k => k.value)).toEqual(['a', 'b', 'c']);
  });
});