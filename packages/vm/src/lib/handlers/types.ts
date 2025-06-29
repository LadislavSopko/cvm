import { Instruction, OpCode } from '@cvm/parser';
import { VMState } from '../vm.js';

/**
 * Error types that can occur during VM execution
 */
export interface VMError {
  type: 'StackUnderflow' | 'TypeError' | 'InvalidOpcode' | 'DivisionByZero' | 'OutOfBounds' | 'RuntimeError';
  message: string;
  pc: number;
  opcode: OpCode;
}

/**
 * Handler for a single VM opcode
 */
export interface OpcodeHandler {
  /**
   * Execute the opcode
   * @returns VMError if an error occurred, void otherwise
   */
  execute: (state: VMState, instruction: Instruction) => VMError | void;
  
  /**
   * Number of values this opcode pops from the stack
   */
  stackIn: number;
  
  /**
   * Number of values this opcode pushes to the stack
   */
  stackOut: number;
  
  /**
   * Whether this opcode controls the program counter directly
   * (e.g., JUMP, CALL, RETURN)
   * If false, PC will be automatically incremented after execution
   */
  controlsPC?: boolean;
}

/**
 * Type guard to check if a value is a VMError
 */
export function isVMError(value: any): value is VMError {
  return !!(value && typeof value === 'object' && 'type' in value && 'message' in value);
}