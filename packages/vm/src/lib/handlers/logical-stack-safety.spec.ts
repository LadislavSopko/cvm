import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { logicalHandlers } from './logical.js';

describe('Logical operations with stack safety', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle AND with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(true); // Only 1 value, needs 2
    
    const handler = logicalHandlers[OpCode.AND]!;
    const error = handler.execute(state, { op: OpCode.AND });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle AND with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = logicalHandlers[OpCode.AND]!;
    const error = handler.execute(state, { op: OpCode.AND });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle OR with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(false); // Only 1 value, needs 2
    
    const handler = logicalHandlers[OpCode.OR]!;
    const error = handler.execute(state, { op: OpCode.OR });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle OR with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = logicalHandlers[OpCode.OR]!;
    const error = handler.execute(state, { op: OpCode.OR });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle NOT with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = logicalHandlers[OpCode.NOT]!;
    const error = handler.execute(state, { op: OpCode.NOT });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });
});