import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - STRING_CHARAT', () => {
  it('should return character at valid index', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('e');
  });

  it('should return first character at index 0', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'world' },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('w');
  });

  it('should return empty string for out of bounds positive index', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('');
  });

  it('should return empty string for negative index', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: -1 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('');
  });

  it('should handle decimal indices by flooring', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 2.7 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('l');
  });

  it('should error on non-string input', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 123 },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_CHARAT requires a string');
  });

  it('should error on non-numeric index', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: 'abc' },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_CHARAT requires numeric index');
  });

  it('should error on stack underflow', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.STRING_CHARAT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_CHARAT: Stack underflow');
  });
});