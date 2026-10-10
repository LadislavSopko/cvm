// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { runtimeError } from './errors.js';
import { 
  isCVMNumber, 
  isCVMString,
  isCVMArrayRef,
  isCVMObjectRef,
  CVMArray,
  CVMObject,
  createCVMUndefined,
  cvmToString
} from '@cvm/types';

export const unifiedHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const index = state.stack.pop()!;
      const target = state.stack.pop()!;
      
      if (isCVMArrayRef(target)) {
        // Array logic from arrays.ts ARRAY_GET handler
        const heapObj = state.heap.get(target.id);
        if (!heapObj || heapObj.type !== 'array') {
          return runtimeError(state, instruction, 'Invalid array reference');
        }
        const array = heapObj.data as CVMArray;
        
        let arrayIndex: number | undefined;
        
        if (isCVMNumber(index)) {
          arrayIndex = index;
        } else if (isCVMString(index)) {
          const parsed = parseInt(index, 10);
          if (!isNaN(parsed) && parsed.toString() === index && parsed >= 0) {
            arrayIndex = parsed;
          } else {
            // Non-numeric string - check array properties
            const value = array.properties?.[index] ?? createCVMUndefined();
            state.stack.push(value);
            return undefined;
          }
        } else {
          return runtimeError(state, instruction, 'GET requires numeric or numeric string index for arrays');
        }
        
        const element = array.elements[arrayIndex] ?? createCVMUndefined();
        state.stack.push(element);
        return undefined;
        
      } else if (isCVMObjectRef(target)) {
        // Object logic from arrays.ts ARRAY_GET handler
        const heapObj = state.heap.get(target.id);
        if (!heapObj || heapObj.type !== 'object') {
          return runtimeError(state, instruction, 'Invalid object reference');
        }
        const obj = heapObj.data as CVMObject;
        const key = cvmToString(index);
        const value = obj.properties[key] ?? createCVMUndefined();
        state.stack.push(value);
        return undefined;
        
      } else if (isCVMString(target)) {
        // String logic from arrays.ts ARRAY_GET handler
        let charIndex: number | undefined;
        
        if (isCVMNumber(index)) {
          charIndex = index;
        } else if (isCVMString(index)) {
          const parsed = parseInt(index, 10);
          if (!isNaN(parsed) && parsed.toString() === index) {
            charIndex = parsed;
          }
        }
        
        if (charIndex !== undefined && charIndex >= 0 && charIndex < target.length) {
          state.stack.push(target[charIndex]);
        } else {
          state.stack.push(createCVMUndefined());
        }
        return undefined;
        
      } else {
        return runtimeError(state, instruction, 'GET requires array, object, or string');
      }
    }
  },

  [OpCode.SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const index = state.stack.pop()!;
      const target = state.stack.pop()!;
      
      if (isCVMArrayRef(target)) {
        // Array logic from arrays.ts ARRAY_SET handler
        const heapObj = state.heap.get(target.id);
        if (!heapObj || heapObj.type !== 'array') {
          return runtimeError(state, instruction, 'Invalid array reference');
        }
        const array = heapObj.data as CVMArray;
        
        let arrayIndex: number | undefined;
        
        if (isCVMNumber(index)) {
          arrayIndex = index;
        } else if (isCVMString(index)) {
          const parsed = parseInt(index, 10);
          if (!isNaN(parsed) && parsed.toString() === index && parsed >= 0) {
            arrayIndex = parsed;
          } else {
            // Non-numeric string - set as array property
            if (!array.properties) {
              array.properties = {};
            }
            array.properties[index] = value;
            state.stack.push(target);
            return undefined;
          }
        } else {
          return runtimeError(state, instruction, 'SET requires numeric or numeric string index for arrays');
        }
        
        const idx = Math.floor(arrayIndex);
        if (idx < 0) {
          return runtimeError(state, instruction, 'SET: Negative index not allowed');
        }
        
        array.elements[idx] = value;
        state.stack.push(target);
        return undefined;
        
      } else if (isCVMObjectRef(target)) {
        // Object logic from arrays.ts ARRAY_SET handler
        const heapObj = state.heap.get(target.id);
        if (!heapObj || heapObj.type !== 'object') {
          return runtimeError(state, instruction, 'Invalid object reference');
        }
        const obj = heapObj.data as CVMObject;
        const key = cvmToString(index);
        obj.properties[key] = value;
        state.stack.push(target);
        return undefined;
        
      } else {
        return runtimeError(state, instruction, 'SET requires array or object');
      }
    }
  }
};