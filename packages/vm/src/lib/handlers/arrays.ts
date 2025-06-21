import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { createCVMArray, isCVMArray, isCVMNumber, isCVMObject, isCVMString } from '@cvm/types';

export const arrayHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.ARRAY_NEW]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state, instruction) => {
      state.stack.push(createCVMArray());
      return undefined;
    }
  },

  [OpCode.ARRAY_PUSH]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const array = state.stack.pop()!;
      
      if (!isCVMArray(array)) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_PUSH requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      array.elements.push(value);
      state.stack.push(array);
      return undefined;
    }
  },

  [OpCode.ARRAY_GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const indexOrKey = state.stack.pop()!;
      const arrayOrObject = state.stack.pop()!;
      
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
      const arrayOrObject = state.stack.pop()!;
      
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
        state.stack.push(arrayOrObject); // Push array back
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
        state.stack.push(arrayOrObject); // Push object back
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
      const array = state.stack.pop()!;
      
      if (!isCVMArray(array)) {
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