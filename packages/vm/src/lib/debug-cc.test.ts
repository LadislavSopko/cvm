import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { OpCode } from '@cvm/parser';

describe('VM - CC Instruction Debug', () => {
  it('should handle multiple CC instructions', () => {
    const vm = new VM();
    
    // Simple bytecode with two CC calls
    const bytecode = [
      { op: OpCode.PUSH, arg: 'First prompt' },  // 0
      { op: OpCode.CC },                          // 1
      { op: OpCode.PRINT },                       // 2
      { op: OpCode.PUSH, arg: 'Second prompt' },  // 3
      { op: OpCode.CC },                          // 4
      { op: OpCode.PRINT },                       // 5
      { op: OpCode.HALT }                         // 6
    ];

    // First execution - should stop at first CC
    let state = vm.execute(bytecode);
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('First prompt');
    expect(state.pc).toBe(1); // Should be at CC instruction
    console.log('After first CC - PC:', state.pc);

    // Resume with first response
    state = vm.resume(state, 'Response 1', bytecode);
    expect(state.status).toBe('waiting_cc'); // Should hit second CC
    expect(state.ccPrompt).toBe('Second prompt');
    expect(state.pc).toBe(4); // Should be at second CC instruction
    console.log('After second CC - PC:', state.pc, 'Status:', state.status);

    // Resume with second response
    state = vm.resume(state, 'Response 2', bytecode);
    expect(state.status).toBe('complete');
    expect(state.output).toEqual(['Response 1', 'Response 2']);
  });

  it('should trace execution flow', () => {
    const vm = new VM();
    
    const bytecode = [
      { op: OpCode.PUSH, arg: 'Prompt 1' },  // 0
      { op: OpCode.CC },                      // 1 - First CC stops here
      { op: OpCode.STORE, arg: 'var1' },      // 2 - Resume continues here
      { op: OpCode.LOAD, arg: 'var1' },       // 3
      { op: OpCode.PRINT },                   // 4
      { op: OpCode.PUSH, arg: 'Prompt 2' },   // 5
      { op: OpCode.CC },                      // 6 - Second CC should stop here
      { op: OpCode.PRINT },                   // 7
      { op: OpCode.HALT }                     // 8
    ];

    // Execute until first CC
    let state = vm.execute(bytecode);
    console.log('\n=== First execution ===');
    console.log('Status:', state.status);
    console.log('PC:', state.pc);
    console.log('Stack:', state.stack);
    console.log('CC Prompt:', state.ccPrompt);

    // Resume after first CC
    state = vm.resume(state, 'Answer 1', bytecode);
    console.log('\n=== After first resume ===');
    console.log('Status:', state.status);
    console.log('PC:', state.pc);
    console.log('Stack:', state.stack);
    console.log('Variables:', state.variables);
    console.log('Output:', state.output);
    console.log('CC Prompt:', state.ccPrompt);

    // The test will show us what's happening
    expect(state.status).toBe('waiting_cc');
  });
});