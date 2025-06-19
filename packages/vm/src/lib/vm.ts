import { Instruction, OpCode } from '@cvm/parser';
import { 
  CVMValue, 
  CVMArray,
  isCVMArray, 
  isCVMString, 
  isCVMNumber,
  cvmToString,
  cvmTypeof,
  cvmToNumber,
  cvmToBoolean,
  createCVMArray 
} from '@cvm/types';

export type VMStatus = 'running' | 'waiting_cc' | 'complete' | 'error';

export interface IteratorContext {
  array: CVMArray;
  index: number;
}

export interface VMState {
  pc: number;
  stack: CVMValue[];
  variables: Map<string, CVMValue>;
  status: VMStatus;
  output: string[];
  ccPrompt?: string;
  error?: string;
  iterators: IteratorContext[];
}

export class VM {
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
      
      switch (instruction.op) {
        case OpCode.HALT:
          state.status = 'complete';
          break;
          
        case OpCode.PUSH:
          state.stack.push(instruction.arg);
          state.pc++;
          break;
          
        case OpCode.POP:
          state.stack.pop();
          state.pc++;
          break;
          
        case OpCode.LOAD: {
          const varName = instruction.arg;
          if (!state.variables.has(varName)) {
            state.status = 'error';
            state.error = `LOAD: Variable '${varName}' is not defined`;
            break;
          }
          state.stack.push(state.variables.get(varName)!);
          state.pc++;
          break;
        }
          
        case OpCode.STORE:
          const value = state.stack.pop();
          if (value === undefined) {
            state.status = 'error';
            state.error = 'STORE: Stack underflow';
            break;
          }
          state.variables.set(instruction.arg, value);
          state.pc++;
          break;
          
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
          
        case OpCode.PRINT:
          const printValue = state.stack.pop();
          if (printValue !== undefined) {
            state.output.push(cvmToString(printValue));
          }
          state.pc++;
          break;
          
        case OpCode.CC: {
          const prompt = state.stack.pop();
          if (prompt === undefined) {
            state.status = 'error';
            state.error = 'CC: Stack underflow';
            break;
          }
          state.ccPrompt = cvmToString(prompt);
          state.status = 'waiting_cc';
          break;
        }
          
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
          
        // Arithmetic operations
        case OpCode.ADD: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'ADD: Stack underflow';
            break;
          }
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum + rightNum);
          state.pc++;
          break;
        }
          
        case OpCode.SUB: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'SUB: Stack underflow';
            break;
          }
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum - rightNum);
          state.pc++;
          break;
        }
          
        case OpCode.MUL: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'MUL: Stack underflow';
            break;
          }
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum * rightNum);
          state.pc++;
          break;
        }
          
        case OpCode.DIV: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'DIV: Stack underflow';
            break;
          }
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          if (rightNum === 0) {
            state.status = 'error';
            state.error = 'Division by zero';
            break;
          }
          state.stack.push(leftNum / rightNum);
          state.pc++;
          break;
        }
          
        case OpCode.MOD: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (left === undefined || right === undefined) {
            state.status = 'error';
            state.error = 'MOD: Stack underflow';
            break;
          }
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          state.stack.push(leftNum % rightNum);
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
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            state.stack.push(leftNum === rightNum);
          } else {
            // If either can't be converted to number, do string comparison
            state.stack.push(cvmToString(left) === cvmToString(right));
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
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            state.stack.push(leftNum !== rightNum);
          } else {
            // If either can't be converted to number, do string comparison
            state.stack.push(cvmToString(left) !== cvmToString(right));
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
        case OpCode.JUMP: {
          if (instruction.arg === undefined) {
            state.status = 'error';
            state.error = 'JUMP requires a target address';
            break;
          }
          const target = instruction.arg;
          if (target < 0 || target >= bytecode.length) {
            state.status = 'error';
            state.error = `Invalid jump target: ${target}`;
            break;
          }
          state.pc = target;
          break;
        }

        case OpCode.JUMP_IF_FALSE: {
          const condition = state.stack.pop();
          if (condition === undefined) {
            state.status = 'error';
            state.error = 'JUMP_IF_FALSE: Stack underflow';
            break;
          }
          if (instruction.arg === undefined) {
            state.status = 'error';
            state.error = 'JUMP_IF_FALSE requires a target address';
            break;
          }
          const target = instruction.arg;
          if (target < 0 || target >= bytecode.length) {
            state.status = 'error';
            state.error = `Invalid jump target: ${target}`;
            break;
          }
          
          // Jump if condition is falsy
          if (!cvmToBoolean(condition)) {
            state.pc = target;
          } else {
            state.pc++;
          }
          break;
        }

        case OpCode.ITER_START: {
          if (state.stack.length === 0) {
            state.status = 'error';
            state.error = 'ITER_START: Stack underflow';
            break;
          }
          
          const array = state.stack.pop();
          
          // Check for null or undefined
          if (array === null || array === undefined) {
            state.status = 'error';
            state.error = 'TypeError: Cannot iterate over null or undefined';
            break;
          }
          
          // Check if it's an array
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'TypeError: Cannot iterate over non-array value';
            break;
          }
          
          // Check iterator depth limit
          if (state.iterators.length >= 10) {
            state.status = 'error';
            state.error = 'RuntimeError: Maximum iterator depth exceeded';
            break;
          }
          
          // Create a snapshot of the array
          const snapshot = createCVMArray([...array.elements]);
          
          // Push new iterator context
          state.iterators.push({
            array: snapshot,
            index: 0
          });
          
          state.pc++;
          break;
        }

        case OpCode.ITER_NEXT: {
          // Check if there's an active iterator
          if (state.iterators.length === 0) {
            state.status = 'error';
            state.error = 'ITER_NEXT: No active iterator';
            break;
          }
          
          // Get the current (top) iterator
          const iterator = state.iterators[state.iterators.length - 1];
          
          // Check if we have more elements
          if (iterator.index < iterator.array.elements.length) {
            // Push current element
            state.stack.push(iterator.array.elements[iterator.index]);
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
          
          state.pc++;
          break;
        }

        case OpCode.ITER_END: {
          // Check if there's an active iterator
          if (state.iterators.length === 0) {
            state.status = 'error';
            state.error = 'ITER_END: No active iterator';
            break;
          }
          
          // Remove the current (top) iterator
          state.iterators.pop();
          
          state.pc++;
          break;
        }
        
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
          
        default:
          state.status = 'error';
          state.error = `Unknown opcode: ${instruction.op}`;
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
}