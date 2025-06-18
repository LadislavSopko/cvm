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

  describe('Jump Operations', () => {
    it('should execute JUMP unconditionally', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'skipped' },
        { op: OpCode.JUMP, arg: 3 }, // Jump to instruction 3
        { op: OpCode.PUSH, arg: 'not executed' },
        { op: OpCode.PUSH, arg: 'jumped here' },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual(['skipped', 'jumped here']);
    });

    it('should execute JUMP_IF_FALSE when condition is false', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: false },
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should jump
        { op: OpCode.PUSH, arg: 'skipped' },
        { op: OpCode.PUSH, arg: 'jumped' },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual(['jumped']);
    });

    it('should not jump on JUMP_IF_FALSE when condition is true', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should not jump
        { op: OpCode.PUSH, arg: 'executed' },
        { op: OpCode.PUSH, arg: 'also executed' },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual(['executed', 'also executed']);
    });

    it('should handle JUMP_IF_FALSE with truthy values', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'hello' }, // Truthy string
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should not jump
        { op: OpCode.PUSH, arg: 'not skipped' },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual(['not skipped']);
    });

    it('should handle JUMP_IF_FALSE with falsy values', () => {
      const vm = new VM();
      
      // Test with 0
      let state = vm.execute([
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should jump
        { op: OpCode.PUSH, arg: 'skipped' },
        { op: OpCode.HALT }
      ]);
      expect(state.stack).toEqual([]);
      
      // Test with empty string
      state = vm.execute([
        { op: OpCode.PUSH, arg: '' },
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should jump
        { op: OpCode.PUSH, arg: 'skipped' },
        { op: OpCode.HALT }
      ]);
      expect(state.stack).toEqual([]);
      
      // Test with null
      state = vm.execute([
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.JUMP_IF_FALSE, arg: 3 }, // Should jump
        { op: OpCode.PUSH, arg: 'skipped' },
        { op: OpCode.HALT }
      ]);
      expect(state.stack).toEqual([]);
    });

    it('should handle backward jumps for loops', () => {
      const vm = new VM();
      let state = vm.execute([
        { op: OpCode.PUSH, arg: 0 }, // Counter
        { op: OpCode.STORE, arg: 'i' },
        // Loop start (PC=2)
        { op: OpCode.LOAD, arg: 'i' },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.LT }, // i < 3
        { op: OpCode.JUMP_IF_FALSE, arg: 13 }, // Exit loop if false
        // Loop body
        { op: OpCode.LOAD, arg: 'i' },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.ADD },
        { op: OpCode.STORE, arg: 'i' },
        { op: OpCode.LOAD, arg: 'i' },
        { op: OpCode.PRINT },
        { op: OpCode.JUMP, arg: 2 }, // Jump back to loop start
        // After loop
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.output).toEqual(['1', '2', '3']);
      expect(state.variables.get('i')).toBe(3);
    });

    it('should error on stack underflow for JUMP_IF_FALSE', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.JUMP_IF_FALSE, arg: 2 },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('error');
      expect(state.error).toContain('Stack underflow');
    });

    it('should error on invalid jump target', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.JUMP, arg: 100 }, // Out of bounds
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('error');
      expect(state.error).toContain('Invalid jump target');
    });

    it('should error on missing jump target', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.JUMP }, // No arg
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('error');
      expect(state.error).toContain('JUMP requires a target address');
    });
  });

  describe('Comparison Operations', () => {
    it('should execute EQ (equality) for equal values', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]);
    });

    it('should execute EQ (equality) for unequal values', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([false]);
    });

    it('should execute EQ with type coercion', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: '5' },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]); // JavaScript-like == semantics
    });

    it('should execute NEQ (not equal)', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.NEQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]);
    });

    it('should execute LT (less than)', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.LT },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]);
    });

    it('should execute LT with string to number conversion', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: '3' },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.LT },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]);
    });

    it('should execute GT (greater than)', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.PUSH, arg: 3 },
        { op: OpCode.GT },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]);
    });

    it('should handle comparison with null', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: null },
        { op: OpCode.PUSH, arg: 0 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]); // null converts to 0
    });

    it('should handle comparison with boolean', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: true },
        { op: OpCode.PUSH, arg: 1 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([true]); // true converts to 1
    });

    it('should error on stack underflow for comparison', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.EQ },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('error');
      expect(state.error).toContain('Stack underflow');
    });

    it('should handle NaN comparisons correctly', () => {
      const vm = new VM();
      const state = vm.execute([
        { op: OpCode.PUSH, arg: 'hello' },
        { op: OpCode.PUSH, arg: 5 },
        { op: OpCode.LT },
        { op: OpCode.HALT }
      ]);
      
      expect(state.status).toBe('complete');
      expect(state.stack).toEqual([false]); // NaN < 5 is false
    });
  });
});