// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { runtimeError } from './errors.js';
import { 
  createCVMArray, 
  isCVMArray, 
  isCVMNumber, 
  isCVMString,
  isCVMArrayRef,
  isCVMObjectRef,
  CVMArray,
  CVMObject,
  createCVMUndefined,
  cvmToString,
  isCVMUndefined,
  CVMArrayRef,
  CVMValue
} from '@cvm/types';
import { VMState } from '../vm.js';
import { strictEquals } from './comparison.js';

export function arrayElements(state: VMState, ref: CVMArrayRef): CVMValue[] | undefined {
  const heapObj = state.heap.get(ref.id);
  return heapObj?.type === 'array' ? (heapObj.data as CVMArray).elements : undefined;
}

export function sliceArray(state: VMState, ref: CVMArrayRef, start: number, end?: number): CVMArrayRef {
  const elements = (state.heap.get(ref.id)!.data as CVMArray).elements;
  return state.heap.allocate('array', createCVMArray(elements.slice(start, end)));
}

export function arrayIndexOf(elements: CVMValue[], value: CVMValue, fromEnd = false): number {
  if (fromEnd) {
    for (let i = elements.length - 1; i >= 0; i--) {
      if (strictEquals(elements[i], value)) return i;
    }
    return -1;
  }
  return elements.findIndex(element => strictEquals(element, value));
}

/**
 * Opcode handlers for array operations
 * All array operations work with heap references to maintain JavaScript semantics
 * 
 * ARRAY_GET and ARRAY_SET handle arrays, objects, and strings for bracket notation access.
 * Note: For new code, prefer the unified GET/SET opcodes which provide cleaner semantics.
 */
export const arrayHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  /**
   * ARRAY_NEW: Creates a new empty array on the heap
   * Stack: [] -> [array-ref]
   */
  [OpCode.ARRAY_NEW]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state) => {
      const array = createCVMArray();
      const ref = state.heap.allocate('array', array);
      state.stack.push(ref);
      return undefined;
    }
  },

  /**
   * ARRAY_PUSH: Pushes a value to the end of an array
   * Stack: [array-ref, value] -> [array-ref]
   */
  [OpCode.ARRAY_PUSH]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const arrayOrRef = state.stack.pop()!;
      
      let array: CVMArray;
      
      if (isCVMArrayRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return runtimeError(state, instruction, 'Invalid array reference');
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMArray(arrayOrRef)) {
        array = arrayOrRef;
      } else {
        return runtimeError(state, instruction, 'ARRAY_PUSH requires an array');
      }
      
      array.elements.push(value);
      state.stack.push(arrayOrRef); // Push back the original reference or array
      return undefined;
    }
  },

  [OpCode.ARRAY_GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const index = state.stack.pop()!;
      const arrayOrRef = state.stack.pop()!;
      
      let array: CVMArray;
      
      // Dereference if needed
      if (isCVMArrayRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return runtimeError(state, instruction, 'Invalid array reference');
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return runtimeError(state, instruction, 'Invalid object reference');
        }
        // Handle object property access
        const obj = heapObj.data as CVMObject;
        const key = cvmToString(index);
        const value = obj.properties[key] ?? createCVMUndefined();
        state.stack.push(value);
        return undefined;
      } else if (isCVMArray(arrayOrRef)) {
        array = arrayOrRef;
      } else if (isCVMString(arrayOrRef)) {
        // Handle string character access
        let charIndex: number | undefined;
        
        if (isCVMNumber(index)) {
          charIndex = index;
        } else if (isCVMString(index)) {
          const parsed = parseInt(index, 10);
          if (!isNaN(parsed) && parsed.toString() === index) {
            charIndex = parsed;
          }
        }
        
        if (charIndex !== undefined && charIndex >= 0 && charIndex < arrayOrRef.length) {
          state.stack.push(arrayOrRef[charIndex]);
        } else {
          state.stack.push(createCVMUndefined());
        }
        return undefined;
      } else {
        return runtimeError(state, instruction, 'ARRAY_GET requires an array, object, or string');
      }
      
      // Handle array access
      let arrayIndex: number | undefined;
      
      if (isCVMNumber(index)) {
        arrayIndex = index;
      } else if (isCVMString(index)) {
        // Try to convert string to number
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
        return runtimeError(state, instruction, 'ARRAY_GET requires numeric or numeric string index');
      }
      
      const element = array.elements[arrayIndex] ?? createCVMUndefined();
      state.stack.push(element);
      return undefined;
    }
  },

  [OpCode.ARRAY_SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const index = state.stack.pop()!;
      const arrayOrRef = state.stack.pop()!;
      
      let array: CVMArray;
      
      // Dereference if needed
      if (isCVMArrayRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return runtimeError(state, instruction, 'Invalid array reference');
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return runtimeError(state, instruction, 'Invalid object reference');
        }
        // Handle object property assignment
        const obj = heapObj.data as CVMObject;
        const key = cvmToString(index);
        obj.properties[key] = value;
        state.stack.push(arrayOrRef); // Push back the original reference
        return undefined;
      } else if (isCVMArray(arrayOrRef)) {
        array = arrayOrRef;
      } else {
        return runtimeError(state, instruction, 'ARRAY_SET requires an array');
      }
      
      // Handle array access
      let arrayIndex: number | undefined;
      
      if (isCVMNumber(index)) {
        arrayIndex = index;
      } else if (isCVMString(index)) {
        // Try to convert string to number
        const parsed = parseInt(index, 10);
        if (!isNaN(parsed) && parsed.toString() === index && parsed >= 0) {
          arrayIndex = parsed;
        } else {
          // Non-numeric string - set as array property
          if (!array.properties) {
            array.properties = {};
          }
          array.properties[index] = value;
          state.stack.push(arrayOrRef);
          return undefined;
        }
      } else {
        return runtimeError(state, instruction, 'ARRAY_SET requires numeric or numeric string index');
      }
      
      const idx = Math.floor(arrayIndex);
      if (idx < 0) {
        return runtimeError(state, instruction, 'ARRAY_SET: Negative index not allowed');
      }
      
      array.elements[idx] = value;
      state.stack.push(arrayOrRef); // Push back the original reference or array
      return undefined;
    }
  },

  [OpCode.ARRAY_SLICE]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const end = state.stack.pop()!;
      const start = state.stack.pop()!;
      const arrayRef = state.stack.pop()!;
      if (!isCVMArrayRef(arrayRef) || !arrayElements(state, arrayRef)) {
        return runtimeError(state, instruction, 'ARRAY_SLICE requires an array');
      }
      state.stack.push(sliceArray(state, arrayRef, isCVMNumber(start) ? start : 0, isCVMNumber(end) ? end : undefined));
      return undefined;
    }
  },

  [OpCode.ARRAY_JOIN]: {
    stackIn: 2,  // array, separator
    stackOut: 1, // string
    execute: (state, instruction) => {
      const separator = state.stack.pop()!;
      const arrayRef = state.stack.pop()!;
      
      // Helper function to check if value is an array reference
      const isArrayReference = (value: any): boolean => {
        if (!isCVMArrayRef(value)) {
          return false;
        }
        const heapObj = state.heap.get(value.id);
        return heapObj !== undefined && heapObj.type === 'array';
      };
      
      if (!isArrayReference(arrayRef)) {
        return runtimeError(state, instruction, 'ARRAY_JOIN requires an array');
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      const array = heapObj!.data as CVMArray;
      const sep = isCVMString(separator) ? separator : String(separator);
      
      // Convert all elements to strings
      const stringElements = array.elements.map(el => {
        if (el === null) return 'null';
        if (el === undefined) return 'undefined';
        if (isCVMUndefined(el)) return 'undefined';
        return String(el);
      });
      
      const result = stringElements.join(sep);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.ARRAY_INDEX_OF]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const searchElement = state.stack.pop()!;
      const arrayRef = state.stack.pop()!;
      const elements = isCVMArrayRef(arrayRef) ? arrayElements(state, arrayRef) : undefined;
      if (!elements) {
        return runtimeError(state, instruction, 'ARRAY_INDEX_OF requires an array');
      }
      state.stack.push(arrayIndexOf(elements, searchElement));
      return undefined;
    }
  }
};

