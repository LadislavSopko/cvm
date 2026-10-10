import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  const state = new VM().execute(compiled.bytecode);
  expect(state.error).toBeUndefined();
  return state.returnValue;
}

describe('array receivers of shared method names', () => {
  it('arr.lastIndexOf finds the last matching element and returns -1 when absent', () => {
    expect(run('const a = ["x", "y", "x", "z"];\nreturn a.lastIndexOf("x");')).toBe(2);
    expect(run('const a = ["x", "y"];\nreturn a.lastIndexOf("q");')).toBe(-1);
  });

  it('arr.includes on a missing element returns false', () => {
    expect(run('const a = [1, 2, 3];\nreturn a.includes(4);')).toBe(false);
  });

  it('string includes indexOf and toString keep their current results', () => {
    expect(run('const s = "hello";\nreturn s.includes("ell");')).toBe(true);
    expect(run('const s = "hello";\nreturn s.indexOf("l");')).toBe(2);
    expect(run('const s = "hello";\nreturn s.lastIndexOf("l");')).toBe(3);
    expect(run('const n = 42;\nreturn n.toString();')).toBe('42');
    expect(run('const s = "abc";\nreturn s.toString();')).toBe('abc');
  });
});
