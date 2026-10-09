import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}

// Audit 2026-10-09 bug repros. Each test asserts the CORRECT behaviour and is marked
// it.fails while the bug exists; when a bug is fixed, turn it.fails into it.
describe('audit 2026-10-09 repro: array methods dispatched as string methods', () => {
  it.fails('arr.includes(2) returns true', () => {
    const s = run('const a = [1, 2, 3];\nreturn a.includes(2);');
    expect(s.error).toBeUndefined();
    expect(s.returnValue).toBe(true);
  });

  it.fails('arr.indexOf("y") returns 1', () => {
    const s = run('const a = ["x", "y"];\nreturn a.indexOf("y");');
    expect(s.error).toBeUndefined();
    expect(s.returnValue).toBe(1);
  });

  it.fails('arr.toString() returns the comma-joined elements', () => {
    const s = run('const a = [1, 2];\nreturn a.toString();');
    expect(s.returnValue).toBe('1,2');
  });
});

describe('audit 2026-10-09 repro: comparison with undefined', () => {
  it.fails('an uninitialized let compares equal to undefined', () => {
    const s = run('let u;\nreturn u === undefined;');
    expect(s.returnValue).toBe(true);
  });

  it.fails('a missing property compares equal to undefined', () => {
    const s = run('const o = JSON.parse("{}");\nreturn o.missing === undefined;');
    expect(s.returnValue).toBe(true);
  });

  it('typeof of a missing property is "undefined" (control: works today)', () => {
    const s = run('const o = JSON.parse("{}");\nreturn typeof o.missing;');
    expect(s.returnValue).toBe('undefined');
  });
});

describe('audit 2026-10-09 repro: execution limits from config are not enforced', () => {
  it.fails('CVM_MAX_STACK_SIZE=1 stops a program that needs a deeper stack', () => {
    const previous = process.env['CVM_MAX_STACK_SIZE'];
    process.env['CVM_MAX_STACK_SIZE'] = '1';
    try {
      const s = run('return 1 + 2 + 3;');
      expect(s.status).toBe('error');
    } finally {
      if (previous === undefined) delete process.env['CVM_MAX_STACK_SIZE'];
      else process.env['CVM_MAX_STACK_SIZE'] = previous;
    }
  });
});
