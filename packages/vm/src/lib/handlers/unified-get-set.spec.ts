import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Unified GET opcode', () => {
  const vm = new VM();

  it('should handle arrays with GET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle objects with GET', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle strings with GET', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("h");
  });
});

describe('Unified SET opcode', () => {
  const vm = new VM();

  it('should handle arrays with SET', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('should handle objects with SET', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.SET },
      { op: OpCode.PUSH, arg: "key" },
      { op: OpCode.GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
});