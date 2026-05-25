import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { VMManager } from '@cvm/vm';
import { FileStorageAdapter } from '@cvm/storage';
import { SandboxedFileSystem } from '@cvm/vm';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

const WORKSPACE_ROOT = resolve(process.cwd(), '../..');
const EXECUTOR_PATH = resolve(WORKSPACE_ROOT, 'programs/planexecutor.ts');

function makeUplan(blocks: Array<{ id: string; title: string; intro: string; red: string; success: string }>): string {
  return JSON.stringify({
    mission: 'Test mission for planexecutor verification.',
    sourceFile: 'test-plan.md',
    blocks: blocks.map(b => ({
      ...b,
      planRef: 'See test-plan.md lines 1-10',
    })),
  });
}

describe('planexecutor', () => {
  const cvmDir = resolve(process.cwd(), '.cvm');
  let originalSandbox: string | undefined;
  let originalPaths: string | undefined;

  beforeAll(() => {
    mkdirSync(cvmDir, { recursive: true });
    originalSandbox = process.env['CVM_SANDBOX_ROOT'];
    originalPaths = process.env['CVM_SANDBOX_PATHS'];
    process.env['CVM_SANDBOX_ROOT'] = process.cwd();
  });

  afterAll(() => {
    if (originalSandbox !== undefined) {
      process.env['CVM_SANDBOX_ROOT'] = originalSandbox;
    } else {
      delete process.env['CVM_SANDBOX_ROOT'];
    }
    if (originalPaths !== undefined) {
      process.env['CVM_SANDBOX_PATHS'] = originalPaths;
    } else {
      delete process.env['CVM_SANDBOX_PATHS'];
    }
    rmSync(cvmDir, { recursive: true, force: true });
  });

  function createVMManager(): VMManager {
    const storage = new FileStorageAdapter(cvmDir);
    const fs = new SandboxedFileSystem();
    return new VMManager(storage, fs);
  }

  it('should load into CVM without compilation errors', async () => {
    const vm = createVMManager();
    await vm.initialize();
    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await expect(vm.loadProgram('planexecutor', source)).resolves.toBeUndefined();
    await vm.dispose();
  });

  it('should produce MISSION CC as first prompt', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-test', title: 'Test Block', intro: 'Some intro', red: '- test one', success: '- [ ] criterion one' },
    ]);
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-mission', source);
    await vm.startExecution('pe-mission', 'exec-mission');

    const result = await vm.getNext('exec-mission');
    expect(result.type).toBe('waiting');
    expect(result.message).toContain('MISSION BRIEFING');
    expect(result.message).toContain('Test mission');

    await vm.dispose();
  });

  it('should produce RED/GREEN/VERIFY/COMMIT CC prompts per block in order', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-alpha', title: 'Alpha', intro: 'Alpha intro', red: '- test alpha', success: '- [ ] alpha done' },
    ]);
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-order', source);
    await vm.startExecution('pe-order', 'exec-order');

    const prompts: string[] = [];
    let next = await vm.getNext('exec-order');
    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      const response = next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')
        ? 'passed' : 'done';
      await vm.reportCCResult('exec-order', response);
      next = await vm.getNext('exec-order');
    }

    expect(prompts[0]).toContain('MISSION');
    expect(prompts[1]).toContain('RED PHASE');
    expect(prompts[1]).toContain('01-alpha');
    expect(prompts[2]).toContain('GREEN PHASE');
    expect(prompts[3]).toContain('VERIFY PHASE');
    expect(prompts[4]).toContain('COMMIT PHASE');
    expect(prompts[5]).toContain('FINAL REVIEW');

    await vm.dispose();
  });

  it('should repeat VERIFY loop on "failed" and exit on "passed"', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-retry', title: 'Retry Block', intro: 'Retry intro', red: '- test retry', success: '- [ ] retry done' },
    ]);
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-retry', source);
    await vm.startExecution('pe-retry', 'exec-retry');

    const prompts: string[] = [];
    let verifyCount = 0;
    let next = await vm.getNext('exec-retry');

    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      let response = 'done';

      if (next.message!.includes('VERIFY PHASE') || next.message!.includes('RE-VERIFY')) {
        verifyCount++;
        response = verifyCount <= 1 ? 'failed' : 'passed';
      }

      await vm.reportCCResult('exec-retry', response);
      next = await vm.getNext('exec-retry');
    }

    expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
    expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);

    await vm.dispose();
  });

  it('should complete without CC prompts when uplan.json is missing', async () => {
    const emptyDir = join(tmpdir(), 'cvm-empty-' + Date.now());
    mkdirSync(join(emptyDir, '.cvm'), { recursive: true });

    const origSandbox = process.env['CVM_SANDBOX_ROOT'];
    process.env['CVM_SANDBOX_ROOT'] = emptyDir;

    const missingVm = new VMManager(
      new FileStorageAdapter(join(emptyDir, '.cvm')),
      new SandboxedFileSystem()
    );
    await missingVm.initialize();

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await missingVm.loadProgram('pe-missing', source);
    await missingVm.startExecution('pe-missing', 'exec-missing');

    const result = await missingVm.getNext('exec-missing');
    expect(result.type).toBe('completed');

    await missingVm.dispose();
    process.env['CVM_SANDBOX_ROOT'] = origSandbox || '';
    rmSync(emptyDir, { recursive: true, force: true });
  });

  it('should complete all blocks in sequence with progress tracking', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-first', title: 'First', intro: 'First intro', red: '- test first', success: '- [ ] first done' },
      { id: '02-second', title: 'Second', intro: 'Second intro', red: '- test second', success: '- [ ] second done' },
    ]);
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-seq', source);
    await vm.startExecution('pe-seq', 'exec-seq');

    const prompts: string[] = [];
    let next = await vm.getNext('exec-seq');
    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      const response = next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')
        ? 'passed' : 'done';
      await vm.reportCCResult('exec-seq', response);
      next = await vm.getNext('exec-seq');
    }

    expect(prompts.filter(p => p.includes('RED PHASE'))).toHaveLength(2);
    expect(prompts.filter(p => p.includes('GREEN PHASE'))).toHaveLength(2);
    expect(prompts.filter(p => p.includes('COMMIT PHASE'))).toHaveLength(2);
    expect(prompts.some(p => p.includes('[1/2]'))).toBe(true);
    expect(prompts.some(p => p.includes('[2/2]'))).toBe(true);
    expect(prompts[prompts.length - 1]).toContain('FINAL REVIEW');

    await vm.dispose();
  });
});
