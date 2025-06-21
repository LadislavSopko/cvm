import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToNumber } from '@cvm/types';

export const arithmeticHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.ADD]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!; // Safe: VM validates stack before calling
      const left = state.stack.pop()!;   // Safe: VM validates stack before calling
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum + rightNum);
    }
  },

  [OpCode.SUB]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum - rightNum);
    }
  },

  [OpCode.MUL]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum * rightNum);
    }
  },

  [OpCode.DIV]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
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
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      const leftNum = cvmToNumber(left);
      const rightNum = cvmToNumber(right);
      state.stack.push(leftNum % rightNum);
    }
  },

  [OpCode.UNARY_MINUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      const num = cvmToNumber(value);
      state.stack.push(-num);
    }
  },

  [OpCode.UNARY_PLUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      const num = cvmToNumber(value);
      state.stack.push(num);
    }
  }
};