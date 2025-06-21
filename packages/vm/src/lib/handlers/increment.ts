import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToNumber } from '@cvm/types';

export const incrementHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.INC]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      // Increment expects: [variable_name] on stack
      const varName = state.stack.pop()!;
      
      if (typeof varName !== 'string') {
        return {
          type: 'RuntimeError',
          message: 'INC: Invalid variable name',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const currentValue = state.variables.get(varName) ?? 0;
      const newValue = cvmToNumber(currentValue) + 1;
      state.variables.set(varName, newValue);
      
      // For post-increment, we push the old value
      // For pre-increment, we push the new value
      // The compiler will indicate which via the instruction arg
      const isPost = instruction.arg === true;
      state.stack.push(isPost ? cvmToNumber(currentValue) : newValue);
      return undefined;
    }
  },

  [OpCode.DEC]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      // Decrement expects: [variable_name] on stack
      const varName = state.stack.pop()!;
      
      if (typeof varName !== 'string') {
        return {
          type: 'RuntimeError',
          message: 'DEC: Invalid variable name',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const currentValue = state.variables.get(varName) ?? 0;
      const newValue = cvmToNumber(currentValue) - 1;
      state.variables.set(varName, newValue);
      
      // For post-decrement, we push the old value
      // For pre-decrement, we push the new value
      // The compiler will indicate which via the instruction arg
      const isPost = instruction.arg === true;
      state.stack.push(isPost ? cvmToNumber(currentValue) : newValue);
      return undefined;
    }
  }
};