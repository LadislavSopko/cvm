import { OpCode } from '@cvm/parser';
import { OpcodeHandler, VMError } from './types.js';
import { cvmToNumber, cvmToString, isCVMNull, isCVMUndefined, isCVMArrayRef, isCVMObjectRef } from '@cvm/types';
import { safePop, isVMError } from '../stack-utils.js';

// Helper for binary comparison operations
function executeBinaryComparison(state: any, instruction: any, compareFn: (left: any, right: any) => boolean): VMError | undefined {
  const right = safePop(state, instruction.op);
  if (isVMError(right)) return right;
  const left = safePop(state, instruction.op);
  if (isVMError(left)) return left;
  
  const result = compareFn(left, right);
  state.stack.push(result);
  return undefined;
}

export const comparisonHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.EQ]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // JavaScript-like == comparison with type coercion
        // Special case: null == undefined is true
        if ((isCVMNull(left) && isCVMUndefined(right)) || 
            (isCVMUndefined(left) && isCVMNull(right))) {
          return true;
        } else if (isCVMUndefined(left) && isCVMUndefined(right)) {
          return true;
        }
        // Handle references - compare by reference, not value
        else if (isCVMArrayRef(left) || isCVMObjectRef(left)) {
          if (isCVMArrayRef(left) && isCVMArrayRef(right)) {
            return left.id === right.id;
          } else if (isCVMObjectRef(left) && isCVMObjectRef(right)) {
            return left.id === right.id;
          }
          return false;
        } else {
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            return leftNum === rightNum;
          } else {
            // If either can't be converted to number, do string comparison
            return cvmToString(left) === cvmToString(right);
          }
        }
      });
    }
  },

  [OpCode.NEQ]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // JavaScript-like != comparison with type coercion
        // Special case: null != undefined is false
        if ((isCVMNull(left) && isCVMUndefined(right)) || 
            (isCVMUndefined(left) && isCVMNull(right))) {
          return false;
        } else if (isCVMUndefined(left) && isCVMUndefined(right)) {
          return false;
        }
        // Handle references - compare by reference, not value
        else if (isCVMArrayRef(left) || isCVMObjectRef(left)) {
          if (isCVMArrayRef(left) && isCVMArrayRef(right)) {
            return left.id !== right.id;
          } else if (isCVMObjectRef(left) && isCVMObjectRef(right)) {
            return left.id !== right.id;
          }
          return true;
        } else {
          const leftNum = cvmToNumber(left);
          const rightNum = cvmToNumber(right);
          if (!isNaN(leftNum) && !isNaN(rightNum)) {
            return leftNum !== rightNum;
          } else {
            // If either can't be converted to number, do string comparison
            return cvmToString(left) !== cvmToString(right);
          }
        }
      });
    }
  },

  [OpCode.LT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Convert to numbers for comparison
        const leftNum = cvmToNumber(left);
        const rightNum = cvmToNumber(right);
        // NaN comparisons always return false
        return leftNum < rightNum;
      });
    }
  },

  [OpCode.GT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Convert to numbers for comparison
        const leftNum = cvmToNumber(left);
        const rightNum = cvmToNumber(right);
        // NaN comparisons always return false
        return leftNum > rightNum;
      });
    }
  },

  [OpCode.LTE]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Convert to numbers for comparison
        const leftNum = cvmToNumber(left);
        const rightNum = cvmToNumber(right);
        return leftNum <= rightNum;
      });
    }
  },

  [OpCode.GTE]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Convert to numbers for comparison
        const leftNum = cvmToNumber(left);
        const rightNum = cvmToNumber(right);
        return leftNum >= rightNum;
      });
    }
  },

  [OpCode.EQ_STRICT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Strict equality - no type coercion
        // For references, compare by ID
        if (isCVMArrayRef(left) && isCVMArrayRef(right)) {
          return left.id === right.id;
        } else if (isCVMObjectRef(left) && isCVMObjectRef(right)) {
          return left.id === right.id;
        }
        return left === right;
      });
    }
  },

  [OpCode.NEQ_STRICT]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state, instruction) => {
      return executeBinaryComparison(state, instruction, (left, right) => {
        // Strict inequality - no type coercion
        // For references, compare by ID
        if (isCVMArrayRef(left) && isCVMArrayRef(right)) {
          return left.id !== right.id;
        } else if (isCVMObjectRef(left) && isCVMObjectRef(right)) {
          return left.id !== right.id;
        }
        return left !== right;
      });
    }
  }
};