import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { 
  createCVMObject, 
  createCVMUndefined, 
  isCVMObject, 
  isCVMString, 
  isCVMNull, 
  isCVMUndefined,
  isCVMArray,
  cvmToString,
  cvmTypeof,
  CVMValue,
  isCVMObjectRef,
  isCVMArrayRef,
  CVMObject,
  CVMArray
} from '@cvm/types';
import { safePop, isVMError } from '../stack-utils.js';

/**
 * Helper function to convert CVM values to plain JavaScript for JSON.stringify
 * Handles heap references by dereferencing them
 * @param value The CVM value to convert
 * @param heap The VM heap for dereferencing
 * @returns Plain JavaScript value
 */
function cvmValueToJs(value: CVMValue, heap: any): any {
  // Handle array references
  if (isCVMArrayRef(value)) {
    const heapObj = heap.get(value.id);
    if (heapObj && heapObj.type === 'array') {
      const array = heapObj.data as CVMArray;
      return array.elements.map(v => cvmValueToJs(v, heap));
    }
    return null;
  }
  
  // Handle object references
  if (isCVMObjectRef(value)) {
    const heapObj = heap.get(value.id);
    if (heapObj && heapObj.type === 'object') {
      const cvmObj = heapObj.data as CVMObject;
      const obj: Record<string, any> = {};
      for (const [k, v] of Object.entries(cvmObj.properties)) {
        obj[k] = cvmValueToJs(v, heap);
      }
      return obj;
    }
    return null;
  }
  
  if (isCVMArray(value)) {
    return value.elements.map(v => cvmValueToJs(v, heap));
  }
  if (isCVMObject(value)) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value.properties)) {
      obj[k] = cvmValueToJs(v, heap);
    }
    return obj;
  }
  if (isCVMUndefined(value)) {
    return undefined;
  }
  return value; // primitives (string, number, boolean, null)
}

export const objectHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.OBJECT_CREATE]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state) => {
      const obj = createCVMObject();
      const ref = state.heap.allocate('object', obj);
      state.stack.push(ref);
      return undefined;
    }
  },

  [OpCode.PROPERTY_SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      const key = safePop(state, instruction.op);
      if (isVMError(key)) return key;
      const objOrRef = safePop(state, instruction.op);
      if (isVMError(objOrRef)) return objOrRef;
      
      let obj: CVMObject;
      
      if (isCVMObjectRef(objOrRef)) {
        const heapObj = state.heap.get(objOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        obj = heapObj.data as CVMObject;
      } else if (isCVMObject(objOrRef)) {
        obj = objOrRef;
      } else {
        return {
          type: 'RuntimeError',
          message: `Cannot set property '${key}' on ${cvmTypeof(objOrRef)}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!isCVMString(key)) {
        return {
          type: 'RuntimeError',
          message: 'Property key must be a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      obj.properties[key] = value;
      state.stack.push(objOrRef); // Push back the original reference or object
      return undefined;
    }
  },

  [OpCode.PROPERTY_GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const key = safePop(state, instruction.op);
      if (isVMError(key)) return key;
      const objOrRef = safePop(state, instruction.op);
      if (isVMError(objOrRef)) return objOrRef;
      
      if (isCVMNull(objOrRef) || isCVMUndefined(objOrRef)) {
        return {
          type: 'RuntimeError',
          message: `Cannot read property '${key}' of ${cvmTypeof(objOrRef)}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      let obj: CVMObject | null = null;
      
      if (isCVMObjectRef(objOrRef)) {
        const heapObj = state.heap.get(objOrRef.id);
        if (!heapObj || heapObj.type !== 'object') {
          return {
            type: 'RuntimeError',
            message: 'Invalid object reference',
            pc: state.pc,
            opcode: instruction.op
          };
        }
        obj = heapObj.data as CVMObject;
      } else if (isCVMObject(objOrRef)) {
        obj = objOrRef;
      } else {
        // Non-objects return undefined for any property
        state.stack.push(createCVMUndefined());
        return undefined;
      }
      
      const value = obj.properties[cvmToString(key)];
      state.stack.push(value ?? createCVMUndefined());
      return undefined;
    }
  },

  [OpCode.JSON_STRINGIFY]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      
      const jsValue = cvmValueToJs(value, state.heap);
      state.stack.push(JSON.stringify(jsValue));
      return undefined;
    }
  }
};