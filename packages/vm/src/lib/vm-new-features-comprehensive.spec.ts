import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { isCVMObjectRef, CVMObject } from '@cvm/types';

describe('comprehensive new features test', () => {
  it('should use all new features together', () => {
    const source = `
      function main() {
        const data = { x: 10, y: 20, z: 30 };
        
        // Object.keys() with for loop
        const keys = Object.keys(data);
        let keyCount = 0;
        for (let i = 0; i < keys.length; i++) {
          keyCount++;
        }
        
        // for-in loop
        let sum = 0;
        for (const key in data) {
          sum = sum + data[key];
        }
        
        // switch statement
        let result = "";
        switch (keyCount) {
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
            result = "many";
        }
        
        return { keyCount: keyCount, sum: sum, result: result };
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(isCVMObjectRef(state.returnValue!)).toBe(true);
    
    if (state.returnValue && isCVMObjectRef(state.returnValue)) {
      const heapObj = state.heap.get(state.returnValue.id);
      expect(heapObj).toBeDefined();
      expect(heapObj!.type).toBe('object');
      const obj = heapObj!.data as CVMObject;
      expect(obj.properties.keyCount).toBe(3);
      expect(obj.properties.sum).toBe(60);
      expect(obj.properties.result).toBe('three');
    }
  });
});