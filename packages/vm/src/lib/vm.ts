import { Instruction, OpCode } from '@cvm/parser';

export type VMStatus = 'running' | 'waiting_cc' | 'complete' | 'error';

export interface VMState {
  pc: number;
  stack: any[];
  variables: Map<string, any>;
  status: VMStatus;
  output: string[];
  ccPrompt?: string;
  error?: string;
}

export class VM {
  execute(bytecode: Instruction[], initialState?: Partial<VMState>): VMState {
    const state: VMState = {
      pc: initialState?.pc ?? 0,
      stack: initialState?.stack ?? [],
      variables: initialState?.variables ?? new Map(),
      status: 'running',
      output: initialState?.output ?? [],
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
          state.stack.push(a + b);
          state.pc++;
          break;
          
        case OpCode.PRINT:
          const printValue = state.stack.pop();
          state.output.push(printValue);
          state.pc++;
          break;
          
        case OpCode.CC:
          state.ccPrompt = state.stack.pop();
          state.status = 'waiting_cc';
          break;
          
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