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
  CVMObject,
  CVMArray
} from '@cvm/types';

// Helper function to convert CVM values to plain JS for JSON.stringify
function cvmValueToJs(value: CVMValue): any {
  if (isCVMArray(value)) {
    return value.elements.map(cvmValueToJs);
  }
  if (isCVMObject(value)) {
    const obj: Record<string, any> = {};
    for (const [k, v] of value.properties) {
      obj[k] = cvmValueToJs(v);
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
      state.stack.push(createCVMObject());
      return undefined;
    }
  },

  [OpCode.PROPERTY_SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const key = state.stack.pop()!;
      const obj = state.stack.pop()!;
      
      if (!isCVMObject(obj)) {
        return {
          type: 'RuntimeError',
          message: `Cannot set property '${key}' on ${cvmTypeof(obj)}`,
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
      
      obj.properties.set(key, value);
      state.stack.push(obj); // Return object for chaining
      return undefined;
    }
  },

  [OpCode.PROPERTY_GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const key = state.stack.pop()!;
      const obj = state.stack.pop()!;
      
      if (isCVMNull(obj) || isCVMUndefined(obj)) {
        return {
          type: 'RuntimeError',
          message: `Cannot read property '${key}' of ${cvmTypeof(obj)}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!isCVMObject(obj)) {
        // Non-objects return undefined for any property
        state.stack.push(createCVMUndefined());
        return undefined;
      }
      
      const value = obj.properties.get(cvmToString(key));
      state.stack.push(value ?? createCVMUndefined());
      return undefined;
    }
  },

  [OpCode.JSON_STRINGIFY]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      const jsValue = cvmValueToJs(value);
      state.stack.push(JSON.stringify(jsValue));
      return undefined;
    }
  }
};