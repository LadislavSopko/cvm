import { describe, it, expect } from 'vitest';
import { VM } from './vm.js';
import { compile } from '@cvm/parser';

describe('VM - Multiple CC Execution', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should handle sequential CC calls correctly', () => {
    const source = `
function main() {
  const a = CC("First prompt");
  console.log("Got: " + a);
  const b = CC("Second prompt");
  console.log("Got: " + b);
  console.log("Done: " + a + " and " + b);
}
main();
`;

    const compiled = compile(source);
    expect(compiled.success).toBe(true);

    // Execute until first CC
    console.log('\n=== Initial execution ===');
    let state = vm.execute(compiled.bytecode!);
    console.log('Status:', state.status);
    console.log('PC:', state.pc);
    console.log('CC Prompt:', state.ccPrompt);
    console.log('Stack:', state.stack);
    console.log('Variables:', state.variables);
    
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('First prompt');
    expect(state.pc).toBe(1); // At CC instruction

    // Resume with first result
    console.log('\n=== Resume with first result ===');
    state = vm.resume(state, 'ANSWER1', compiled.bytecode!);
    console.log('Status:', state.status);
    console.log('PC:', state.pc);
    console.log('CC Prompt:', state.ccPrompt);
    console.log('Stack:', state.stack);
    console.log('Variables:', state.variables);
    console.log('Output:', state.output);
    
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('Second prompt');
    expect(state.variables.get('a')).toBe('ANSWER1');
    expect(state.output).toContain('Got: ANSWER1');

    // Resume with second result
    console.log('\n=== Resume with second result ===');
    state = vm.resume(state, 'ANSWER2', compiled.bytecode!);
    console.log('Status:', state.status);
    console.log('PC:', state.pc);
    console.log('Variables:', state.variables);
    console.log('Output:', state.output);
    
    expect(state.status).toBe('complete');
    expect(state.variables.get('b')).toBe('ANSWER2');
    expect(state.output).toContain('Got: ANSWER2');
    expect(state.output).toContain('Done: ANSWER1 and ANSWER2');
  });

  it('should handle back-to-back CC calls', () => {
    const source = `
function main() {
  const a = CC("First");
  const b = CC("Second");
  console.log(a + " " + b);
}
main();
`;

    const compiled = compile(source);
    expect(compiled.success).toBe(true);

    // Execute until first CC
    let state = vm.execute(compiled.bytecode!);
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('First');

    // Resume - should immediately hit second CC
    state = vm.resume(state, 'A', compiled.bytecode!);
    expect(state.status).toBe('waiting_cc');
    expect(state.ccPrompt).toBe('Second');
    expect(state.variables.get('a')).toBe('A');

    // Resume again - should complete
    state = vm.resume(state, 'B', compiled.bytecode!);
    expect(state.status).toBe('complete');
    expect(state.output).toContain('A B');
  });
});