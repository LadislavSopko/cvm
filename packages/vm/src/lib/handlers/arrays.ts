import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { 
  createCVMArray, 
  isCVMArray, 
  isCVMNumber, 
  isCVMObject, 
  isCVMString,
  isCVMArrayRef,
  isCVMObjectRef,
  CVMArray,
  CVMObject
} from '@cvm/types';

/**
 * Opcode handlers for array operations
 * All array operations work with heap references to maintain JavaScript semantics
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
      const indexOrKey = state.stack.pop()!;
      const arrayOrObjectOrRef = state.stack.pop()!;
      
      let arrayOrObject: CVMArray | CVMObject;
      
      // Dereference if needed
      if (isCVMArrayRef(arrayOrObjectOrRef)) {
        const heapObj = state.heap.get(arrayOrObjectOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        arrayOrObject = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrObjectOrRef)) {
        const heapObj = state.heap.get(arrayOrObjectOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        arrayOrObject = heapObj.data as CVMObject;
      } else if (isCVMArray(arrayOrObjectOrRef) || isCVMObject(arrayOrObjectOrRef)) {
        arrayOrObject = arrayOrObjectOrRef;
      } else {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_GET requires an array or object',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Handle arrays
      if (isCVMArray(arrayOrObject)) {
        if (!isCVMNumber(indexOrKey)) {
          return {
            type: 'RuntimeError',
            message: 'ARRAY_GET requires numeric index for arrays',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        
        const element = arrayOrObject.elements[indexOrKey] ?? null;
        state.stack.push(element);
        return undefined;
      }
      
      // Handle objects with string keys
      if (isCVMObject(arrayOrObject)) {
        if (!isCVMString(indexOrKey)) {
          return {
            type: 'RuntimeError',
            message: 'ARRAY_GET requires string key for objects',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        
        const value = arrayOrObject.properties[indexOrKey] ?? null;
        state.stack.push(value);
        return undefined;
      }
      
      return {
        type: 'RuntimeError',
        message: 'ARRAY_GET requires an array or object',
        pc: state.pc,
        opcode: instruction.op
      };
    }
  },

  [OpCode.ARRAY_SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const indexOrKey = state.stack.pop()!;
      const arrayOrObjectOrRef = state.stack.pop()!;
      
      let arrayOrObject: CVMArray | CVMObject;
      
      // Dereference if needed
      if (isCVMArrayRef(arrayOrObjectOrRef)) {
        const heapObj = state.heap.get(arrayOrObjectOrRef.id);
        if (!heapObj || heapObj.type !== 'array') {
          return {
            type: 'RuntimeError',
            message: 'Invalid array reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        arrayOrObject = heapObj.data as CVMArray;
      } else if (isCVMObjectRef(arrayOrObjectOrRef)) {
        const heapObj = state.heap.get(arrayOrObjectOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        arrayOrObject = heapObj.data as CVMObject;
      } else if (isCVMArray(arrayOrObjectOrRef) || isCVMObject(arrayOrObjectOrRef)) {
        arrayOrObject = arrayOrObjectOrRef;
      } else {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET requires an array or object',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Handle arrays
      if (isCVMArray(arrayOrObject)) {
        if (!isCVMNumber(indexOrKey)) {
          return {
            type: 'RuntimeError',
            message: 'ARRAY_SET requires numeric index for arrays',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        
        const idx = Math.floor(indexOrKey);
        if (idx < 0) {
          return {
            type: 'RuntimeError',
            message: 'ARRAY_SET: Negative index not allowed',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        
        arrayOrObject.elements[idx] = value;
        state.stack.push(arrayOrObjectOrRef); // Push back the original reference or array
        return undefined;
      }
      
      // Handle objects with string keys
      if (isCVMObject(arrayOrObject)) {
        if (!isCVMString(indexOrKey)) {
          return {
            type: 'RuntimeError',
            message: 'ARRAY_SET requires string key for objects',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        
        arrayOrObject.properties[indexOrKey] = value;
        state.stack.push(arrayOrObjectOrRef); // Push back the original reference or object
        return undefined;
      }
      
      return {
        type: 'RuntimeError',
        message: 'ARRAY_SET requires an array or object',
        pc: state.pc,
        opcode: instruction.op
      };
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
  }
};