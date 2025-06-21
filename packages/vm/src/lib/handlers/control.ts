import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
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
        return {
          type: 'RuntimeError',
          message: 'JUMP requires a target address',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      const target = instruction.arg;
      if (target < 0) {
        return {
          type: 'RuntimeError',
          message: `Invalid jump target: ${target}`,
          pc: state.pc,
          opcode: instruction.op
        };
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
        return {
          type: 'RuntimeError',
          message: 'JUMP_IF_FALSE requires a target address',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      const target = instruction.arg;
      if (target < 0) {
        return {
          type: 'RuntimeError',
          message: `Invalid jump target: ${target}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Jump if condition is falsy
      if (!cvmToBoolean(condition)) {
        state.pc = target;
      } else {
        state.pc++;
      }
      return undefined;
    }
  }
};