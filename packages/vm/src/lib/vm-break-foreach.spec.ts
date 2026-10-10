import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}

describe('break and continue inside for-of / for-in', () => {
  it('break inside for-of stops the loop and execution completes with the statements after the loop', () => {
    const s = run(`
      for (const n of [1, 2, 3, 4]) {
        if (n === 3) { break; }
        console.log("n" + n);
      }
      console.log("after");
    `);
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['n1', 'n2', 'after']);
  });

  it('break inside for-in stops the loop and execution completes with the statements after the loop', () => {
    const s = run(`
      const o = { a: 1, b: 2, c: 3 };
      for (const k in o) {
        if (k === "b") { break; }
        console.log(k);
      }
      console.log("after");
    `);
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['a', 'after']);
  });

  it('continue inside for-of skips one element and the loop finishes normally', () => {
    const s = run(`
      for (const n of [1, 2, 3]) {
        if (n === 2) { continue; }
        console.log("v" + n);
      }
      console.log("done");
    `);
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['v1', 'v3', 'done']);
  });

  it('break in an inner for-of exits only the inner loop and the outer for-of keeps iterating', () => {
    const s = run(`
      for (const x of [1, 2]) {
        for (const y of ["a", "b", "c"]) {
          if (y === "b") { break; }
          console.log(x + y);
        }
      }
      console.log("end");
    `);
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['1a', '2a', 'end']);
  });

  it('two consecutive for-of loops that both break complete without iterator errors', () => {
    const s = run(`
      for (const a of [1, 2, 3]) {
        if (a === 2) { break; }
        console.log("first" + a);
      }
      for (const b of [4, 5, 6]) {
        if (b === 5) { break; }
        console.log("second" + b);
      }
      console.log("end");
    `);
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['first1', 'second4', 'end']);
  });

  it('break in a for-of nested inside a while loop exits only the for-of', () => {
    const s = run(`
      let i = 0;
      while (i < 2) {
        for (const n of [10, 20, 30]) {
          if (n === 20) { break; }
          console.log("i" + i + "n" + n);
        }
        i = i + 1;
      }
      console.log("loops " + i);
    `);
    expect(s.error).toBeUndefined();
    expect(s.status).toBe('complete');
    expect(s.output).toEqual(['i0n10', 'i1n10', 'loops 2']);
  });
});
