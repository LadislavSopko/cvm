import { describe, it, expect, vi } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { OpCode, Instruction } from '@cvm/parser';
import { VM } from './vm.js';
import { handlers } from './handlers/index.js';

const fake = vi.hoisted(() => {
  const make = () => ({
    trace: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), fatal: vi.fn(),
    traceEnabled: false,
    isLevelEnabled(level: string) { return level === 'trace' ? this.traceEnabled : true; },
    child() { return this; }
  });
  const child = make();
  const root = { ...make(), child: () => child };
  return { root, child };
});

vi.mock('@cvm/types', async importOriginal => ({
  ...(await importOriginal<typeof import('@cvm/types')>()),
  logger: fake.root
}));

const program: Instruction[] = [
  { op: OpCode.PUSH, arg: 1 },
  { op: OpCode.PUSH, arg: 2 },
  { op: OpCode.ADD },
  { op: OpCode.POP },
  { op: OpCode.HALT }
];

function executingCalls(spy: { mock: { calls: unknown[][] } }): number {
  return spy.mock.calls.filter(args => args.includes('Executing instruction')).length;
}

describe('VM instruction loop', () => {

  it('a handler with stackIn N receives an underflow error from validateStack before its own code runs', () => {
    const handler = handlers[OpCode.ADD]!;
    expect(handler.stackIn).toBe(2);
    const execute = vi.spyOn(handler, 'execute');
    const state = new VM().execute([{ op: OpCode.PUSH, arg: 1 }, { op: OpCode.ADD }]);
    expect(state.status).toBe('error');
    expect(state.error).toBe('ADD: Stack underflow');
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    OpCode.ADD, OpCode.SUB, OpCode.MUL, OpCode.DIV, OpCode.MOD, OpCode.UNARY_MINUS, OpCode.UNARY_PLUS,
    OpCode.EQ, OpCode.NEQ, OpCode.LT, OpCode.GT, OpCode.LTE, OpCode.GTE, OpCode.EQ_STRICT, OpCode.NEQ_STRICT,
    OpCode.AND, OpCode.OR, OpCode.NOT,
    OpCode.PROPERTY_SET, OpCode.PROPERTY_GET, OpCode.JSON_STRINGIFY, OpCode.OBJECT_KEYS, OpCode.OBJECT_ITER_START,
    OpCode.CONCAT, OpCode.STRING_LEN, OpCode.LENGTH, OpCode.JSON_PARSE, OpCode.TYPEOF,
    OpCode.REGEX_TEST, OpCode.STRING_MATCH, OpCode.STRING_REPLACE_REGEX
  ])('%s with one value too few stops with a stack underflow', op => {
    const stackIn = handlers[op]!.stackIn;
    const pushes: Instruction[] = Array.from({ length: stackIn - 1 }, () => ({ op: OpCode.PUSH, arg: 1 }));
    const state = new VM().execute([...pushes, { op }]);
    expect(state.status).toBe('error');
    expect(state.error).toBe(`${op}: Stack underflow`);
  });

  it('no handler imports safePop', () => {
    const dir = join(__dirname, 'handlers');
    const offenders = readdirSync(dir)
      .filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts'))
      .filter(f => readFileSync(join(dir, f), 'utf8').includes('safePop'));
    expect(offenders).toEqual([]);
  });

  it('with trace disabled the instruction loop does not build per-instruction log objects', () => {
    fake.child.traceEnabled = false;
    fake.root.trace.mockClear();
    fake.child.trace.mockClear();
    new VM().execute(program);
    expect(executingCalls(fake.root.trace) + executingCalls(fake.child.trace)).toBe(0);
  });

  it('with trace enabled exactly one Executing instruction entry is logged per instruction', () => {
    fake.child.traceEnabled = true;
    fake.root.trace.mockClear();
    fake.child.trace.mockClear();
    new VM().execute(program);
    expect(executingCalls(fake.root.trace) + executingCalls(fake.child.trace)).toBe(program.length);
  });
});
