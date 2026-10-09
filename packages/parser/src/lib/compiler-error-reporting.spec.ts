import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

const wrap = (body: string) => `function main() {\n${body}\n}`;
const JUMP_OPS = [OpCode.JUMP, OpCode.JUMP_IF_FALSE, OpCode.BREAK, OpCode.CONTINUE];

describe('compiler error reporting for unsupported constructs', () => {
  it('reports Method call min is not supported with line and column instead of dropping the statement', () => {
    const r = compile(wrap('  const x = Math.min(1, 2);\n  console.log(x);'));
    expect(r.success).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toContain("Method call 'min' is not supported");
    expect(r.errors[0].line).toBe(2);
    expect(r.errors[0].character).toBeGreaterThan(1);
  });

  it('returns success false and an error when Date.now() is used inside a for loop body', () => {
    const r = compile(wrap('  for (let i = 0; i < 3; i++) {\n    const t = Date.now();\n    console.log(t);\n  }'));
    expect(r.success).toBe(false);
    expect(r.errors.some(e => e.message.includes("'now' is not supported"))).toBe(true);
  });

  it('reports computed property names in an object literal as an error', () => {
    const r = compile(wrap('  const k = "a";\n  const o = { [k]: 1 };\n  console.log(o);'));
    expect(r.success).toBe(false);
    expect(r.errors.some(e => e.message.includes('Computed property names are not supported'))).toBe(true);
  });

  it('reports compound assignment to an array element as an error', () => {
    const r = compile(wrap('  const arr = [1, 2];\n  arr[0] += 1;\n  console.log(arr[0]);'));
    expect(r.success).toBe(false);
    expect(r.errors.some(e => e.message.includes('Compound assignment to array elements not yet supported'))).toBe(true);
  });

  it('keeps compiling statements after an unsupported one and reports only the real problems', () => {
    const r = compile(wrap('  const x = Math.min(1, 2);\n  console.log("after");'));
    expect(r.errors).toHaveLength(1);
    expect(r.bytecode.some(i => i.op === OpCode.PUSH && i.arg === 'after')).toBe(true);
  });

  it('compiles a valid program with for, for-of, while, break and continue with no errors and no -1 jump', () => {
    const r = compile(wrap([
      '  let sum = 0;',
      '  for (let i = 0; i < 5; i++) {',
      '    if (i === 3) { continue; }',
      '    sum = sum + i;',
      '  }',
      '  for (const n of [1, 2, 3]) {',
      '    if (n === 2) { break; }',
      '    sum = sum + n;',
      '  }',
      '  let w = 0;',
      '  while (w < 3) {',
      '    w = w + 1;',
      '    if (w === 2) { continue; }',
      '  }',
      '  return sum;'
    ].join('\n')));
    expect(r.success).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.bytecode.some(i => JUMP_OPS.includes(i.op) && i.arg === -1)).toBe(false);
  });
});
