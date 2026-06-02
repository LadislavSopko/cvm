import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { VMManager } from '@cvm/vm';
import { FileStorageAdapter } from '@cvm/storage';
import { SandboxedFileSystem } from '@cvm/vm';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

const WORKSPACE_ROOT = resolve(process.cwd(), '../..');
const EXECUTOR_PATH = resolve(WORKSPACE_ROOT, 'test/programs/tddab/planexecutor.ts');

function toRedKey(test: string): string {
  return test.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 40).trim().replace(/ +/g, '_').toLowerCase();
}

function makeUplan(blocks: Array<{ id: string; title: string; intro: string; red: string; success: string }>, type?: string): string {
  return JSON.stringify({
    type: type || 'tddab',
    mission: 'Test mission for planexecutor verification.',
    sourceFile: 'test-plan.md',
    blocks: blocks.map(b => ({
      ...b,
      redKeys: b.red.split('\n').filter(l => l.startsWith('- ')).map(l => toRedKey(l.replace('- ', ''))),
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

  it('should include project context in first block prompt', async () => {
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
    expect(result.message).toContain('PROJECT CONTEXT');
    expect(result.message).toContain('Test mission');
    expect(result.message).toContain('RED PHASE');

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
      let response = 'done';
      if (next.message!.includes('CROSS-CHECK')) {
        response = '{"test_alpha": true}';
      } else if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }
      await vm.reportCCResult('exec-order', response);
      next = await vm.getNext('exec-order');
    }

    expect(prompts[0]).toContain('PROJECT CONTEXT');
    expect(prompts[0]).toContain('RED PHASE');
    expect(prompts[0]).toContain('01-alpha');
    expect(prompts[1]).toContain('GREEN PHASE');
    expect(prompts[2]).toContain('VERIFY PHASE');
    expect(prompts[3]).toContain('CROSS-CHECK');
    expect(prompts[4]).toContain('UPDATE MEMORY BANK');
    expect(prompts[5]).toContain('COMMIT PHASE');
    expect(prompts[6]).toContain('FINAL REVIEW');

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

      if (next.message!.includes('CROSS-CHECK')) {
        response = '{"test_retry": true}';
      } else if (next.message!.includes('VERIFY PHASE') || next.message!.includes('RE-VERIFY')) {
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
      let response = 'done';
      if (next.message!.includes('CROSS-CHECK') && next.message!.includes('01-first')) {
        response = '{"test_first": true}';
      } else if (next.message!.includes('CROSS-CHECK') && next.message!.includes('02-second')) {
        response = '{"test_second": true}';
      } else if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }
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

  it('should use EXECUTE/VERIFY/COMMIT flow for step plan type', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-cleanup', title: 'Cleanup Config', intro: 'Remove old config', red: '- Remove legacy entries', success: '- [ ] config clean' },
    ], 'step');
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-step', source);
    await vm.startExecution('pe-step', 'exec-step');

    const prompts: string[] = [];
    let next = await vm.getNext('exec-step');
    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      let response = 'done';
      if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }
      await vm.reportCCResult('exec-step', response);
      next = await vm.getNext('exec-step');
    }

    expect(next.type).toBe('completed');
    expect(prompts[0]).toContain('PROJECT CONTEXT');
    expect(prompts[0]).toContain('EXECUTE');
    expect(prompts[0]).toContain('01-cleanup');
    expect(prompts[1]).toContain('VERIFY');
    expect(prompts[2]).toContain('UPDATE MEMORY BANK');
    expect(prompts[3]).toContain('COMMIT');
    expect(prompts[prompts.length - 1]).toContain('FINAL REVIEW');

    expect(prompts.filter(p => p.includes('RED PHASE'))).toHaveLength(0);
    expect(prompts.filter(p => p.includes('GREEN PHASE'))).toHaveLength(0);
    expect(prompts.filter(p => p.includes('CROSS-CHECK'))).toHaveLength(0);

    await vm.dispose();
  });

  it('should handle VERIFY failure in step plan with FIX loop', async () => {
    const vm = createVMManager();
    await vm.initialize();

    const uplan = makeUplan([
      { id: '01-fix-step', title: 'Fix Step', intro: 'Step that needs fix', red: '- Remove broken file', success: '- [ ] file removed' },
    ], 'step');
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);

    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram('pe-step-fix', source);
    await vm.startExecution('pe-step-fix', 'exec-step-fix');

    const prompts: string[] = [];
    let verifyCount = 0;
    let next = await vm.getNext('exec-step-fix');
    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      let response = 'done';
      if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        verifyCount++;
        response = verifyCount <= 1 ? 'failed' : 'passed';
      }
      await vm.reportCCResult('exec-step-fix', response);
      next = await vm.getNext('exec-step-fix');
    }

    expect(next.type).toBe('completed');
    expect(prompts.filter(p => p.includes('FIX'))).toHaveLength(1);
    expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);

    await vm.dispose();
  });

  // Drives one TDDAB block, answering each VERIFY/RE-VERIFY with the next
  // entry of verifyResponses (then "passed"), and returns the collected prompts.
  async function runVerdict(progId: string, verifyResponses: string[], crossCheckJson = '{"test_verdict": true}'): Promise<string[]> {
    const vm = createVMManager();
    await vm.initialize();
    const uplan = makeUplan([
      { id: '01-verdict', title: 'Verdict', intro: 'Verdict intro', red: '- test verdict', success: '- [ ] verdict done' },
    ]);
    writeFileSync(join(cvmDir, 'uplan.json'), uplan);
    // Each call is an independent run — clear any progress from a prior test
    // so the shared block id is not skipped as "already completed".
    rmSync(join(cvmDir, 'uplan-progress.json'), { force: true });
    const source = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vm.loadProgram(progId, source);
    await vm.startExecution(progId, 'exec-' + progId);

    const prompts: string[] = [];
    let vi = 0;
    let next = await vm.getNext('exec-' + progId);
    while (next.type === 'waiting') {
      const msg = next.message || '';
      prompts.push(msg);
      let response = 'done';
      if (msg.includes('CROSS-CHECK')) {
        response = crossCheckJson;
      } else if (msg.includes('VERIFY PHASE') || msg.includes('RE-VERIFY')) {
        response = vi < verifyResponses.length ? verifyResponses[vi] : 'passed';
        vi++;
      }
      await vm.reportCCResult('exec-' + progId, response);
      next = await vm.getNext('exec-' + progId);
    }
    await vm.dispose();
    return prompts;
  }

  describe('verdict parsing (terse + tolerant)', () => {
    it('treats "passed" as pass and exits with no FIX PHASE', async () => {
      const prompts = await runVerdict('pe-v-passed', ['passed']);
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(0);
    });

    it('treats a reply starting with "passed" then an essay on later lines as pass', async () => {
      const prompts = await runVerdict('pe-v-essay', ['passed\nAll criteria met, no failures, nothing rejected.']);
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(0);
    });

    it('treats "PASSED" (uppercase) as pass', async () => {
      const prompts = await runVerdict('pe-v-upper', ['PASSED']);
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(0);
    });

    it('treats "failed" as fail: exactly one FIX PHASE then one RE-VERIFY', async () => {
      const prompts = await runVerdict('pe-v-failed', ['failed', 'passed']);
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
      expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);
    });

    it('treats a reply not starting with "passed" as failed and re-runs', async () => {
      const prompts = await runVerdict('pe-v-garbage', ['I am not sure it works', 'passed']);
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
      expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);
    });

    it('VERIFY PHASE prompt instructs to submit only the word passed or failed', async () => {
      const prompts = await runVerdict('pe-v-prompt', ['passed']);
      const verifyPrompt = prompts.find(p => p.includes('VERIFY PHASE')) || '';
      expect(verifyPrompt.toLowerCase()).toContain('submit only one word: passed or failed');
    });
  });

  describe('cross-check re-verify gating', () => {
    it('when cross-check fails and RE-VERIFY returns "failed", issues another FIX and does not commit yet', async () => {
      // VERIFY(passed) -> CROSS-CHECK(false) -> FIX -> RE-VERIFY(failed) -> FIX -> RE-VERIFY(passed)
      const prompts = await runVerdict('pe-cc-fail', ['passed', 'failed', 'passed'], '{"test_verdict": false}');
      expect(prompts.filter(p => p.includes('FIX PHASE')).length).toBe(2);
    });

    it('when cross-check fails and RE-VERIFY returns "passed", proceeds to UPDATE MEMORY BANK then COMMIT', async () => {
      const prompts = await runVerdict('pe-cc-pass', ['passed', 'passed'], '{"test_verdict": false}');
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
      const mbIdx = prompts.findIndex(p => p.includes('UPDATE MEMORY BANK'));
      const commitIdx = prompts.findIndex(p => p.includes('COMMIT PHASE'));
      expect(mbIdx).toBeGreaterThan(-1);
      expect(commitIdx).toBeGreaterThan(mbIdx);
    });

    it('when cross-check passes, no extra RE-VERIFY and sequence unchanged', async () => {
      const prompts = await runVerdict('pe-cc-ok', ['passed'], '{"test_verdict": true}');
      expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(0);
      expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(0);
      expect(prompts.filter(p => p.includes('CROSS-CHECK'))).toHaveLength(1);
    });
  });
});
