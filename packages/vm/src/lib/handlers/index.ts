import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { arithmeticHandlers } from './arithmetic.js';
import { stackHandlers } from './stack.js';
import { ioHandlers } from './io.js';
import { controlHandlers } from './control.js';
import { variableHandlers } from './variables.js';
import { iteratorHandlers } from './iterators.js';
import { comparisonHandlers } from './comparison.js';
import { logicalHandlers } from './logical.js';
import { arrayHandlers } from './arrays.js';
import { stringHandlers } from './strings.js';
import { incrementHandlers } from './increment.js';
import { advancedHandlers } from './advanced.js';
import { objectHandlers } from './objects.js';
import { unifiedHandlers } from './unified.js';

// Export the combined handlers
export const handlers: Partial<Record<OpCode, OpcodeHandler>> = {
  ...arithmeticHandlers,
  ...stackHandlers,
  ...ioHandlers,
  ...controlHandlers,
  ...variableHandlers,
  ...iteratorHandlers,
  ...comparisonHandlers,
  ...logicalHandlers,
  ...arrayHandlers,
  ...stringHandlers,
  ...incrementHandlers,
  ...advancedHandlers,
  ...objectHandlers,
  ...unifiedHandlers,
};

// Export types for use in VM
export type { OpcodeHandler, VMError } from './types.js';
export { isVMError } from './types.js';