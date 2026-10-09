import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';

// Audit 2026-10-09 bug repros. Each test asserts the CORRECT behaviour and is marked
// it.fails while the bug exists; when a bug is fixed, turn it.fails into it.
describe('audit 2026-10-09 repro: syntax errors', () => {
  it.fails('rejects a declaration with a missing initializer expression', () => {
    const r = compile('function main() { const x = ; console.log("a"); }');
    expect(r.success).toBe(false);
  });

  it.fails('rejects an unclosed call expression', () => {
    const r = compile('function main() { console.log("a" }');
    expect(r.success).toBe(false);
  });
});
