import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';
import { objectHandlers } from './objects.js';

describe('Object operations with stack safety', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle PROPERTY_SET with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push({ type: 'object', properties: {} });
    state.stack.push('key'); // Only 2 values, needs 3
    
    const handler = objectHandlers[OpCode.PROPERTY_SET]!;
    const error = handler.execute(state, { op: OpCode.PROPERTY_SET });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle PROPERTY_SET with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 3
    
    const handler = objectHandlers[OpCode.PROPERTY_SET]!;
    const error = handler.execute(state, { op: OpCode.PROPERTY_SET });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle PROPERTY_GET with insufficient stack when called directly', () => {
    const state = vm.createInitialState();
    state.stack.push({ type: 'object', properties: {} }); // Only 1 value, needs 2
    
    const handler = objectHandlers[OpCode.PROPERTY_GET]!;
    const error = handler.execute(state, { op: OpCode.PROPERTY_GET });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle PROPERTY_GET with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 2
    
    const handler = objectHandlers[OpCode.PROPERTY_GET]!;
    const error = handler.execute(state, { op: OpCode.PROPERTY_GET });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });

  it('should handle JSON_STRINGIFY with empty stack when called directly', () => {
    const state = vm.createInitialState();
    // Empty stack, needs 1
    
    const handler = objectHandlers[OpCode.JSON_STRINGIFY]!;
    const error = handler.execute(state, { op: OpCode.JSON_STRINGIFY });
    
    expect(error).toBeDefined();
    expect(error?.type).toBe('RuntimeError');
    expect(error?.message).toContain('Stack underflow');
  });
});