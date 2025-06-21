import { describe, it, expect, beforeEach } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';
import { createCVMArray, createCVMObject } from '@cvm/types';

describe('VM - TO_STRING opcode', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should convert string to string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('hello');
  });

  it('should convert number to string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('42');
  });

  it('should convert boolean to string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: true },
      { op: OpCode.TO_STRING },
      { op: OpCode.PUSH, arg: false },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('true');
    expect(state.stack[1]).toBe('false');
  });

  it('should convert null to string', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: null },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('null');
  });

  it('should convert undefined to string', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('undefined');
  });

  it('should convert array to string', () => {
    const array = createCVMArray([1, 2, 3]);
    const bytecode = [
      { op: OpCode.PUSH, arg: array },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('[array:3]');
  });

  it('should convert object to string', () => {
    const obj = createCVMObject({ a: 1, b: 2 });
    const bytecode = [
      { op: OpCode.PUSH, arg: obj },
      { op: OpCode.TO_STRING },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe('[object Object]');
  });
});