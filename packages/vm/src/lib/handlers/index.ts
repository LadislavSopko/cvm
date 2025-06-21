import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { arithmeticHandlers } from './arithmetic.js';
import { stackHandlers } from './stack.js';
import { ioHandlers } from './io.js';
import { controlHandlers } from './control.js';
import { variableHandlers } from './variables.js';
import { iteratorHandlers } from './iterators.js';

// Export the combined handlers
// Using Partial during migration phase
export const handlers: Partial<Record<OpCode, OpcodeHandler>> = {
  ...arithmeticHandlers,
  ...stackHandlers,
  ...ioHandlers,
  ...controlHandlers,
  ...variableHandlers,
  ...iteratorHandlers,
};

// Export types for use in VM
export type { OpcodeHandler, VMError } from './types.js';
export { isVMError } from './types.js';