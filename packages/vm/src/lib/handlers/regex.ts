import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';

/**
 * Payload interface for LOAD_REGEX instruction
 */
interface RegexPayload {
  pattern: string;
  flags: string;
}

/**
 * Handler for LOAD_REGEX opcode
 * Creates a JavaScript RegExp object and stores it on the heap
 * 
 * Stack Effect: [] → [regexRef]
 * Heap Effect: Allocates new regex object
 * 
 * Error Cases:
 * - Invalid regex pattern (malformed regex)
 * - Invalid flags (unsupported flag characters)
 */
const loadRegex: OpcodeHandler = {
  stackIn: 0,     // Consumes no stack items
  stackOut: 1,    // Produces one stack item (heap reference)
  
  execute: (state, instruction) => {
    // Extract payload from instruction
    const payload = instruction.arg as RegexPayload;
    
    if (!payload || typeof payload.pattern !== 'string' || typeof payload.flags !== 'string') {
      return {
        type: 'TypeError',
        message: 'LOAD_REGEX instruction requires pattern and flags properties',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Create JavaScript RegExp object
      // This may throw if pattern or flags are invalid
      const regex = new RegExp(payload.pattern, payload.flags);
      
      // Wrap RegExp in a CVM object structure
      // Since heap only supports 'array' and 'object' types, we store as object
      const regexWrapper = {
        type: 'regex' as const,
        data: regex
      };
      
      // Allocate on heap as an object type (heap doesn't support 'regex' type)
      const regexRef = state.heap.allocate('object', regexWrapper as any);
      
      // Push reference to stack
      state.stack.push(regexRef);
      
      // Return undefined to indicate success
      return undefined;
      
    } catch (error) {
      // Handle invalid regex patterns or flags
      // Follow CVM error object format
      return {
        type: 'SyntaxError',
        message: `Invalid regular expression: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};

/**
 * Registry of all regex-related opcode handlers
 * Export this to be included in main handler registry
 */
export const regexHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD_REGEX]: loadRegex,
};