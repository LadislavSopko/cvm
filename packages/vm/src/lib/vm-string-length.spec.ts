import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - String Length', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should get length of string literal', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(5);
    expect(state.status).toBe('complete');
  });

  it('should get length of empty string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: '' },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(0);
    expect(state.status).toBe('complete');
  });

  it('should get length of string from variable', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.STORE, arg: 'message' },
      { op: OpCode.LOAD, arg: 'message' },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(11);
    expect(state.status).toBe('complete');
  });

  it('should error on non-string value', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_LEN requires a string');
  });

  it('should error on array value', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'a' },
      { op: OpCode.PUSH, arg: 'b' },
      { op: OpCode.PUSH, arg: 'c' },
      { op: OpCode.ARRAY_NEW, arg: 3 },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_LEN requires a string');
  });

  it('should error on stack underflow', () => {
    const bytecode = [
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.status).toBe('error');
    expect(state.error).toBe('STRING_LEN: Stack underflow');
  });

  it('should work with concatenated strings', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.PUSH, arg: ' world' },
      { op: OpCode.CONCAT },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(11);
    expect(state.status).toBe('complete');
  });

  it('should work with string from CC', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'Enter name:' },
      { op: OpCode.CC },
      { op: OpCode.STRING_LEN },
      { op: OpCode.HALT }
    ];

    const state = vm.execute(bytecode, {
      ccPrompt: 'Enter name:',
      status: 'complete' // Simulate CC already answered
    });
    state.stack.push('John'); // Simulate CC response
    
    const finalState = vm.execute(bytecode, {
      ...state,
      pc: 2, // Continue after CC
      status: 'running'
    });
    
    expect(finalState.stack[0]).toBe(4);
    expect(finalState.status).toBe('complete');
  });
});