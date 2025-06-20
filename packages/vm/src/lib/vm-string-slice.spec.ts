import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - STRING_SLICE', () => {
  it('should handle slice with positive start', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.PUSH, arg: 6 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('world');
  });

  it('should handle slice with start and end', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('hello');
  });

  it('should handle negative indices', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.PUSH, arg: -5 },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('worl');
  });

  it('should handle slice with only negative start', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: -2 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('lo');
  });

  it('should return empty string when start >= length', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('');
  });

  it('should error on non-string input', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 123 },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_SLICE requires a string');
  });

  it('should error on non-numeric start', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 'abc' },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_SLICE requires numeric start index');
  });

  it('should error on stack underflow', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.STRING_SLICE },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_SLICE: Stack underflow');
  });
});