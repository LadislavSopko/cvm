import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { comparisonHandlers } from './comparison.js';

describe('Comparison operations with stack safety', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle EQ with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(5); // Only 1 value, needs 2
    
    const handler = comparisonHandlers[OpCode.EQ]!;
    const error = handler.execute(state, { op: OpCode.EQ });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle NEQ with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = comparisonHandlers[OpCode.NEQ]!;
    const error = handler.execute(state, { op: OpCode.NEQ });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle LT with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(10); // Only 1 value, needs 2
    
    const handler = comparisonHandlers[OpCode.LT]!;
    const error = handler.execute(state, { op: OpCode.LT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle GT with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(20); // Only 1 value, needs 2
    
    const handler = comparisonHandlers[OpCode.GT]!;
    const error = handler.execute(state, { op: OpCode.GT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle LTE with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = comparisonHandlers[OpCode.LTE]!;
    const error = handler.execute(state, { op: OpCode.LTE });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle GTE with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(15); // Only 1 value, needs 2
    
    const handler = comparisonHandlers[OpCode.GTE]!;
    const error = handler.execute(state, { op: OpCode.GTE });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle EQ_STRICT with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push('hello'); // Only 1 value, needs 2
    
    const handler = comparisonHandlers[OpCode.EQ_STRICT]!;
    const error = handler.execute(state, { op: OpCode.EQ_STRICT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle NEQ_STRICT with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = comparisonHandlers[OpCode.NEQ_STRICT]!;
    const error = handler.execute(state, { op: OpCode.NEQ_STRICT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });
});