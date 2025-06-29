import { describe, it, expect } from 'vitest';
import { safePop, isVMError } from './stack-utils.js';
import { VMState } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createVMHeap } from './vm-heap.js';

describe('Stack safety utilities', () => {
  it('should return value when stack has elements', () => {
    const state: VMState = { 
      stack: [1, 2, 3], 
      pc: 0, 
      status: 'running',
      variables: new Map(),
      output: [],
      iterators: [],
      heap: createVMHeap()
    };
    const result = safePop(state);
    expect(result).toBe(3);
    expect(state.stack.length).toBe(2);
  });
  
  it('should return error when stack is empty', () => {
    const state: VMState = { 
      stack: [], 
      pc: 5, 
      status: 'running',
      variables: new Map(),
      output: [],
      iterators: [],
      heap: createVMHeap()
    };
    const opcode = OpCode.ADD;
    const result = safePop(state, opcode);
    expect(isVMError(result)).toBe(true);
    expect((result as any).message).toContain('Stack underflow');
    expect((result as any).pc).toBe(5);
    expect((result as any).opcode).toBe(OpCode.ADD);
  });

  it('should identify VMError correctly', () => {
    const error = {
      type: 'RuntimeError',
      message: 'Test error',
      pc: 0,
      opcode: 'ADD' as OpCode
    };
    expect(isVMError(error)).toBe(true);
    expect(isVMError(null)).toBe(false);
    expect(isVMError(undefined)).toBe(false);
    expect(isVMError(42)).toBe(false);
    expect(isVMError({ type: 'NotAnError' })).toBe(false);
  });
});