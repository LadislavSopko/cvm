import { describe, it, expect } from 'vitest';
import { VM } from '../vm.js';
import { OpCode } from '@cvm/parser';

describe('Stack manipulation opcodes', () => {
  const vm = new VM();

  it('should duplicate top value with DUP', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.DUP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack).toEqual([42, 42]);
  });
  
  it('should swap top two values with SWAP', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: 1 },
      { op: OpCode.PUSH, arg: 2 },
      { op: OpCode.SWAP },
      { op: OpCode.HALT }
    ];
    const state = vm.execute(bytecode);
    expect(state.stack).toEqual([2, 1]);
  });
});