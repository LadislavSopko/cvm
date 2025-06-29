import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToNumber } from '@cvm/types';
import { safePop, isVMError } from '../stack-utils.js';

export const arithmeticHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.ADD]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum + rightNum);
      return undefined;
    }
  },

  [OpCode.SUB]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum - rightNum);
      return undefined;
    }
  },

  [OpCode.MUL]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum * rightNum);
      return undefined;
    }
  },

  [OpCode.DIV]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      
      if (rightNum === 0) {
        return {
          type: 'DivisionByZero',
          message: 'Division by zero',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(leftNum / rightNum);
      return undefined;
    }
  },

  [OpCode.MOD]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = safePop(state, instruction.op);
      if (isVMError(right)) return right;
      const left = safePop(state, instruction.op);
      if (isVMError(left)) return left;
      
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum % rightNum);
      return undefined;
    }
  },

  [OpCode.UNARY_MINUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      
      const num = cvmToNumber(value);
      state.stack.push(-num);
      return undefined;
    }
  },

  [OpCode.UNARY_PLUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      
      const num = cvmToNumber(value);
      state.stack.push(num);
      return undefined;
    }
  }
};