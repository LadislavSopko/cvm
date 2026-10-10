import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';
import { OpCode } from '@cvm/types';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return { compiled, state: new VM().execute(compiled.bytecode) };
}

describe('compiled substring', () => {
  it('s.substring(2) emits PUSH_UNDEFINED as end and returns the suffix at runtime', () => {
    const { compiled, state } = run('const s = "hello";\nreturn s.substring(2);');
    const at = compiled.bytecode.findIndex(i => i.op === OpCode.STRING_SUBSTRING);
    expect(compiled.bytecode[at - 1].op).toBe(OpCode.PUSH_UNDEFINED);
    expect(state.returnValue).toBe('llo');
  });

  it('s.substring(1, 3) still returns the middle characters', () => {
    expect(run('const s = "hello";\nreturn s.substring(1, 3);').state.returnValue).toBe('el');
  });
});
