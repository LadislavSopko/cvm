import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { createCVMUndefined } from '@cvm/types';

export const variableHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state, instruction) => {
      const varName = instruction.arg;
      if (!state.variables.has(varName)) {
        // Return undefined for uninitialized variables (JavaScript behavior)
        state.stack.push(createCVMUndefined());
      } else {
        state.stack.push(state.variables.get(varName)!);
      }
    }
  },

  [OpCode.STORE]: {
    stackIn: 1,
    stackOut: 0,
    execute: (state, instruction) => {
      const value = state.stack.pop()!; // Safe: VM validates stack before calling
      state.variables.set(instruction.arg, value);
    }
  }
};