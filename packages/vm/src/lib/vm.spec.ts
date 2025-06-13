import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM', () => {
  it('should execute HALT', () => {
    const vm = new VM();
    const state = vm.execute([{ op: OpCode.HALT }]);
    
    expect(state.status).toBe('complete');
    expect(state.pc).toBe(0);
  });

  it('should execute PUSH and POP', () => {
    const vm = new VM();
    const state = vm.execute([
      { op: OpCode.PUSH, arg: 'hello' },
      { op: OpCode.POP },
      { op: OpCode.HALT }
    ]);
    
    expect(state.status).toBe('complete');
    expect(state.stack).toHaveLength(0);
  });

  it('should execute PRINT', () => {
    const vm = new VM();
    const state = vm.execute([
      { op: OpCode.PUSH, arg: 'Hello World' },
      { op: OpCode.PRINT },
      { op: OpCode.HALT }
    ]);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['Hello World']);
  });

  it('should pause on CC instruction', () => {
    const vm = new VM();
    const state = vm.execute([
      { op: OpCode.PUSH, arg: 'What is 2+2?' },
      { op: OpCode.CC },
      { op: OpCode.HALT }
    ]);
    
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('What is 2+2?');
    expect(state.pc).toBe(1); // Paused at CC
  });

  it('should resume after CC', () => {
    const vm = new VM();
    const bytecode = [
      { op: OpCode.PUSH, arg: 'Question?' },
      { op: OpCode.CC },
      { op: OpCode.PRINT },
      { op: OpCode.HALT }
    ];
    
    // First execution - hits CC
    let state = vm.execute(bytecode);
    
    expect(state.status).toBe('waiting_cc');
    
    // Resume with answer
    state = vm.resume(state, 'Answer', bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['Answer']);
  });
});