import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';
import { 
  isCVMObjectRef,
  isCVMObject,
  CVMObject
} from '@cvm/types';
import { safePop, isVMError } from '../stack-utils.js';

export const objectIteratorHandlers: Record<string, OpcodeHandler> = {
  [OpCode.OBJECT_ITER_START]: {
    stackIn: 1,
    stackOut: 0,
    execute: (state, instruction) => {
      const value = safePop(state, instruction.op);
      if (isVMError(value)) return value;
      
      if (isCVMObjectRef(value)) {
        const heapObj = state.heap.get(value.id);
        if (heapObj && heapObj.type === 'object') {
          const obj = heapObj.data as CVMObject;
          const keys = Object.keys(obj.properties);
          
          // Add to iterators with keys array
          state.iterators.push({
            array: null,
            keys,
            index: 0,
            length: keys.length
          });
        } else {
          // Push empty iterator for invalid objects
          state.iterators.push({
            array: null,
            keys: [],
            index: 0,
            length: 0
          });
        }
      } else if (isCVMObject(value)) {
        const keys = Object.keys(value.properties);
        state.iterators.push({
          array: null,
          keys,
          index: 0,
          length: keys.length
        });
      } else {
        // Push empty iterator for non-objects
        state.iterators.push({
          array: null,
          keys: [],
          index: 0,
          length: 0
        });
      }
      
      return undefined;
    }
  },
  
  [OpCode.OBJECT_ITER_NEXT]: {
    stackIn: 0,
    stackOut: 2, // Push key and hasNext
    execute: (state, instruction) => {
      const iterator = state.iterators[state.iterators.length - 1];
      
      if (iterator && iterator.index < iterator.length && iterator.keys) {
        const key = iterator.keys[iterator.index];
        state.stack.push(key);
        state.stack.push(true);
        iterator.index++;
      } else {
        state.stack.push(null);
        state.stack.push(false);
      }
      
      return undefined;
    }
  }
};