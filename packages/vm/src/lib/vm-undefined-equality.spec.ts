import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}

describe('strict equality with undefined', () => {
  it('undefined !== undefined is false', () => {
    const s = run('let u;\nreturn u !== undefined;');
    expect(s.returnValue).toBe(false);
  });

  it('undefined === null is false and undefined !== null is true', () => {
    expect(run('let u;\nreturn u === null;').returnValue).toBe(false);
    expect(run('let u;\nreturn u !== null;').returnValue).toBe(true);
  });

  it('a value assigned from a missing property compares equal to another missing property', () => {
    const s = run('const o = JSON.parse("{}");\nconst a = o.x;\nreturn a === o.y;');
    expect(s.returnValue).toBe(true);
  });
});
