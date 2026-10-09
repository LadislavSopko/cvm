import { describe, it, expect } from 'vitest';
import { parseClientArgs, decideOutcome } from './e2e-outcome.js';

describe('e2e client outcome', () => {
  it('parseClientArgs separates program path, CC responses and the expect-error flag in any position', () => {
    expect(parseClientArgs(['prog.ts', 'a', '--expect-error=Boom', 'b'])).toEqual({
      programPath: 'prog.ts',
      responses: ['a', 'b'],
      expectError: 'Boom'
    });
    expect(parseClientArgs(['--expect-error=Invalid regular expression', 'prog.ts'])).toEqual({
      programPath: 'prog.ts',
      responses: [],
      expectError: 'Invalid regular expression'
    });
    expect(parseClientArgs(['prog.ts', 'x'])).toEqual({ programPath: 'prog.ts', responses: ['x'], expectError: undefined });
  });

  it('decideOutcome returns exit code 1 when the program failed to load', () => {
    const o = decideOutcome({ loadError: 'Error: Compilation failed: Unsupported statement', finalText: '', outputFound: false });
    expect(o.exitCode).toBe(1);
    expect(o.reason).toContain('load failed');
  });

  it('decideOutcome returns exit code 1 when the execution ends with an Error text and no error is expected', () => {
    const o = decideOutcome({ finalText: 'Error: ITER_END: No active iterator', outputFound: true });
    expect(o.exitCode).toBe(1);
    expect(o.reason).toContain('execution error');
  });

  it('decideOutcome returns exit code 0 when the execution error contains the expected error text', () => {
    const o = decideOutcome({
      finalText: 'Error: Invalid regular expression: /[unclosed/: Unterminated character class',
      outputFound: true,
      expectError: 'Invalid regular expression'
    });
    expect(o.exitCode).toBe(0);
    expect(o.reason).toBe('expected error');
  });

  it('decideOutcome returns exit code 1 when an expected error is not raised', () => {
    const o = decideOutcome({ finalText: 'Execution completed', outputFound: true, expectError: 'Invalid regular expression' });
    expect(o.exitCode).toBe(1);
    expect(o.reason).toContain('expected error not raised');
  });

  it('decideOutcome returns exit code 0 when the execution completed without an output file', () => {
    const o = decideOutcome({ finalText: 'Execution completed with result: 42', outputFound: false });
    expect(o.exitCode).toBe(0);
    expect(o.reason).toBe('completed (no output)');
  });

  it('decideOutcome returns exit code 0 for a completed execution with output', () => {
    const o = decideOutcome({ finalText: 'Execution completed', outputFound: true });
    expect(o.exitCode).toBe(0);
    expect(o.reason).toBe('completed');
  });
});
