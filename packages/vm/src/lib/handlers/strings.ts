import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToString, isCVMString, isCVMArray, cvmTypeof, createCVMArray, createCVMObject, CVMValue } from '@cvm/types';

// Helper function to convert JSON to CVM values
function jsonToCVMValue(value: any): CVMValue {
  if (value === null) return null;
  if (value === undefined) return undefined as any; // CVM uses undefined internally
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  
  // Check if it's already a CVM array
  if (value && typeof value === 'object' && value.type === 'array' && Array.isArray(value.elements)) {
    return value; // Already a CVMArray
  }
  
  if (Array.isArray(value)) {
    const arr = createCVMArray();
    arr.elements = value.map(jsonToCVMValue);
    return arr;
  }
  
  // Check if it's already a CVM object
  if (value && typeof value === 'object' && value.type === 'object' && value.properties) {
    return value; // Already a CVMObject
  }
  
  if (typeof value === 'object') {
    const obj = createCVMObject();
    for (const [key, val] of Object.entries(value)) {
      obj.properties[key] = jsonToCVMValue(val);
    }
    return obj;
  }
  
  // Fallback for any other types
  return null;
}

export const stringHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.CONCAT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const b = state.stack.pop()!;
      const a = state.stack.pop()!;
      state.stack.push(cvmToString(a) + cvmToString(b));
      return undefined;
    }
  },

  [OpCode.STRING_LEN]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_LEN requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(str.length);
      return undefined;
    }
  },

  [OpCode.LENGTH]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      
      if (isCVMString(value)) {
        state.stack.push(value.length);
      } else if (isCVMArray(value)) {
        state.stack.push(value.elements.length);
      } else {
        return {
          type: 'RuntimeError',
          message: 'LENGTH requires a string or array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      return undefined;
    }
  },

  [OpCode.JSON_PARSE]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'JSON_PARSE requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      try {
        const parsed = JSON.parse(str);
        state.stack.push(jsonToCVMValue(parsed));
      } catch {
        // Return null for invalid JSON
        state.stack.push(null);
      }
      
      return undefined;
    }
  },

  [OpCode.TYPEOF]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      state.stack.push(cvmTypeof(value));
      return undefined;
    }
  }
};