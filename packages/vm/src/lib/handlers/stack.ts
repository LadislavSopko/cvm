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
  },

  [OpCode.DUP]: {
    stackIn: 1,
    stackOut: 2,
    execute: (state, instruction) => {
      const value = state.stack.pop()!; // Safe: VM validates stack before calling
      state.stack.push(value);
      state.stack.push(value);
      return undefined;
    }
  },

  [OpCode.SWAP]: {
    stackIn: 2,
    stackOut: 2,
    execute: (state, instruction) => {
      const b = state.stack.pop()!; // Safe: VM validates stack before calling
      const a = state.stack.pop()!; // Safe: VM validates stack before calling
      state.stack.push(b);
      state.stack.push(a);
      return undefined;
    }
  },

  [OpCode.DUP2]: {
    stackIn: 2,
    stackOut: 4,
    execute: (state, instruction) => {
      const b = state.stack.pop()!; // Safe: VM validates stack before calling
      const a = state.stack.pop()!; // Safe: VM validates stack before calling
      state.stack.push(a);
      state.stack.push(b);
      state.stack.push(a);
      state.stack.push(b);
      return undefined;
    }
  }
};