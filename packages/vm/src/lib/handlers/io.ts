import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToString } from '@cvm/types';

export const ioHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.PRINT]: {
    stackIn: 1,
    stackOut: 0,
    execute: (state) => {
      const value = state.stack.pop();
      if (value !== undefined) {
        state.output.push(cvmToString(value));
      }
    }
  },

  [OpCode.CC]: {
    stackIn: 1,
    stackOut: 0,
    controlsPC: true, // CC pauses execution
    execute: (state, instruction) => {
      const prompt = state.stack.pop()!; // Safe: VM validates stack before calling
      state.ccPrompt = cvmToString(prompt);
      state.status = 'waiting_cc';
      // Don't increment PC - it will be incremented when resumed
    }
  }
};