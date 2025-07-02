import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
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
  cvmToString
} from '@cvm/types';

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
    execute: (state, instruction) => {
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
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMArray(arrayOrRef)) {
        array = arrayOrRef;
      } else {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_PUSH requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
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
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
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
        return {
          type: 'RuntimeError',
          message: 'ARRAY_GET requires an array, object, or string',
          pc: state.pc,
          opcode: instruction.op
        };
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
        return {
          type: 'RuntimeError',
          message: 'ARRAY_GET requires numeric or numeric string index',
          pc: state.pc,
          opcode: instruction.op
        };
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
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
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
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
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
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET requires numeric or numeric string index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const idx = Math.floor(arrayIndex);
      if (idx < 0) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET: Negative index not allowed',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      array.elements[idx] = value;
      state.stack.push(arrayOrRef); // Push back the original reference or array
      return undefined;
    }
  },

  [OpCode.ARRAY_LEN]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const arrayOrRef = state.stack.pop()!;
      
      let array: CVMArray;
      
      if (isCVMArrayRef(arrayOrRef)) {
        const heapObj = state.heap.get(arrayOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        array = heapObj.data as CVMArray;
      } else if (isCVMArray(arrayOrRef)) {
        array = arrayOrRef;
      } else {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_LEN requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(array.elements.length);
      return undefined;
    }
  },

  [OpCode.ARRAY_MAP_PROP]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const propName = state.stack.pop()!;
      const arrayRef = state.stack.pop()!;
      
      if (!isCVMArrayRef(arrayRef)) {
        return {
          type: 'RuntimeError',
          message: 'map() requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      if (!heapObj || heapObj.type !== 'array') {
        return {
          type: 'RuntimeError',
          message: 'Invalid array reference',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const array = heapObj.data as CVMArray;
      const result = createCVMArray();
      
      for (const item of array.elements) {
        if (isCVMObjectRef(item)) {
          const itemHeapObj = state.heap.get(item.id);
          if (itemHeapObj && itemHeapObj.type === 'object') {
            const obj = itemHeapObj.data as CVMObject;
            const key = cvmToString(propName);
            result.elements.push(obj.properties[key] || null);
          } else {
            result.elements.push(null);
          }
        } else {
          result.elements.push(null);
        }
      }
      
      const resultRef = state.heap.allocate('array', result);
      state.stack.push(resultRef);
      return undefined;
    }
  },

  [OpCode.ARRAY_FILTER_PROP]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const propName = state.stack.pop()!;
      const arrayRef = state.stack.pop()!;
      
      if (!isCVMArrayRef(arrayRef)) {
        return {
          type: 'RuntimeError',
          message: 'filter() requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      if (!heapObj || heapObj.type !== 'array') {
        return {
          type: 'RuntimeError',
          message: 'Invalid array reference',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const array = heapObj.data as CVMArray;
      const result = createCVMArray();
      
      for (const item of array.elements) {
        if (isCVMObjectRef(item)) {
          const itemHeapObj = state.heap.get(item.id);
          if (itemHeapObj && itemHeapObj.type === 'object') {
            const obj = itemHeapObj.data as CVMObject;
            const key = cvmToString(propName);
            // Include item if property exists and is truthy
            if (key in obj.properties && obj.properties[key]) {
              result.elements.push(item);
            }
          }
        }
      }
      
      const resultRef = state.heap.allocate('array', result);
      state.stack.push(resultRef);
      return undefined;
    }
  },

  [OpCode.ARRAY_SLICE]: {
    stackIn: 3,  // array, start, end
    stackOut: 1,
    execute: (state, instruction) => {
      const end = state.stack.pop()!;
      const start = state.stack.pop()!;
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
        return { 
          type: 'RuntimeError', 
          message: 'ARRAY_SLICE requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      const array = heapObj!.data as CVMArray;
      const startIdx = isCVMNumber(start) ? start : 0;
      const endIdx = end === undefined ? array.elements.length : 
                     isCVMNumber(end) ? end : array.elements.length;
      
      // Handle negative indices
      const normalizedStart = startIdx < 0 ? 
        Math.max(0, array.elements.length + startIdx) : startIdx;
      const normalizedEnd = endIdx < 0 ? 
        Math.max(0, array.elements.length + endIdx) : endIdx;
      
      const slicedElements = array.elements.slice(normalizedStart, normalizedEnd);
      const newArray = createCVMArray(slicedElements);
      const newArrayRef = state.heap.allocate('array', newArray);
      
      state.stack.push(newArrayRef);
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
        return { 
          type: 'RuntimeError', 
          message: 'ARRAY_JOIN requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      const array = heapObj!.data as CVMArray;
      const sep = isCVMString(separator) ? separator : String(separator);
      
      // Convert all elements to strings
      const stringElements = array.elements.map(el => {
        if (el === null) return 'null';
        if (el === undefined) return 'undefined';
        return String(el);
      });
      
      const result = stringElements.join(sep);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.ARRAY_INDEX_OF]: {
    stackIn: 2,  // array, searchElement
    stackOut: 1, // number (index or -1)
    execute: (state, instruction) => {
      const searchElement = state.stack.pop()!;
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
        return { 
          type: 'RuntimeError', 
          message: 'ARRAY_INDEX_OF requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const heapObj = state.heap.get((arrayRef as any).id);
      const array = heapObj!.data as CVMArray;
      
      // Find index using strict equality
      for (let i = 0; i < array.elements.length; i++) {
        if (array.elements[i] === searchElement) {
          state.stack.push(i);
          return undefined;
        }
      }
      
      state.stack.push(-1); // Not found
      return undefined;
    }
  }
};

// Also export as arraysHandlers for consistency
export const arraysHandlers = arrayHandlers;