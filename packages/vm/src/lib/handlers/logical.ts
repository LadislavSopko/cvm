import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToBoolean } from '@cvm/types';
import { safePop, isVMError } from '../stack-utils.js';

export const logicalHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.AND]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      // JavaScript short-circuit evaluation
      // If left is falsy, return left, otherwise return right
      const result = cvmToBoolean(left) ? right : left;
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.OR]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      // JavaScript short-circuit evaluation  
      // If left is truthy, return left, otherwise return right
      const result = cvmToBoolean(left) ? left : right;
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.NOT]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      
      const result = !cvmToBoolean(value);
      state.stack.push(result);
      return undefined;
    }
  }
};