import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}

describe('slice on compiled programs', () => {
  it('compiled s.slice(6) on a string returns the suffix from index 6', () => {
    const s = run('const s = "hello world";\nreturn s.slice(6);');
    expect(s.error).toBeUndefined();
    expect(s.returnValue).toBe('world');
  });

  it('compiled s.slice(-5) on a string returns the last five characters', () => {
    const s = run('const s = "hello world";\nreturn s.slice(-5);');
    expect(s.error).toBeUndefined();
    expect(s.returnValue).toBe('world');
  });

  it('compiled s.slice(0, 5) on a string still returns the first five characters', () => {
    const s = run('const s = "hello world";\nreturn s.slice(0, 5);');
    expect(s.error).toBeUndefined();
    expect(s.returnValue).toBe('hello');
  });

  it('compiled arr.slice(1, 3) on an array returns a new array with the two middle elements and leaves the original unchanged', () => {
    const s = run([
      'const a = [1, 2, 3, 4];',
      'const p = a.slice(1, 3);',
      'console.log(p.length + ":" + p[0] + "," + p[1] + ":" + a.length);'
    ].join('\n'));
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['2:2,3:4']);
  });

  it('compiled arr.slice(2) on an array returns the tail and arr.slice() returns a full copy', () => {
    const s = run([
      'const a = [1, 2, 3, 4];',
      'const tail = a.slice(2);',
      'const copy = a.slice();',
      'console.log(tail.length + ":" + tail[0] + "," + tail[1]);',
      'console.log(copy.length + ":" + copy[0] + "," + copy[3]);'
    ].join('\n'));
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['2:3,4', '4:1,4']);
  });

  it('slice on a number fails with slice requires a string or an array', () => {
    const s = run('const n = 5;\nreturn n.slice(1);');
    expect(s.status).toBe('error');
    expect(s.error).toContain('slice requires a string or an array');
  });
});
