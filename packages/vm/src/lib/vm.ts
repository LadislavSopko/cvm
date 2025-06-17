import { Instruction, OpCode } from '@cvm/parser';
import { 
  CVMValue, 
  CVMArray,
  isCVMArray, 
  isCVMString, 
  isCVMNumber,
  isCVMBoolean,
  cvmToString,
  cvmToBoolean,
  cvmTypeof,
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
          
        case OpCode.LOAD:
          state.stack.push(state.variables.get(instruction.arg) ?? '');
          state.pc++;
          break;
          
        case OpCode.STORE:
          const value = state.stack.pop();
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
          
        case OpCode.CC:
          state.ccPrompt = cvmToString(state.stack.pop());
          state.status = 'waiting_cc';
          break;
          
        // Array operations
        case OpCode.ARRAY_NEW:
          state.stack.push(createCVMArray());
          state.pc++;
          break;
          
        case OpCode.ARRAY_PUSH: {
          const value = state.stack.pop();
          const array = state.stack.pop();
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_PUSH requires an array';
            break;
          }
          array.elements.push(value as CVMValue);
          state.stack.push(array);
          state.pc++;
          break;
        }
          
        case OpCode.ARRAY_GET: {
          const index = state.stack.pop();
          const array = state.stack.pop();
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
          
        case OpCode.ARRAY_LEN: {
          const array = state.stack.pop();
          if (!isCVMArray(array)) {
            state.status = 'error';
            state.error = 'ARRAY_LEN requires an array';
            break;
          }
          state.stack.push(array.elements.length);
          state.pc++;
          break;
        }
          
        case OpCode.JSON_PARSE: {
          const str = state.stack.pop();
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
          state.stack.push(cvmTypeof(value));
          state.pc++;
          break;
        }
          
        // Arithmetic operations
        case OpCode.ADD: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (!isCVMNumber(left) || !isCVMNumber(right)) {
            state.status = 'error';
            state.error = 'ADD requires two numbers';
            break;
          }
          state.stack.push(left + right);
          state.pc++;
          break;
        }
          
        case OpCode.SUB: {
          const right = state.stack.pop();
          const left = state.stack.pop();
          if (!isCVMNumber(left) || !isCVMNumber(right)) {
            state.status = 'error';
            state.error = 'SUB requires two numbers';
            break;
          }
          state.stack.push(left - right);
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