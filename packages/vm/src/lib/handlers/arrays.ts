import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { createCVMArray, isCVMArray, isCVMNumber } from '@cvm/types';

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
      const index = state.stack.pop()!;
      const array = state.stack.pop()!;
      
      if (!isCVMArray(array)) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_GET requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!isCVMNumber(index)) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_GET requires numeric index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const element = array.elements[index] ?? null;
      state.stack.push(element);
      return undefined;
    }
  },

  [OpCode.ARRAY_SET]: {
    stackIn: 3,
    stackOut: 0,
    execute: (state, instruction) => {
      const value = state.stack.pop()!;
      const index = state.stack.pop()!;
      const array = state.stack.pop()!;
      
      if (!isCVMArray(array)) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET requires an array',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!isCVMNumber(index)) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET requires numeric index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const idx = Math.floor(index);
      if (idx < 0) {
        return {
          type: 'RuntimeError',
          message: 'ARRAY_SET: Negative index not allowed',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      array.elements[idx] = value;
      return undefined;
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