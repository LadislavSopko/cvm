// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { runtimeError } from './errors.js';
import { arrayElements, arrayIndexOf, sliceArray } from './arrays.js';
import { isCVMString, isCVMArray, createCVMArray, CVMValue, cvmToString, isCVMNumber, isCVMObjectRef, CVMObjectRef, CVMObject, isCVMUndefined, isCVMArrayRef } from '@cvm/types';

export const advancedHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.RETURN]: {
    stackIn: 0,
    stackOut: 0,
    controlsPC: true,
    execute: (state) => {
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
        return runtimeError(state, instruction, 'BREAK requires a target address');
      }
      const target = instruction.arg;
      if (target < 0) {
        return runtimeError(state, instruction, `Invalid break target: ${target}`);
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
        return runtimeError(state, instruction, 'CONTINUE requires a target address');
      }
      const target = instruction.arg;
      if (target < 0 || target === -1) {
        return runtimeError(state, instruction, `Invalid continue target: ${target} (not patched properly during compilation)`);
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
      
      // Check for CVMObjectRef (from compiled code)
      if (state.stack.length >= 2 && isCVMObjectRef(top)) {
        const objRef = state.stack.pop()! as CVMObjectRef;
        path = state.stack.pop()!;
        
        // Extract properties from heap object
        const heapObj = state.heap.get(objRef.id);
        if (heapObj && heapObj.type === 'object') {
          const obj = heapObj.data as CVMObject;
          options = {
            recursive: !!obj.properties['recursive'],
            filter: obj.properties['filter'] as string | undefined
          };
        }
      }
      // Check for plain JS object (from test code)
      else if (state.stack.length >= 2 && typeof top === 'object' && top !== null && !isCVMArray(top)) {
        // Two arguments: path and options
        options = state.stack.pop();
        path = state.stack.pop()!;
      } else {
        // One argument: just path
        path = state.stack.pop()!;
      }

      if (!isCVMString(path)) {
        return runtimeError(state, instruction, 'FS_LIST_FILES requires a string path');
      }

      if (!state.fileSystem) {
        return runtimeError(state, instruction, 'FileSystem not available');
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
        return runtimeError(state, instruction, 'FS_READ_FILE requires a string path');
      }
      
      if (!state.fileSystem) {
        return runtimeError(state, instruction, 'FileSystem not available');
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
        return runtimeError(state, instruction, 'FS_WRITE_FILE requires a string path');
      }
      
      if (content === undefined) {
        return runtimeError(state, instruction, 'FS_WRITE_FILE requires content argument');
      }
      
      if (!state.fileSystem) {
        return runtimeError(state, instruction, 'FileSystem not available');
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
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const endVal = state.stack.pop()!;
      let start = state.stack.pop() as number;
      const str = state.stack.pop()!;
      let end = isCVMUndefined(endVal) ? undefined : endVal as number;

      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_SUBSTRING requires a string');
      }
      
      if (typeof start !== 'number') {
        return runtimeError(state, instruction, 'STRING_SUBSTRING requires numeric start index');
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
      const elements = isCVMArrayRef(haystack) ? arrayElements(state, haystack) : undefined;
      if (elements) {
        state.stack.push(arrayIndexOf(elements, needle));
        return undefined;
      }

      if (!isCVMString(haystack) || !isCVMString(needle)) {
        return runtimeError(state, instruction, 'STRING_INDEXOF requires string arguments');
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
        return runtimeError(state, instruction, 'STRING_SPLIT requires string arguments');
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
    stackIn: 3, // target, start, end (end = undefined when absent)
    stackOut: 1,
    execute: (state, instruction) => {
      if (state.stack.length < 3) {
        return {
          type: 'StackUnderflow',
          message: 'STRING_SLICE: Stack underflow',
          pc: state.pc,
          opcode: instruction.op
        };
      }

      const endVal = state.stack.pop()!;
      const startVal = state.stack.pop()!;
      const target = state.stack.pop()!;

      if (typeof startVal !== 'number') {
        return runtimeError(state, instruction, 'slice requires a numeric start index');
      }
      const end = (endVal === undefined || isCVMUndefined(endVal)) ? undefined : (endVal as number);

      if (isCVMString(target)) {
        state.stack.push(end === undefined ? target.slice(startVal) : target.slice(startVal, end));
        return undefined;
      }

      if (isCVMArrayRef(target) && arrayElements(state, target)) {
        state.stack.push(sliceArray(state, target, startVal, end));
        return undefined;
      }

      return runtimeError(state, instruction, 'slice requires a string or an array');
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
        return runtimeError(state, instruction, 'STRING_CHARAT requires a string');
      }
      
      if (typeof index !== 'number') {
        return runtimeError(state, instruction, 'STRING_CHARAT requires numeric index');
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
        return runtimeError(state, instruction, 'STRING_TOUPPERCASE requires a string');
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
        return runtimeError(state, instruction, 'STRING_TOLOWERCASE requires a string');
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
      const elements = isCVMArrayRef(value) ? arrayElements(state, value) : undefined;
      state.stack.push(elements ? elements.map(cvmToString).join(',') : cvmToString(value));
      return undefined;
    }
  },

  [OpCode.STRING_INCLUDES]: {
    stackIn: 2,  // string, searchString
    stackOut: 1, // boolean
    execute: (state, instruction) => {
      const searchString = state.stack.pop()!;
      const str = state.stack.pop()!;
      const elements = isCVMArrayRef(str) ? arrayElements(state, str) : undefined;
      if (elements) {
        state.stack.push(arrayIndexOf(elements, searchString) >= 0);
        return undefined;
      }

      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_INCLUDES requires a string');
      }
      
      const search = String(searchString);
      state.stack.push(str.includes(search));
      return undefined;
    }
  },

  [OpCode.STRING_ENDS_WITH]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const searchString = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_ENDS_WITH requires a string');
      }
      
      const search = String(searchString);
      state.stack.push(str.endsWith(search));
      return undefined;
    }
  },

  [OpCode.STRING_STARTS_WITH]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const searchString = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_STARTS_WITH requires a string');
      }
      
      const search = String(searchString);
      state.stack.push(str.startsWith(search));
      return undefined;
    }
  },

  [OpCode.STRING_TRIM]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_TRIM requires a string');
      }
      
      state.stack.push(str.trim());
      return undefined;
    }
  },

  [OpCode.STRING_TRIM_START]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_TRIM_START requires a string');
      }
      
      state.stack.push(str.trimStart());
      return undefined;
    }
  },

  [OpCode.STRING_TRIM_END]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state, instruction) => {
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_TRIM_END requires a string');
      }
      
      state.stack.push(str.trimEnd());
      return undefined;
    }
  },

  [OpCode.STRING_REPLACE_ALL]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const replacement = state.stack.pop()!;
      const search = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_REPLACE_ALL requires a string');
      }
      
      const searchStr = String(search);
      const replaceStr = String(replacement);
      
      // Replace ALL occurrences using split/join
      const result = str.split(searchStr).join(replaceStr);
      
      state.stack.push(result);
      return undefined;
    }
  },

  [OpCode.STRING_LAST_INDEX_OF]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const searchString = state.stack.pop()!;
      const str = state.stack.pop()!;
      const elements = isCVMArrayRef(str) ? arrayElements(state, str) : undefined;
      if (elements) {
        state.stack.push(arrayIndexOf(elements, searchString, true));
        return undefined;
      }

      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_LAST_INDEX_OF requires a string');
      }
      
      const search = String(searchString);
      state.stack.push(str.lastIndexOf(search));
      return undefined;
    }
  },

  [OpCode.STRING_REPEAT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      const count = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_REPEAT requires a string');
      }
      
      if (!isCVMNumber(count) || count < 0) {
        return runtimeError(state, instruction, 'STRING_REPEAT requires non-negative number');
      }
      
      state.stack.push(str.repeat(Math.floor(count)));
      return undefined;
    }
  },

  [OpCode.STRING_PAD_START]: {
    stackIn: 3,  // string, targetLength, padString
    stackOut: 1,
    execute: (state, instruction) => {
      const padString = state.stack.pop()!;
      const targetLength = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_PAD_START requires a string');
      }
      
      if (!isCVMNumber(targetLength)) {
        return runtimeError(state, instruction, 'STRING_PAD_START requires number for length');
      }
      
      const pad = isCVMString(padString) ? padString : String(padString);
      state.stack.push(str.padStart(targetLength, pad || ' '));
      return undefined;
    }
  },

  [OpCode.STRING_PAD_END]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state, instruction) => {
      const padString = state.stack.pop()!;
      const targetLength = state.stack.pop()!;
      const str = state.stack.pop()!;
      
      if (!isCVMString(str)) {
        return runtimeError(state, instruction, 'STRING_PAD_END requires a string');
      }
      
      if (!isCVMNumber(targetLength)) {
        return runtimeError(state, instruction, 'STRING_PAD_END requires number for length');
      }
      
      const pad = isCVMString(padString) ? padString : String(padString);
      state.stack.push(str.padEnd(targetLength, pad || ' '));
      return undefined;
    }
  }
};