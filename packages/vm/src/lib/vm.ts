import { Instruction, OpCode } from '@cvm/parser';
import { CVMValue, CVMArray } from '@cvm/types';
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

        // Special validation for JUMP, BREAK, and CONTINUE operations
        if ((instruction.op === OpCode.JUMP || instruction.op === OpCode.JUMP_IF_FALSE || 
             instruction.op === OpCode.BREAK || instruction.op === OpCode.CONTINUE) && 
            instruction.arg !== undefined && instruction.arg >= bytecode.length) {
          state.status = 'error';
          const opName = instruction.op === OpCode.JUMP ? 'jump' : 
                        instruction.op === OpCode.JUMP_IF_FALSE ? 'jump' :
                        instruction.op === OpCode.BREAK ? 'break' : 'continue';
          state.error = `Invalid ${opName} target: ${instruction.arg}`;
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

      // Unknown opcode - all opcodes should now be handled by the handler pattern
      state.status = 'error';
      state.error = `Unknown opcode: ${OpCode[instruction.op]}`;
      break;
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