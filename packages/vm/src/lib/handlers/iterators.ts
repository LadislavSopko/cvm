import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { isCVMArray, createCVMUndefined } from '@cvm/types';

export const iteratorHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.ITER_START]: {
    stackIn: 1,
    stackOut: 0,
    execute: (state, instruction) => {
      const array = state.stack.pop()!;
      
      // Check for null or undefined
      if (array === null || array === undefined) {
        return {
          type: 'TypeError',
          message: 'TypeError: Cannot iterate over null or undefined',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Check if it's an array
      if (!isCVMArray(array)) {
        return {
          type: 'TypeError',
          message: 'TypeError: Cannot iterate over non-array value',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Check iterator depth limit
      if (state.iterators.length >= 10) {
        return {
          type: 'RuntimeError',
          message: 'RuntimeError: Maximum iterator depth exceeded',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Store reference to original array with its current length
      state.iterators.push({
        array: array,
        index: 0,
        length: array.elements.length
      });
      return undefined;
    }
  },

  [OpCode.ITER_NEXT]: {
    stackIn: 0,
    stackOut: 2, // Pushes element and hasMore flag
    execute: (state, instruction) => {
      // Check if there's an active iterator
      if (state.iterators.length === 0) {
        return {
          type: 'RuntimeError',
          message: 'ITER_NEXT: No active iterator',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Get the current (top) iterator
      const iterator = state.iterators[state.iterators.length - 1];
      
      // Check if we have more elements (using stored length)
      if (iterator.index < iterator.length) {
        // Push current element (check bounds in case array was shortened)
        if (iterator.index < iterator.array.elements.length) {
          state.stack.push(iterator.array.elements[iterator.index]);
        } else {
          // Array was shortened during iteration, push undefined
          state.stack.push(createCVMUndefined());
        }
        // Push hasMore flag (true)
        state.stack.push(true);
        // Advance iterator
        iterator.index++;
      } else {
        // No more elements
        state.stack.push(null);
        // Push hasMore flag (false)
        state.stack.push(false);
      }
      return undefined;
    }
  },

  [OpCode.ITER_END]: {
    stackIn: 0,
    stackOut: 0,
    execute: (state, instruction) => {
      // Check if there's an active iterator
      if (state.iterators.length === 0) {
        return {
          type: 'RuntimeError',
          message: 'ITER_END: No active iterator',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Remove the current (top) iterator
      state.iterators.pop();
      return undefined;
    }
  }
};