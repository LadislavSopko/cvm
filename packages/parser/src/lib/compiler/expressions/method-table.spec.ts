import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode, Instruction } from '../../bytecode.js';
import { METHODS } from './method-table.js';

function callBytecode(call: string): Instruction[] {
  const result = compile(`function main() {\nlet x = "abc";\n${call};\n}`);
  expect(result.errors).toHaveLength(0);
  const start = result.bytecode.findIndex((instr, i) => i > 1 && instr.op === OpCode.LOAD && instr.arg === 'x');
  return result.bytecode.slice(start);
}

describe('METHODS dispatch table', () => {
  it('every method name in the table emits receiver, one value per declared argument and then its opcode', () => {
    for (const [name, spec] of Object.entries(METHODS)) {
      const args = spec.args.map((_, i) => String(i + 10));
      const code = callBytecode(`x.${name}(${args.join(', ')})`);
      expect(code[0], name).toEqual({ op: OpCode.LOAD, arg: 'x' });
      spec.args.forEach((_, i) => expect(code[i + 1], name).toEqual({ op: OpCode.PUSH, arg: i + 10 }));
      expect(code[spec.args.length + 1].op, name).toBe(spec.op);
    }
  });

  it('a missing optional argument emits its declared default', () => {
    const code = callBytecode('x.padStart(5)');
    expect(code.slice(0, 4)).toEqual([
      { op: OpCode.LOAD, arg: 'x' },
      { op: OpCode.PUSH, arg: 5 },
      { op: OpCode.PUSH, arg: ' ' },
      { op: OpCode.STRING_PAD_START }
    ]);
  });

  it('s.substring(2) emits PUSH_UNDEFINED as end', () => {
    const code = callBytecode('x.substring(2)');
    expect(code.slice(0, 4).map(i => i.op)).toEqual([
      OpCode.LOAD, OpCode.PUSH, OpCode.PUSH_UNDEFINED, OpCode.STRING_SUBSTRING
    ]);
  });

  it('match() without an argument is a compile error with match() requires a regex argument', () => {
    const result = compile('function main() {\nlet x = "abc";\nx.match();\n}');
    expect(result.success).toBe(false);
    expect(result.errors.map(e => e.message)).toContain('match() requires a regex argument');
  });

  it("an unknown method is still a compile error Method call 'x' is not supported", () => {
    const result = compile('function main() {\nlet s = "abc";\ns.x();\n}');
    expect(result.success).toBe(false);
    expect(result.errors.map(e => e.message)).toContain("Method call 'x' is not supported");
  });
});
