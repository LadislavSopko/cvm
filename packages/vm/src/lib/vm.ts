import { Instruction, OpCode } from '@cvm/parser';
import { 
  CVMValue, 
  CVMArray,
  isCVMArray, 
  isCVMString, 
  isCVMNumber,
  isCVMNull,
  isCVMUndefined,
  cvmToString,
  cvmTypeof,
  cvmToNumber,
  cvmToBoolean,
  createCVMArray,
} from '@cvm/types';
import { handlers, VMError, OpcodeHandler } from './handlers/index.js';

export type VMStatus = 'running' | 'waiting_cc' | 'waiting_fs' | 'complete' | 'error';

export interface IteratorContext {
  array: CVMArray;
  index: number;
  length: number;  // Store initial length to prevent issues with array mutations
}

export interface VMState {
  pc: number;
  stack: CVMValue[];
  variables: Map<string, CVMValue>;
  status: VMStatus;
  output: string[];
  ccPrompt?: string;
  fsOperation?: {
    type: 'listFiles';
    path: string;
    options?: any;
  };
  error?: string;
  iterators: IteratorContext[];
  returnValue?: CVMValue;
}

export class VM {
  private validateStack(handler: OpcodeHandler, instruction: Instruction, state: VMState): VMError | void {
    if (state.stack.length < handler.stackIn) {
      return {
        type: 'StackUnderflow',
        message: `${OpCode[instruction.op]}: Stack underflow`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }

  execute(bytecode: Instruction[], initialState?: Partial<VMState>): VMState {
    const state: VMState = {
      pc: initialState?.pc ?? 0,
      stack: initialState?.stack ?? [],
      variables: initialState?.variables ?? new Map(),
      status: 'running',
      output: initialState?.output ?? [],
      iterators: initialState?.iterators ?? [],
      ...initialState
    };

    while (state.status === 'running' && state.pc < bytecode.length) {
      const instruction = bytecode[state.pc];
      
      // Try new handler pattern first
      const handler = handlers[instruction.op];
      if (handler) {
        // Validate stack requirements
        const stackError = this.validateStack(handler, instruction, state);
        if (stackError) {
          state.status = 'error';
          // For backward compatibility with tests, only use the message
          state.error = stackError.message;
          break;
        }

        // Special validation for JUMP operations
        if ((instruction.op === OpCode.JUMP || instruction.op === OpCode.JUMP_IF_FALSE) && 
            instruction.arg !== undefined && instruction.arg >= bytecode.length) {
          state.status = 'error';
          state.error = `Invalid jump target: ${instruction.arg}`;
          break;
        }

        // Execute the handler
        const executionError = handler.execute(state, instruction);
        if (executionError) {
          state.status = 'error';
          // For backward compatibility with tests, only use the message
          state.error = executionError.message;
          break;
        }

        // Advance PC if handler doesn't control it
        if (!handler.controlsPC) {
          state.pc++;
        }
        continue;
      }

      // Fallback to legacy switch for non-migrated opcodes
      switch (instruction.op) {
        // HALT, PUSH, PUSH_UNDEFINED, and POP are now handled by handlers
          
        // LOAD and STORE are now handled by handlers
          
        case OpCode.CONCAT:
          const b = state.stack.pop();
          const a = state.stack.pop();
          if (a === undefined || b === undefined) {
            state.status = 'error';
            state.error = 'CONCAT: Stack underflow';
            break;
          }
          state.stack.push(cvmToString(a) + cvmToString(b));
          state.pc++;
          break;
          
        // PRINT and CC are now handled by handlers
          
        // Array operations
        case OpCode.ARRAY_NEW:
          state.stack.push(createCVMArray());
          state.pc++;
          break;
          
        case OpCode.ARRAY_PUSH: {
          const value = state.stack.pop();
          const array = state.stack.pop();
          if (value === undefined || array === undefined) {
            state.status = 'error';
            state.error = 'ARRAY_PUSH: Stack underflow';
            break;
          }
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_PUSH requires an array';
            break;
          }
          array.elements.push(value);
          state.stack.push(array);
          state.pc++;
          break;
        }
          
        case OpCode.ARRAY_GET: {
          const index = state.stack.pop();
          const array = state.stack.pop();
          if (index === undefined || array === undefined) {
            state.status = 'error';
            state.error = 'ARRAY_GET: Stack underflow';
            break;
          }
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_GET requires an array';
            break;
          }
          if (!isCVMNumber(index)) {
            state.status = 'error';
            state.error = 'ARRAY_GET requires numeric index';
            break;
          }
          const element = array.elements[index] ?? null;
          state.stack.push(element);
          state.pc++;
          break;
        }
          
        case OpCode.ARRAY_SET: {
          const value = state.stack.pop();
          const index = state.stack.pop();
          const array = state.stack.pop();
          if (value === undefined || index === undefined || array === undefined) {
            state.status = 'error';
            state.error = 'ARRAY_SET: Stack underflow';
            break;
          }
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_SET requires an array';
            break;
          }
          if (!isCVMNumber(index)) {
            state.status = 'error';
            state.error = 'ARRAY_SET requires numeric index';
            break;
          }
          const idx = Math.floor(index);
          if (idx < 0) {
            state.status = 'error';
            state.error = 'ARRAY_SET: Negative index not allowed';
            break;
          }
          array.elements[idx] = value;
          state.pc++;
          break;
        }
          
        case OpCode.ARRAY_LEN: {
          const array = state.stack.pop();
          if (array === undefined) {
            state.status = 'error';
            state.error = 'ARRAY_LEN: Stack underflow';
            break;
          }
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_LEN requires an array';
            break;
          }
          state.stack.push(array.elements.length);
          state.pc++;
          break;
        }
        
        case OpCode.STRING_LEN: {
          const str = state.stack.pop();
          if (str === undefined) {
            state.status = 'error';
            state.error = 'STRING_LEN: Stack underflow';
            break;
          }
          if (!isCVMString(str)) {
            state.status = 'error';
            state.error = 'STRING_LEN requires a string';
            break;
          }
          state.stack.push(str.length);
          state.pc++;
          break;
        }
        
        case OpCode.LENGTH: {
          const value = state.stack.pop();
          if (value === undefined) {
            state.status = 'error';
            state.error = 'LENGTH: Stack underflow';
            break;
          }
          
          if (isCVMString(value)) {
            state.stack.push(value.length);
          } else if (isCVMArray(value)) {
            state.stack.push(value.elements.length);
          } else {
            state.status = 'error';
            state.error = 'LENGTH requires a string or array';
            break;
          }
          
          state.pc++;
          break;
        }
          
        case OpCode.JSON_PARSE: {
          const str = state.stack.pop();
          if (str === undefined) {
            state.status = 'error';
            state.error = 'JSON_PARSE: Stack underflow';
            break;
          }
          if (!isCVMString(str)) {
            state.status = 'error';
            state.error = 'JSON_PARSE requires a string';
            break;
          }
          try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
              state.stack.push(createCVMArray(parsed));
            } else {
              state.stack.push(createCVMArray()); // Empty array for non-array JSON
            }
          } catch {
            state.stack.push(createCVMArray()); // Empty array for invalid JSON
          }
          state.pc++;
          break;
        }
          
        case OpCode.TYPEOF: {
          const value = state.stack.pop();
          if (value === undefined) {
            state.status = 'error';
            state.error = 'TYPEOF: Stack underflow';
            break;
          }
          state.stack.push(cvmTypeof(value));
          state.pc++;
          break;
        }
          
        // Arithmetic operations are now handled by handlers

        case OpCode.INC: {
          // Increment expects: [variable_name] on stack
          const varName = state.stack.pop();
          if (varName === undefined || typeof varName !== 'string') {
            state.status = 'error';
            state.error = 'INC: Invalid variable name';
            break;
          }
          const currentValue = state.variables.get(varName) ?? 0;
          const newValue = cvmToNumber(currentValue) + 1;
          state.variables.set(varName, newValue);
          // For post-increment, we push the old value
          // For pre-increment, we push the new value
          // The compiler will indicate which via the instruction arg
          const isPost = instruction.arg === true;
          state.stack.push(isPost ? cvmToNumber(currentValue) : newValue);
          state.pc++;
          break;
        }

        case OpCode.DEC: {
          // Decrement expects: [variable_name] on stack
          const varName = state.stack.pop();
          if (varName === undefined || typeof varName !== 'string') {
            state.status = 'error';
            state.error = 'DEC: Invalid variable name';
            break;
          }
          const currentValue = state.variables.get(varName) ?? 0;
          const newValue = cvmToNumber(currentValue) - 1;
          state.variables.set(varName, newValue);
          // For post-decrement, we push the old value
          // For pre-decrement, we push the new value
          // The compiler will indicate which via the instruction arg
          const isPost = instruction.arg === true;
          state.stack.push(isPost ? cvmToNumber(currentValue) : newValue);
          state.pc++;
          break;
        }

        // Comparison operations
        case OpCode.EQ: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'EQ: Stack underflow';
            break;
          }
          
          // JavaScript-like == comparison with type coercion
          // Special case: null == undefined is true
          if ((isCVMNull(left) && isCVMUndefined(right)) || 
              (isCVMUndefined(left) && isCVMNull(right))) {
            state.stack.push(true);
          } else if (isCVMUndefined(left) && isCVMUndefined(right)) {
            state.stack.push(true);
          } else {
            const leftNum = cvmToNumber(left);
            const rightNum = cvmToNumber(right);
            if (!isNaN(leftNum) && !isNaN(rightNum)) {
              state.stack.push(leftNum === rightNum);
            } else {
              // If either can't be converted to number, do string comparison
              state.stack.push(cvmToString(left) === cvmToString(right));
            }
          }
          state.pc++;
          break;
        }

        case OpCode.NEQ: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'NEQ: Stack underflow';
            break;
          }
          
          // JavaScript-like != comparison with type coercion
          // Special case: null != undefined is false
          if ((isCVMNull(left) && isCVMUndefined(right)) || 
              (isCVMUndefined(left) && isCVMNull(right))) {
            state.stack.push(false);
          } else if (isCVMUndefined(left) && isCVMUndefined(right)) {
            state.stack.push(false);
          } else {
            const leftNum = cvmToNumber(left);
            const rightNum = cvmToNumber(right);
            if (!isNaN(leftNum) && !isNaN(rightNum)) {
              state.stack.push(leftNum !== rightNum);
            } else {
              // If either can't be converted to number, do string comparison
              state.stack.push(cvmToString(left) !== cvmToString(right));
            }
          }
          state.pc++;
          break;
        }

        case OpCode.LT: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'LT: Stack underflow';
            break;
          }
          // Convert to numbers for comparison
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          // NaN comparisons always return false
          state.stack.push(leftNum < rightNum);
          state.pc++;
          break;
        }

        case OpCode.GT: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'GT: Stack underflow';
            break;
          }
          // Convert to numbers for comparison
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          // NaN comparisons always return false
          state.stack.push(leftNum > rightNum);
          state.pc++;
          break;
        }
        
        case OpCode.LTE: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'LTE: Stack underflow';
            break;
          }
          // Convert to numbers for comparison
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum <= rightNum);
          state.pc++;
          break;
        }
        
        case OpCode.GTE: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'GTE: Stack underflow';
            break;
          }
          // Convert to numbers for comparison
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum >= rightNum);
          state.pc++;
          break;
        }
        
        case OpCode.EQ_STRICT: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'EQ_STRICT: Stack underflow';
            break;
          }
          // Strict equality - no type coercion
          state.stack.push(left === right);
          state.pc++;
          break;
        }
        
        case OpCode.NEQ_STRICT: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'NEQ_STRICT: Stack underflow';
            break;
          }
          // Strict inequality - no type coercion
          state.stack.push(left !== right);
          state.pc++;
          break;
        }

        // Jump operations
        // JUMP and JUMP_IF_FALSE are now handled by handlers

        // Iterator operations are now handled by handlers
        
        // Logical operators
        case OpCode.AND: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'AND: Stack underflow';
            break;
          }
          // JavaScript-like && behavior: returns first falsy or last value
          if (!cvmToBoolean(left)) {
            state.stack.push(left);
          } else {
            state.stack.push(right);
          }
          state.pc++;
          break;
        }
        
        case OpCode.OR: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'OR: Stack underflow';
            break;
          }
          // JavaScript-like || behavior: returns first truthy or last value
          if (cvmToBoolean(left)) {
            state.stack.push(left);
          } else {
            state.stack.push(right);
          }
          state.pc++;
          break;
        }
        
        case OpCode.NOT: {
          const value = state.stack.pop();
          if (value === undefined) {
            state.status = 'error';
            state.error = 'NOT: Stack underflow';
            break;
          }
          // Logical NOT: convert to boolean and negate
          state.stack.push(!cvmToBoolean(value));
          state.pc++;
          break;
        }
        
        case OpCode.RETURN: {
          // Pop return value from stack (or use null if empty)
          const returnValue = state.stack.pop() ?? null;
          state.returnValue = returnValue;
          state.status = 'complete';
          break;
        }

        // String methods
        case OpCode.STRING_SUBSTRING: {
          // The compiler pushes: string, start, [end]
          // So we pop in reverse order: [end], start, string
          
          if (state.stack.length < 2) {
            state.status = 'error';
            state.error = 'STRING_SUBSTRING: Stack underflow';
            break;
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
            state.status = 'error';
            state.error = 'STRING_SUBSTRING requires a string';
            break;
          }
          
          if (typeof start !== 'number') {
            state.status = 'error';
            state.error = 'STRING_SUBSTRING requires numeric start index';
            break;
          }
          
          // Handle negative indices
          const len = str.length;
          if (start < 0) start = Math.max(0, len + start);
          if (end !== undefined && end < 0) end = Math.max(0, len + end);
          
          // JavaScript substring behavior
          const result = end !== undefined ? str.substring(start, end) : str.substring(start);
          state.stack.push(result);
          state.pc++;
          break;
        }

        case OpCode.STRING_INDEXOF: {
          // Stack: haystack, needle
          const needle = state.stack.pop();
          const haystack = state.stack.pop();
          
          if (needle === undefined || haystack === undefined) {
            state.status = 'error';
            state.error = 'STRING_INDEXOF: Stack underflow';
            break;
          }
          
          if (!isCVMString(haystack) || !isCVMString(needle)) {
            state.status = 'error';
            state.error = 'STRING_INDEXOF requires string arguments';
            break;
          }
          
          state.stack.push(haystack.indexOf(needle));
          state.pc++;
          break;
        }

        case OpCode.STRING_SPLIT: {
          // Stack: string, delimiter
          const delimiter = state.stack.pop();
          const str = state.stack.pop();
          
          if (delimiter === undefined || str === undefined) {
            state.status = 'error';
            state.error = 'STRING_SPLIT: Stack underflow';
            break;
          }
          
          if (!isCVMString(str) || !isCVMString(delimiter)) {
            state.status = 'error';
            state.error = 'STRING_SPLIT requires string arguments';
            break;
          }
          
          // Handle empty delimiter - split into characters
          let parts: string[];
          if (delimiter === '') {
            parts = str.split('');
          } else {
            parts = str.split(delimiter);
          }
          
          state.stack.push(createCVMArray(parts));
          state.pc++;
          break;
        }

        case OpCode.STRING_SLICE: {
          // The compiler pushes: string, start, [end]
          // So we pop in reverse order: [end], start, string
          
          if (state.stack.length < 2) {
            state.status = 'error';
            state.error = 'STRING_SLICE: Stack underflow';
            break;
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
            state.status = 'error';
            state.error = 'STRING_SLICE requires a string';
            break;
          }
          
          if (typeof start !== 'number') {
            state.status = 'error';
            state.error = 'STRING_SLICE requires numeric start index';
            break;
          }
          
          // JavaScript slice behavior - handles negative indices
          const result = end !== undefined ? str.slice(start, end) : str.slice(start);
          state.stack.push(result);
          state.pc++;
          break;
        }

        case OpCode.STRING_CHARAT: {
          // Stack: string, index
          const index = state.stack.pop();
          const str = state.stack.pop();
          
          if (index === undefined || str === undefined) {
            state.status = 'error';
            state.error = 'STRING_CHARAT: Stack underflow';
            break;
          }
          
          if (!isCVMString(str)) {
            state.status = 'error';
            state.error = 'STRING_CHARAT requires a string';
            break;
          }
          
          if (typeof index !== 'number') {
            state.status = 'error';
            state.error = 'STRING_CHARAT requires numeric index';
            break;
          }
          
          // JavaScript charAt behavior - returns empty string if out of bounds
          const result = str.charAt(index);
          state.stack.push(result);
          state.pc++;
          break;
        }

        case OpCode.STRING_TOUPPERCASE: {
          // Stack: string
          const str = state.stack.pop();
          
          if (str === undefined) {
            state.status = 'error';
            state.error = 'STRING_TOUPPERCASE: Stack underflow';
            break;
          }
          
          if (!isCVMString(str)) {
            state.status = 'error';
            state.error = 'STRING_TOUPPERCASE requires a string';
            break;
          }
          
          state.stack.push(str.toUpperCase());
          state.pc++;
          break;
        }

        case OpCode.STRING_TOLOWERCASE: {
          // Stack: string
          const str = state.stack.pop();
          
          if (str === undefined) {
            state.status = 'error';
            state.error = 'STRING_TOLOWERCASE: Stack underflow';
            break;
          }
          
          if (!isCVMString(str)) {
            state.status = 'error';
            state.error = 'STRING_TOLOWERCASE requires a string';
            break;
          }
          
          state.stack.push(str.toLowerCase());
          state.pc++;
          break;
        }

        case OpCode.BREAK: {
          // BREAK instruction expects a target address as argument
          if (instruction.arg === undefined) {
            state.status = 'error';
            state.error = 'BREAK requires a target address';
            break;
          }
          const target = instruction.arg;
          if (target < 0 || target >= bytecode.length) {
            state.status = 'error';
            state.error = `Invalid break target: ${target}`;
            break;
          }
          state.pc = target;
          break;
        }

        case OpCode.CONTINUE: {
          // CONTINUE instruction expects a target address as argument
          if (instruction.arg === undefined) {
            state.status = 'error';
            state.error = 'CONTINUE requires a target address';
            break;
          }
          const target = instruction.arg;
          if (target < 0 || target >= bytecode.length) {
            state.status = 'error';
            state.error = `Invalid continue target: ${target}`;
            break;
          }
          state.pc = target;
          break;
        }

        case OpCode.FS_LIST_FILES: {
          // Pop options (if present) and path from stack
          // We need to check if we have 1 or 2 arguments
          if (state.stack.length < 1) {
            state.status = 'error';
            state.error = 'FS_LIST_FILES: Stack underflow';
            break;
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
            state.status = 'error';
            state.error = 'FS_LIST_FILES requires a string path';
            break;
          }

          // Set up file system operation and pause execution
          state.fsOperation = {
            type: 'listFiles',
            path: path,
            options: options
          };
          state.status = 'waiting_fs';
          break;
        }
          
        default:
          state.status = 'error';
          state.error = `Unknown opcode: ${instruction.op} (type: ${typeof instruction.op})`;
      }
    }

    return state;
  }

  resume(state: VMState, ccResult: string, bytecode: Instruction[]): VMState {
    if (state.status !== 'waiting_cc') {
      throw new Error('Cannot resume: VM not waiting for CC');
    }

    // Push CC result and continue
    const newState = {
      ...state,
      stack: [...state.stack, ccResult],
      status: 'running' as VMStatus,
      ccPrompt: undefined,
      pc: state.pc + 1
    };

    // Continue execution from where we left off
    return this.execute(bytecode, newState);
  }

  resumeWithFsResult(state: VMState, result: CVMValue, bytecode: Instruction[]): VMState {
    if (state.status !== 'waiting_fs') {
      throw new Error('Cannot resume: VM not waiting for FS operation');
    }

    // Push FS result and continue
    const newState = {
      ...state,
      stack: [...state.stack, result],
      status: 'running' as VMStatus,
      fsOperation: undefined,
      pc: state.pc + 1
    };

    // Continue execution from where we left off
    return this.execute(bytecode, newState);
  }
}