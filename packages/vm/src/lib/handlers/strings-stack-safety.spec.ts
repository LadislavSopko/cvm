import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { stringHandlers } from './strings.js';

describe('String operations with stack safety', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle CONCAT with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push('hello'); // Only 1 value, needs 2
    
    const handler = stringHandlers[OpCode.CONCAT]!;
    const error = handler.execute(state, { op: OpCode.CONCAT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle CONCAT with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = stringHandlers[OpCode.CONCAT]!;
    const error = handler.execute(state, { op: OpCode.CONCAT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle STRING_LEN with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = stringHandlers[OpCode.STRING_LEN]!;
    const error = handler.execute(state, { op: OpCode.STRING_LEN });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle LENGTH with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = stringHandlers[OpCode.LENGTH]!;
    const error = handler.execute(state, { op: OpCode.LENGTH });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle JSON_PARSE with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = stringHandlers[OpCode.JSON_PARSE]!;
    const error = handler.execute(state, { op: OpCode.JSON_PARSE });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle TYPEOF with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = stringHandlers[OpCode.TYPEOF]!;
    const error = handler.execute(state, { op: OpCode.TYPEOF });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });
});