// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { runtimeError } from './errors.js';
import { cvmToBoolean } from '@cvm/types';

export const controlHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.HALT]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state) => {
      state.status = 'complete';
    }
  },

  [OpCode.JUMP]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      if (instruction.arg === undefined) {
        return runtimeError(state, instruction, 'JUMP requires a target address');
      }
      const target = instruction.arg;
      if (target < 0) {
        return runtimeError(state, instruction, `Invalid jump target: ${target}`);
      }
      state.pc = target;
      return undefined;
    }
  },

  [OpCode.JUMP_IF_FALSE]: {
    stackIn: 1,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      const condition = state.stack.pop()!;
      
      if (instruction.arg === undefined) {
        return runtimeError(state, instruction, 'JUMP_IF_FALSE requires a target address');
      }
      const target = instruction.arg;
      if (target < 0) {
        return runtimeError(state, instruction, `Invalid jump target: ${target}`);
      }
      
      // Jump if condition is falsy
      if (!cvmToBoolean(condition)) {
        state.pc = target;
      } else {
        state.pc++;
      }
      return undefined;
    }
  },

  [OpCode.JUMP_IF]: {
    stackIn: 1,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      const condition = state.stack.pop()!;
      
      if (instruction.arg === undefined) {
        return runtimeError(state, instruction, 'JUMP_IF requires a target address');
      }
      const target = instruction.arg;
      if (target < 0) {
        return runtimeError(state, instruction, `Invalid jump target: ${target}`);
      }
      
      // Jump if condition is truthy
      if (cvmToBoolean(condition)) {
        state.pc = target;
      } else {
        state.pc++;
      }
      return undefined;
    }
  },

  [OpCode.JUMP_IF_TRUE]: {
    stackIn: 1,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      const condition = state.stack.pop()!;
      
      if (instruction.arg === undefined) {
        return runtimeError(state, instruction, 'JUMP_IF_TRUE requires a target address');
      }
      const target = instruction.arg;
      if (target < 0) {
        return runtimeError(state, instruction, `Invalid jump target: ${target}`);
      }
      
      // Jump if condition is truthy (same as JUMP_IF)
      if (cvmToBoolean(condition)) {
        state.pc = target;
      } else {
        state.pc++;
      }
      return undefined;
    }
  },

  [OpCode.CALL]: {
    stackIn: 1,
    stackOut: 0,
    controlsPC: false,
    execute: (state, instruction) => {
      state.stack.pop();
      return runtimeError(state, instruction, 'Functions not implemented');
    }
  }
};