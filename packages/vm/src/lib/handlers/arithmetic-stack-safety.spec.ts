import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { arithmeticHandlers } from './arithmetic.js';

describe('Arithmetic operations with stack safety', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle ADD with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(5); // Only 1 value, needs 2
    
    const handler = arithmeticHandlers[OpCode.ADD]!;
    const error = handler.execute(state, { op: OpCode.ADD });
    
    // Currently this will crash with "Cannot read property of undefined"
    // because state.stack.pop()! on empty stack returns undefined
    // We need to test that it returns an error instead
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle SUB with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(10); // Only 1 value, needs 2
    
    const handler = arithmeticHandlers[OpCode.SUB]!;
    const error = handler.execute(state, { op: OpCode.SUB });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle MUL with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = arithmeticHandlers[OpCode.MUL]!;
    const error = handler.execute(state, { op: OpCode.MUL });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle DIV with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(20); // Only 1 value, needs 2
    
    const handler = arithmeticHandlers[OpCode.DIV]!;
    const error = handler.execute(state, { op: OpCode.DIV });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle MOD with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push(7); // Only 1 value, needs 2
    
    const handler = arithmeticHandlers[OpCode.MOD]!;
    const error = handler.execute(state, { op: OpCode.MOD });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle UNARY_MINUS with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = arithmeticHandlers[OpCode.UNARY_MINUS]!;
    const error = handler.execute(state, { op: OpCode.UNARY_MINUS });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle UNARY_PLUS with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = arithmeticHandlers[OpCode.UNARY_PLUS]!;
    const error = handler.execute(state, { op: OpCode.UNARY_PLUS });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });
});