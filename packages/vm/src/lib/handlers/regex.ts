import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { safePop, isVMError } from '../stack-utils.js';
import { isCVMObjectRef, CVMObject } from '@cvm/types';

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
      
      // Create a proper CVM object with regex properties
      // This allows property access like regex.source, regex.global, etc.
      const regexObject = {
        type: 'object' as const,
        properties: {
          source: regex.source,
          flags: regex.flags,
          global: regex.global,
          ignoreCase: regex.ignoreCase,
          multiline: regex.multiline
        }
      };
      
      // Allocate on heap as a CVM object
      const regexRef = state.heap.allocate('object', regexObject);
      
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
 * Handler for REGEX_TEST opcode
 * Executes regex.test(string) operation
 * 
 * Stack Effect: [regexRef, string] → [boolean]
 * Heap Effect: None (reads existing regex object)
 * 
 * Error Cases:
 * - First stack item is not a regex object reference
 * - Second stack item is not a string
 * - Stack underflow (less than 2 items)
 */
const regexTest: OpcodeHandler = {
  stackIn: 2,     // Consumes regex reference and string
  stackOut: 1,    // Produces boolean result
  
  execute: (state, instruction) => {
    // Pop string argument
    const testString = safePop(state, instruction.op);
    if (isVMError(testString)) return testString;
    
    // Pop regex reference
    const regexRef = safePop(state, instruction.op);
    if (isVMError(regexRef)) return regexRef;
    
    // Validate string argument
    if (typeof testString !== 'string') {
      return {
        type: 'TypeError',
        message: `Expected string argument for regex test, got ${typeof testString}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate regex reference
    if (!isCVMObjectRef(regexRef)) {
      return {
        type: 'TypeError',
        message: 'Expected regex object for regex test',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Get regex object from heap
    const regexObj = state.heap.get(regexRef.id);
    if (!regexObj || regexObj.type !== 'object') {
      return {
        type: 'TypeError',
        message: 'Invalid regex object reference',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Recreate JavaScript RegExp from stored properties
      // The LOAD_REGEX handler stores the regex as an object with properties
      const cvmObject = regexObj.data as CVMObject;
      const pattern = cvmObject.properties.source;
      const flags = cvmObject.properties.flags;
      
      if (typeof pattern !== 'string' || typeof flags !== 'string') {
        return {
          type: 'TypeError',
          message: 'Invalid regex object structure',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const regex = new RegExp(pattern, flags);
      const testResult = regex.test(testString);
      
      // Push boolean result to stack
      state.stack.push(testResult);
      
      return undefined; // Success
      
    } catch (error) {
      return {
        type: 'RuntimeError',
        message: `Regex test failed: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};

/**
 * Handler for STRING_MATCH opcode
 * Executes string.match(regex) operation
 * 
 * Stack Effect: [string, regexRef] → [arrayRef | null]
 * Heap Effect: Allocates new array object for matches (or pushes null)
 * 
 * Error Cases:
 * - First stack item is not a string
 * - Second stack item is not a regex object reference
 * - Stack underflow (less than 2 items)
 */
const stringMatch: OpcodeHandler = {
  stackIn: 2,     // Consumes string and regex reference
  stackOut: 1,    // Produces array reference or null
  
  execute: (state, instruction) => {
    // Pop regex reference
    const regexRef = safePop(state, instruction.op);
    if (isVMError(regexRef)) return regexRef;
    
    // Pop string input
    const inputString = safePop(state, instruction.op);
    if (isVMError(inputString)) return inputString;
    
    // Validate string input
    if (typeof inputString !== 'string') {
      return {
        type: 'TypeError',
        message: `Expected string input for match, got ${typeof inputString}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate regex reference
    if (!isCVMObjectRef(regexRef)) {
      return {
        type: 'TypeError',
        message: 'Expected regex object for match',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Get regex object from heap
    const regexObj = state.heap.get(regexRef.id);
    if (!regexObj || regexObj.type !== 'object') {
      return {
        type: 'TypeError',
        message: 'Invalid regex object reference',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Recreate JavaScript RegExp from stored properties
      const cvmObject = regexObj.data as CVMObject;
      const pattern = cvmObject.properties.source;
      const flags = cvmObject.properties.flags;
      
      if (typeof pattern !== 'string' || typeof flags !== 'string') {
        return {
          type: 'TypeError',
          message: 'Invalid regex object structure',
          pc: state.pc,
          opcode: instruction.op
        };
      }
      
      const regex = new RegExp(pattern, flags);
      const matchResult = inputString.match(regex);
      
      if (matchResult === null) {
        // No match found - push null
        state.stack.push(null);
      } else {
        // Create CVM array with match results
        // Convert native array to CVM array format
        const cvmArray = {
          type: 'array' as const,
          elements: [...matchResult] // Copy all match results
        };
        
        // Allocate array on heap
        const arrayRef = state.heap.allocate('array', cvmArray);
        
        // Push array reference to stack
        state.stack.push(arrayRef);
      }
      
      return undefined; // Success
      
    } catch (error) {
      return {
        type: 'RuntimeError',
        message: `String match failed: ${(error as Error).message}`,
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
  [OpCode.REGEX_TEST]: regexTest,
  [OpCode.STRING_MATCH]: stringMatch,
};