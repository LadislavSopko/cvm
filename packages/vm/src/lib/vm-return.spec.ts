import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - RETURN opcode', () => {
  it('should return value from stack', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 42 },
      { op: OpCode.RETURN }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(42);
    expect(state.stack).toHaveLength(0); // Stack should be empty after return
  });
  
  it('should return null when stack is empty', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.RETURN }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe(null);
  });
  
  it('should return string value', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: "Hello CVM" },
      { op: OpCode.RETURN }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe("Hello CVM");
  });
  
  it('should return array value', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.ARRAY_NEW },
      { op: OpCode.PUSH, arg: "a" },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.PUSH, arg: "b" },
      { op: OpCode.ARRAY_PUSH },
      { op: OpCode.RETURN }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toEqual({
      type: 'array',
      elements: ['a', 'b']
    });
  });
  
  it('should stop execution after return', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: "result" },
      { op: OpCode.RETURN },
      { op: OpCode.PUSH, arg: "should not execute" },
      { op: OpCode.PRINT }
    ];
    
    const state = vm.execute(bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toBe("result");
    expect(state.output).toHaveLength(0); // PRINT should not execute
  });
});