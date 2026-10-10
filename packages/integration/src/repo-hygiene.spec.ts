import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '../../..');

describe('repository hygiene', () => {
  it('the repository no longer contains static, graph.html, counter.ts, benchmark or test/programs/archive', () => {
    const present = ['static', 'graph.html', 'counter.ts', 'benchmark', 'test/programs/archive']
      .filter(path => existsSync(resolve(root, path)));
    expect(present).toEqual([]);
  });

  it('compiler-state exports no getCurrentContext and JumpContext has no iterVariable', () => {
    const source = readFileSync(resolve(root, 'packages/parser/src/lib/compiler-state.ts'), 'utf8');
    expect(source).not.toContain('getCurrentContext');
    expect(source).not.toContain('iterVariable');
  });
});
