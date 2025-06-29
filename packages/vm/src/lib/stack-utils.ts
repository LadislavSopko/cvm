import { VMState } from './vm.js';
import { CVMValue } from '@cvm/types';
import { VMError, isVMError as isVMErrorBase } from './handlers/types.js';
import { OpCode } from '@cvm/parser';

export function safePop(state: VMState, opcode?: OpCode): CVMValue | VMError {
  if (state.stack.length < 1) {
    return {
      type: 'RuntimeError',
      message: 'Stack underflow',
      pc: state.pc,
      opcode: opcode || OpCode.POP
    };
  }
  return state.stack.pop()!;
}

// Re-export for convenience
export const isVMError = isVMErrorBase;