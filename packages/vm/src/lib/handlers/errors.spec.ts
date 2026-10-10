import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';
import { runtimeError } from './errors.js';

describe('runtimeError', () => {
  it('runtimeError builds a RuntimeError with the message, the current pc and the instruction opcode', () => {
    const state = new VM().createInitialState();
    state.pc = 7;
    expect(runtimeError(state, { op: OpCode.STRING_TRIM }, 'boom')).toEqual({
      type: 'RuntimeError',
      message: 'boom',
      pc: 7,
      opcode: OpCode.STRING_TRIM
    });
  });

  it('no handler source file still contains a hand-written RuntimeError object literal', () => {
    const dir = __dirname;
    const offenders = readdirSync(dir)
      .filter(f => f.endsWith('.ts') && !f.endsWith('.spec.ts') && f !== 'errors.ts')
      .filter(f => /type:\s*'RuntimeError'/.test(readFileSync(join(dir, f), 'utf8')));
    expect(offenders).toEqual([]);
  });
});
