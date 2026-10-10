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

  it('mcp-test-client.ts contains no hard-coded home directory path', () => {
    expect(read('test/integration/mcp-test-client.ts')).not.toMatch(/\/home\/|\/Users\//);
  });

  it('ci.yml runs build typecheck lint test with --skip-nx-cache where applicable and the e2e suite', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('npx nx run-many --target=build --all');
    expect(ci).toContain('npx nx run-many --target=typecheck --all --skip-nx-cache');
    expect(ci).toContain('npx nx run-many --target=lint --all');
    expect(ci).toContain('npx nx run-many --target=test --all --skip-nx-cache');
    expect(ci).toContain('bash test/programs/run-all-tests.sh');
  });

  it('ci.yml uses .nvmrc for the Node version and rewrites the Nexus registry prefix before npm ci', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toContain('node-version-file: .nvmrc');
    const rewrite = ci.indexOf('nexus.0ics.ai/repository/npm-group/');
    const install = ci.indexOf('npm ci');
    expect(rewrite).toBeGreaterThan(-1);
    expect(install).toBeGreaterThan(rewrite);
    expect(ci).toContain('https://registry.npmjs.org/');
  });

  it('release.yml publishes only from production through the production environment with OIDC and no npm token', () => {
    const release = read('.github/workflows/release.yml');
    expect(release).toMatch(/push:\s*\n\s*branches: \[production\]/);
    expect(release).not.toContain('pull_request');
    expect(release).toContain('environment: production');
    expect(release).toContain('id-token: write');
    expect(release).toContain('npm publish --provenance');
    expect(release).not.toMatch(/NPM_TOKEN|NODE_AUTH_TOKEN|secrets\./);
  });

  it('ci.yml runs only on a pull request from main to production of this repository', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toMatch(/on:\s*\n\s*pull_request:\s*\n\s*branches: \[production\]\s*\n\s*\npermissions/);
    expect(ci).toContain("github.event.pull_request.head.repo.full_name == github.repository && github.head_ref == 'main'");
  });

  it('release.yml only builds and publishes and skips an already published version', () => {
    const release = read('.github/workflows/release.yml');
    expect(release).not.toContain('run-all-tests');
    expect(release).not.toContain('--target=test');
    expect(release).toContain('npm view "cvm-server@$VERSION" version');
  });

  it('every workflow action is pinned to a full commit sha', () => {
    for (const file of ['ci.yml', 'release.yml']) {
      const uses = read(`.github/workflows/${file}`).match(/uses: [^\s]+/g) ?? [];
      for (const use of uses.filter(u => !u.includes('./.github/'))) {
        expect(use, file).toMatch(/@[0-9a-f]{40}$/);
      }
    }
  });
});
