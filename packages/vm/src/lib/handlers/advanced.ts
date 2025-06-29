import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { isCVMString, isCVMArray, createCVMArray, CVMValue, cvmToString } from '@cvm/types';

export const advancedHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.RETURN]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      // Pop return value from stack (or use null if empty)
      const returnValue = state.stack.pop() ?? null;
      state.returnValue = returnValue;
      state.status = 'complete';
      return undefined;
    }
  },

  [OpCode.BREAK]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      // BREAK instruction expects a target address as argument
      if (instruction.arg === undefined) {
        return {
          type: 'RuntimeError',
          message: 'BREAK requires a target address',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      const target = instruction.arg;
      if (target < 0) {
        return {
          type: 'RuntimeError',
          message: `Invalid break target: ${target}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      state.pc = target;
      return undefined;
    }
  },

  [OpCode.CONTINUE]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state, instruction) => {
      // CONTINUE instruction expects a target address as argument
      if (instruction.arg === undefined) {
        return {
          type: 'RuntimeError',
          message: 'CONTINUE requires a target address',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      const target = instruction.arg;
      if (target < 0) {
        return {
          type: 'RuntimeError',
          message: `Invalid continue target: ${target}`,
          pc: state.pc,
          opcode: instruction.op
        };
      }
      state.pc = target;
      return undefined;
    }
  },

  [OpCode.FS_LIST_FILES]: {
    stackIn: 1, // Minimum 1 argument (path), optionally 2 (path + options)
    stackOut: 1,
    execute: (state, instruction) => {
      // Pop options (if present) and path from stack
      // We need to check if we have 1 or 2 arguments
      if (state.stack.length < 1) {
        return {
          type: 'StackUnderflow',
          message: 'FS_LIST_FILES: Stack underflow',
          pc: state.pc,
          opcode: instruction.op
        };
      }

      let path: CVMValue;
      let options: any = {};

      // Check if top of stack is an object (options)
      const top = state.stack[state.stack.length - 1];
      if (state.stack.length >= 2 && typeof top === 'object' && top !== null && !isCVMArray(top)) {
        // Two arguments: path and options
        options = state.stack.pop();
        path = state.stack.pop()!;
      } else {
        // One argument: just path
        path = state.stack.pop()!;
      }

      if (!isCVMString(path)) {
        return {
          type: 'RuntimeError',
          message: 'FS_LIST_FILES requires a string path',
          pc: state.pc,
          opcode: instruction.op
        };
      }

      if (!state.fileSystem) {
        return {
          type: 'RuntimeError',
          message: 'FileSystem not available',
          pc: state.pc,
          opcode: instruction.op
        };
      }

      // Execute file system operation synchronously
      const result = state.fileSystem.listFiles(path, options);
      
      // If result is an array, convert to heap reference
      if (isCVMArray(result)) {
        const ref = state.heap.allocate('array', result);
        state.stack.push(ref);
      } else {
        state.stack.push(result);
      }
      return undefined;
    }
  },

  [OpCode.FS_READ_FILE]: {
    stackIn: 1, // path
    stackOut: 1, // Returns string or null
    execute: (state, instruction) => {
      const path = state.stack.pop();
      
      if (!path || !isCVMString(path)) {
        return {
          type: 'RuntimeError',
          message: 'FS_READ_FILE requires a string path',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!state.fileSystem) {
        return {
          type: 'RuntimeError',
          message: 'FileSystem not available',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Execute file system operation synchronously
      const result = state.fileSystem.readFile(path);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.FS_WRITE_FILE]: {
    stackIn: 2, // path, content
    stackOut: 1, // Returns boolean
    execute: (state, instruction) => {
      const content = state.stack.pop();
      const path = state.stack.pop();
      
      if (!path || !isCVMString(path)) {
        return {
          type: 'RuntimeError',
          message: 'FS_WRITE_FILE requires a string path',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (content === undefined) {
        return {
          type: 'RuntimeError',
          message: 'FS_WRITE_FILE requires content argument',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (!state.fileSystem) {
        return {
          type: 'RuntimeError',
          message: 'FileSystem not available',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Convert content to string
      const contentStr = cvmToString(content);
      
      // Execute file system operation synchronously
      const result = state.fileSystem.writeFile(path, contentStr);
      state.stack.push(result);
      return undefined;
    }
  },

  // String method handlers
  [OpCode.STRING_SUBSTRING]: {
    stackIn: 2, // Minimum 2 (string, start), optionally 3 (string, start, end)
    stackOut: 1,
    execute: (state, instruction) => {
      // The compiler pushes: string, start, [end]
      // So we pop in reverse order: [end], start, string
      
      if (state.stack.length < 2) {
        return {
          type: 'StackUnderflow',
          message: 'STRING_SUBSTRING: Stack underflow',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // First check how many arguments we have
      const stackSize = state.stack.length;
      let str: CVMValue;
      let start: number;
      let end: number | undefined;
      
      // Save the current stack to restore if we need to check argument count
      const arg1 = state.stack[stackSize - 1]; // Top of stack
      const arg2 = state.stack[stackSize - 2]; // Second from top
      
      // Check if we have 3 arguments (string, start, end)
      if (stackSize >= 3 && typeof arg1 === 'number' && typeof arg2 === 'number') {
        // Three arguments case
        end = state.stack.pop() as number;
        start = state.stack.pop() as number;
        str = state.stack.pop()!;
      } else {
        // Two arguments case
        start = state.stack.pop() as number;
        str = state.stack.pop()!;
        end = undefined;
      }
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_SUBSTRING requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (typeof start !== 'number') {
        return {
          type: 'RuntimeError',
          message: 'STRING_SUBSTRING requires numeric start index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Handle negative indices
      const len = str.length;
      if (start < 0) start = Math.max(0, len + start);
      if (end !== undefined && end < 0) end = Math.max(0, len + end);
      
      // JavaScript substring behavior
      const result = end !== undefined ? str.substring(start, end) : str.substring(start);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.STRING_INDEXOF]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      // Stack: haystack, needle
      const needle = state.stack.pop()!;
      const haystack = state.stack.pop()!;
      
      if (!isCVMString(haystack) || !isCVMString(needle)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_INDEXOF requires string arguments',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(haystack.indexOf(needle));
      return undefined;
    }
  },

  [OpCode.STRING_SPLIT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      // Stack: string, delimiter
      const delimiter = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str) || !isCVMString(delimiter)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_SPLIT requires string arguments',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // Handle empty delimiter - split into characters
      let parts: string[];
      if (delimiter === '') {
        parts = str.split('');
      } else {
        parts = str.split(delimiter);
      }
      
      const array = createCVMArray(parts);
      const ref = state.heap.allocate('array', array);
      state.stack.push(ref);
      return undefined;
    }
  },

  [OpCode.STRING_SLICE]: {
    stackIn: 2, // Minimum 2 (string, start), optionally 3 (string, start, end)
    stackOut: 1,
    execute: (state, instruction) => {
      // The compiler pushes: string, start, [end]
      // So we pop in reverse order: [end], start, string
      
      if (state.stack.length < 2) {
        return {
          type: 'StackUnderflow',
          message: 'STRING_SLICE: Stack underflow',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // First check how many arguments we have
      const stackSize = state.stack.length;
      let str: CVMValue;
      let start: number;
      let end: number | undefined;
      
      // Save the current stack to restore if we need to check argument count
      const arg1 = state.stack.length >= 1 ? state.stack[stackSize - 1] : undefined; // Top of stack
      const arg2 = state.stack.length >= 2 ? state.stack[stackSize - 2] : undefined; // Second from top
      
      // Check if we have 3 arguments (string, start, end)
      if (stackSize >= 3 && typeof arg1 === 'number' && typeof arg2 === 'number') {
        // Three arguments case
        end = state.stack.pop() as number;
        start = state.stack.pop() as number;
        str = state.stack.pop()!;
      } else {
        // Two arguments case
        start = state.stack.pop() as number;
        str = state.stack.pop()!;
        end = undefined;
      }
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_SLICE requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (typeof start !== 'number') {
        return {
          type: 'RuntimeError',
          message: 'STRING_SLICE requires numeric start index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // JavaScript slice behavior - handles negative indices
      const result = end !== undefined ? str.slice(start, end) : str.slice(start);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.STRING_CHARAT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      // Stack: string, index
      const index = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_CHARAT requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      if (typeof index !== 'number') {
        return {
          type: 'RuntimeError',
          message: 'STRING_CHARAT requires numeric index',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      // JavaScript charAt behavior - returns empty string if out of bounds
      const result = str.charAt(index);
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.STRING_TOUPPERCASE]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      // Stack: string
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_TOUPPERCASE requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(str.toUpperCase());
      return undefined;
    }
  },

  [OpCode.STRING_TOLOWERCASE]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      // Stack: string
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return {
          type: 'RuntimeError',
          message: 'STRING_TOLOWERCASE requires a string',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      state.stack.push(str.toLowerCase());
      return undefined;
    }
  },

  [OpCode.TO_STRING]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const value = state.stack.pop();
      if (value === undefined) {
        return {
          type: 'StackUnderflow',
          message: 'TO_STRING: Stack underflow',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      // Use the existing universal conversion function
      const result = cvmToString(value);
      state.stack.push(result);
      return undefined;
    }
  }
};