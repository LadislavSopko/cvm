import { describe, it, expect } from 'vitest';
import { CompilerState, JumpContext } from './compiler-state.js';
import { OpCode } from './bytecode.js';

describe('CompilerState', () => {
  describe('basic emission', () => {
    it('should emit instructions with incrementing addresses', () => {
      const state = new CompilerState();
      
      state.emit(OpCode.PUSH, 5);
      state.emit(OpCode.PRINT);
      state.emit(OpCode.HALT);
      
      const bytecode = state.getBytecode();
      expect(bytecode).toHaveLength(3);
      expect(bytecode[0]).toEqual({ op: OpCode.PUSH, arg: 5 });
      expect(bytecode[1]).toEqual({ op: OpCode.PRINT });
      expect(bytecode[2]).toEqual({ op: OpCode.HALT });
    });

    it('should track current address correctly', () => {
      const state = new CompilerState();
      
      expect(state.currentAddress()).toBe(0);
      state.emit(OpCode.PUSH, 'hello');
      expect(state.currentAddress()).toBe(1);
      state.emit(OpCode.PRINT);
      expect(state.currentAddress()).toBe(2);
    });

    it('should return instruction index when emitting', () => {
      const state = new CompilerState();
      
      const idx0 = state.emit(OpCode.PUSH, 5);
      const idx1 = state.emit(OpCode.PUSH, 10);
      const idx2 = state.emit(OpCode.ADD);
      
      expect(idx0).toBe(0);
      expect(idx1).toBe(1);
      expect(idx2).toBe(2);
    });
  });

  describe('jump patching', () => {
    it('should patch jump addresses', () => {
      const state = new CompilerState();
      
      state.emit(OpCode.PUSH, false);
      const jumpIdx = state.emit(OpCode.JUMP_IF_FALSE, -1); // Placeholder
      state.emit(OpCode.PUSH, 'not executed');
      const targetAddr = state.currentAddress();
      state.emit(OpCode.PUSH, 'target');
      
      // Patch the jump to point to target
      state.patchJump(jumpIdx, targetAddr);
      
      const bytecode = state.getBytecode();
      expect(bytecode[jumpIdx].arg).toBe(targetAddr);
    });

    it('should handle multiple jump patches', () => {
      const state = new CompilerState();
      
      const jump1 = state.emit(OpCode.JUMP, -1);
      const jump2 = state.emit(OpCode.JUMP, -1);
      state.emit(OpCode.HALT);
      const target = state.currentAddress();
      
      state.patchJump(jump1, target);
      state.patchJump(jump2, target);
      
      const bytecode = state.getBytecode();
      expect(bytecode[jump1].arg).toBe(target);
      expect(bytecode[jump2].arg).toBe(target);
    });
  });

  describe('context stack', () => {
    it('should push and pop contexts', () => {
      const state = new CompilerState();
      
      expect(state.getCurrentContext()).toBeNull();
      
      const context: JumpContext = {
        type: 'if',
        endTargets: []
      };
      
      state.pushContext(context);
      expect(state.getCurrentContext()).toBe(context);
      
      const popped = state.popContext();
      expect(popped).toBe(context);
      expect(state.getCurrentContext()).toBeNull();
    });

    it('should handle nested contexts', () => {
      const state = new CompilerState();
      
      const ifContext: JumpContext = { type: 'if', endTargets: [] };
      const loopContext: JumpContext = { type: 'loop', endTargets: [], breakTargets: [] };
      
      state.pushContext(ifContext);
      state.pushContext(loopContext);
      
      expect(state.getCurrentContext()).toBe(loopContext);
      expect(state.popContext()).toBe(loopContext);
      expect(state.getCurrentContext()).toBe(ifContext);
      expect(state.popContext()).toBe(ifContext);
      expect(state.getCurrentContext()).toBeNull();
    });

    it('should find loop context in nested structures', () => {
      const state = new CompilerState();
      
      const ifContext: JumpContext = { type: 'if', endTargets: [] };
      const loopContext: JumpContext = { type: 'loop', endTargets: [], breakTargets: [] };
      const innerIfContext: JumpContext = { type: 'if', endTargets: [] };
      
      state.pushContext(ifContext);
      state.pushContext(loopContext);
      state.pushContext(innerIfContext);
      
      const found = state.findLoopContext();
      expect(found).toBe(loopContext);
    });

    it('should return null when no loop context exists', () => {
      const state = new CompilerState();
      
      const ifContext: JumpContext = { type: 'if', endTargets: [] };
      state.pushContext(ifContext);
      
      const found = state.findLoopContext();
      expect(found).toBeNull();
    });
  });

  describe('jump context helpers', () => {
    it('should patch all jumps in a list', () => {
      const state = new CompilerState();
      
      const jumps = [
        state.emit(OpCode.JUMP, -1),
        state.emit(OpCode.JUMP, -1),
        state.emit(OpCode.JUMP, -1)
      ];
      
      const target = state.currentAddress();
      state.emit(OpCode.HALT);
      
      state.patchJumps(jumps, target);
      
      const bytecode = state.getBytecode();
      jumps.forEach(jumpIdx => {
        expect(bytecode[jumpIdx].arg).toBe(target);
      });
    });
  });
});