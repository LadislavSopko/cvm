import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToString, isCVMString, isCVMArray, cvmTypeof, createCVMArray } from '@cvm/types';

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
        if (Array.isArray(parsed)) {
          state.stack.push(createCVMArray(parsed));
        } else {
          state.stack.push(createCVMArray()); // Empty array for non-array JSON
        }
      } catch {
        state.stack.push(createCVMArray()); // Empty array for invalid JSON
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