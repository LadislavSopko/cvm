import { Instruction, OpCode } from '@cvm/parser';
import { CVMValue, CVMArray, logger } from '@cvm/types';
import { handlers, VMError, OpcodeHandler } from './handlers/index.js';
import { FileSystemService } from './file-system.js';
import { VMHeap, createVMHeap } from './vm-heap.js';

export type VMStatus = 'running' | 'waiting_cc' | 'complete' | 'error';

export interface IteratorContext {
  array: CVMArray | null;  // null for object iteration
  index: number;
  length: number;
  keys?: string[];  // For object iteration
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
  returnValue?: CVMValue;
  fileSystem?: FileSystemService;
  heap: VMHeap;
}

export class VM {
  private vmLogger = logger.child({ component: 'vm' });

  createInitialState(): VMState {
    return {
      pc: 0,
      stack: [],
      variables: new Map(),
      status: 'running',
      output: [],
      iterators: [],
      heap: createVMHeap()
    };
  }

  executeInstruction(state: VMState, instruction: Instruction): void {
    const handler = handlers[instruction.op];
    if (!handler) {
      throw new Error(`Unknown opcode: ${instruction.op}`);
    }

    const error = this.validateStack(handler, instruction, state);
    if (error) {
      state.status = 'error';
      state.error = error.message;
      return;
    }

    handler.execute(state, instruction);
    state.pc++;
  }

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

  execute(bytecode: Instruction[], initialState?: Partial<VMState>, fileSystem?: FileSystemService): VMState {
    const state: VMState = {
      pc: initialState?.pc ?? 0,
      stack: initialState?.stack ?? [],
      variables: initialState?.variables ?? new Map(),
      status: 'running',
      output: initialState?.output ?? [],
      iterators: initialState?.iterators ?? [],
      fileSystem: fileSystem,
      heap: initialState?.heap ?? createVMHeap(),
      ...initialState
    };

    logger.trace({ bytecodeLength: bytecode.length, initialPC: state.pc }, 'VM execution starting');

    while (state.status === 'running' && state.pc < bytecode.length) {
      const instruction = bytecode[state.pc];
      
      logger.trace({ 
        pc: state.pc, 
        opcode: OpCode[instruction.op], 
        arg: instruction.arg,
        stackSize: state.stack.length,
        variablesCount: state.variables.size
      }, 'Executing instruction');
      
      // Trace instruction execution
      this.vmLogger.trace({ 
        pc: state.pc, 
        opcode: OpCode[instruction.op], 
        opcodeNum: instruction.op,
        arg: instruction.arg,
        stackSize: state.stack.length 
      }, 'Executing instruction');
      
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

        // Special validation for jump operations - CRITICAL for debugging "Invalid jump target: -1"
        if ((instruction.op === OpCode.JUMP || instruction.op === OpCode.JUMP_IF_FALSE || 
             instruction.op === OpCode.JUMP_IF || instruction.op === OpCode.JUMP_IF_TRUE ||
             instruction.op === OpCode.BREAK || instruction.op === OpCode.CONTINUE) && 
            instruction.arg !== undefined) {
          
          // Log all jump attempts for debugging
          this.vmLogger.debug({
            pc: state.pc,
            jumpTarget: instruction.arg,
            instructionCount: bytecode.length,
            opcode: OpCode[instruction.op],
            opcodeNum: instruction.op
          }, 'Jump validation check');
          
          if (instruction.arg < 0 || instruction.arg >= bytecode.length) {
            state.status = 'error';
            const opName = instruction.op === OpCode.JUMP ? 'jump' : 
                          instruction.op === OpCode.JUMP_IF_FALSE ? 'jump' :
                          instruction.op === OpCode.JUMP_IF ? 'jump' :
                          instruction.op === OpCode.JUMP_IF_TRUE ? 'jump' :
                          instruction.op === OpCode.BREAK ? 'break' : 'continue';
            
            // Consistent error format for all jump operations
            state.error = `Invalid ${opName} target: ${instruction.arg}`;
            break;
          }
        }

        // Execute the handler
        const executionError = handler.execute(state, instruction);
        if (executionError) {
          // Check if next instruction is CC() to allow error handling
          const nextPC = state.pc + 1;
          if (nextPC < bytecode.length && bytecode[nextPC].op === OpCode.CC) {
            state.ccPrompt = `ERROR: ${executionError.message}. How should I proceed?`;
            state.status = 'waiting_cc';
            state.pc = nextPC; // Move to CC instruction
            break;
          }
          
          state.status = 'error';
          // For backward compatibility with tests, only use the message
          state.error = executionError.message;
          break;
        }

        // Advance PC if handler doesn't control it
        if (!handler.controlsPC) {
          state.pc++;
        }
        
        logger.trace({ 
          pc: state.pc, 
          opcode: OpCode[instruction.op], 
          stackSize: state.stack.length,
          status: state.status
        }, 'Instruction completed successfully');
        
        continue;
      }

      // This should never happen as all opcodes are implemented
      state.status = 'error';
      state.error = `Unknown opcode: ${OpCode[instruction.op]}`;
      break;
    }

    return state;
  }

  resume(state: VMState, ccResult: string, bytecode: Instruction[], fileSystem?: FileSystemService): VMState {
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
    return this.execute(bytecode, newState, fileSystem || state.fileSystem);
  }

}