import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('JavaScript-compliant [] accessor behavior', () => {
  const vm = new VM();

  it('array["0"] should equal array[0]', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.PUSH, arg: "value1" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "0" },  // String index
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value1");
  });
  
  it('array["foo"] should store non-numeric property on array', () => {
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "foo" },
      { op: OpCode.PUSH, arg: "bar" },
      { op: OpCode.ARRAY_SET },
      { op: OpCode.PUSH, arg: "foo" },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("bar");
  });
  
  it('obj[123] should equal obj["123"]', () => {
    const bytecode = [
      { op: OpCode.OBJECT_CREATE },
      { op: OpCode.PUSH, arg: 123 },
      { op: OpCode.PUSH, arg: "value" },
      { op: OpCode.PROPERTY_SET },
      { op: OpCode.PUSH, arg: "123" },
      { op: OpCode.PROPERTY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("value");
  });
  
  it('"hello"[0] should return "h"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: 0 },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("h");
  });
  
  it('"hello"["1"] should return "e"', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "hello" },
      { op: OpCode.PUSH, arg: "1" },
      { op: OpCode.ARRAY_GET },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe("e");
  });
});