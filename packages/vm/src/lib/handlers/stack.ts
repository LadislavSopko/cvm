import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { createCVMUndefined } from '@cvm/types';

export const stackHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.PUSH]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state, instruction) => {
      state.stack.push(instruction.arg);
    }
  },

  [OpCode.PUSH_UNDEFINED]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state) => {
      state.stack.push(createCVMUndefined());
    }
  },

  [OpCode.POP]: {
    stackIn: 1,
    stackOut: 0,
    execute: (state) => {
      state.stack.pop();
    }
  }
};