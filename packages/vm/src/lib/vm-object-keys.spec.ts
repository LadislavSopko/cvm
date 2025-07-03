import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { isCVMArrayRef, CVMArray } from '@cvm/types';

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
    expect(isCVMArrayRef(state.returnValue!)).toBe(true);
    // Verify the keys array contains ["a", "b", "c"]
    if (state.returnValue && isCVMArrayRef(state.returnValue)) {
      const keysArray = state.heap.get(state.returnValue.id);
      const arr = keysArray!.data as CVMArray;
      expect(arr.elements).toEqual(['a', 'b', 'c']);
    }
  });
});