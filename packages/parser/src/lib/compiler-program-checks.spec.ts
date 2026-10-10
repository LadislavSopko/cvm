import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';

describe('compile() program checks', () => {
  it('reports a syntax error with its 1-based line and the TypeScript message text', () => {
    const r = compile('function main() {\n  const x = ;\n}');
    expect(r.success).toBe(false);
    expect(r.bytecode).toEqual([]);
    expect(r.errors[0]).toMatchObject({ line: 2, message: 'Expression expected.' });
  });

  it('fails a program without a main function with Program must have a main() function', () => {
    const r = compile('const a = 1;');
    expect(r.success).toBe(false);
    expect(r.errors[0].message).toBe('Program must have a main() function');
  });

  it('fails a main function with parameters with main() must not have parameters', () => {
    const r = compile('function main(x) {\n  console.log(x);\n}');
    expect(r.success).toBe(false);
    expect(r.errors[0].message).toBe('main() must not have parameters');
    expect(r.errors[0].line).toBe(1);
  });

  it('fails a call to setTimeout with Unsupported function: setTimeout and the line of the call', () => {
    const r = compile('function main() {\n  setTimeout("x", 1);\n}');
    expect(r.success).toBe(false);
    expect(r.errors[0]).toMatchObject({ message: 'Unsupported function: setTimeout', line: 2 });
  });

  it('still compiles let = 5 because it is valid sloppy-mode JavaScript', () => {
    const r = compile('function main() { let = 5; }');
    expect(r.success).toBe(true);
  });
});
