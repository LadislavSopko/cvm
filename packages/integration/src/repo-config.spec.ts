import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('repository configuration', () => {
  it('eslint.config.mjs exists and ignores dist node_modules .nx test/programs and apps/cvm-server/programs', () => {
    expect(existsSync(resolve(root, 'eslint.config.mjs'))).toBe(true);
    const config = read('eslint.config.mjs');
    for (const pattern of ['**/dist/**', '**/node_modules/**', '.nx/**', 'test/programs/**', 'apps/cvm-server/programs/**']) {
      expect(config, pattern).toContain(pattern);
    }
  });

  it('nx.json registers @nx/eslint/plugin with targetName lint', () => {
    const plugins = JSON.parse(read('nx.json')).plugins ?? [];
    const eslint = plugins.find((p: { plugin?: string }) => typeof p === 'object' && p.plugin === '@nx/eslint/plugin');
    expect(eslint?.options?.targetName).toBe('lint');
  });

  it('package.json devDependencies contain eslint typescript-eslint and @nx/eslint', () => {
    const devDependencies = JSON.parse(read('package.json')).devDependencies ?? {};
    expect(Object.keys(devDependencies)).toEqual(expect.arrayContaining(['eslint', 'typescript-eslint', '@nx/eslint']));
  });

  it('.nvmrc pins Node 22', () => {
    expect(existsSync(resolve(root, '.nvmrc'))).toBe(true);
    expect(read('.nvmrc').trim()).toBe('22');
  });

  it('root and apps/cvm-server package.json declare engines node >=22', () => {
    for (const path of ['package.json', 'apps/cvm-server/package.json']) {
      expect(JSON.parse(read(path)).engines?.node, path).toBe('>=22');
    }
  });

  it('the test runner itself runs on Node 22 or newer', () => {
    expect(Number(process.versions.node.split('.')[0])).toBeGreaterThanOrEqual(22);
  });
});
