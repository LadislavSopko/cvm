// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { cvmToNumber, cvmToString, isCVMString } from '@cvm/types';

export const arithmeticHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.ADD]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const right = state.stack.pop()!;
      const left = state.stack.pop()!;
      
      // JavaScript + semantics: concatenate if either operand is string
      if (isCVMString(left) || isCVMString(right)) {
        state.stack.push(cvmToString(left) + cvmToString(right));
      } else {
        const leftNum = cvmToNumber(left);
        const rightNum = cvmToNumber(right);
        state.stack.push(leftNum + rightNum);
      }
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
    }
  },

  [OpCode.UNARY_MINUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      
      const num = cvmToNumber(value);
      state.stack.push(-num);
      return undefined;
    }
  },

  [OpCode.UNARY_PLUS]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      
      const num = cvmToNumber(value);
      state.stack.push(num);
      return undefined;
    }
  }
};