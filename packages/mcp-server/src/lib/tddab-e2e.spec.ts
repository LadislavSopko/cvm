import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseTddabPlan } from './tddab-parser.js';
import { VMManager } from '@cvm/vm';
import { FileStorageAdapter } from '@cvm/storage';
import { SandboxedFileSystem } from '@cvm/vm';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const WORKSPACE_ROOT = resolve(process.cwd(), '../..');
const SAMPLE_PLAN_PATH = resolve(WORKSPACE_ROOT, 'test/programs/tddab/sample-plan.md');
const SAMPLE_STEP_PLAN_PATH = resolve(WORKSPACE_ROOT, 'test/programs/tddab/sample-step-plan.md');
const EXECUTOR_PATH = resolve(WORKSPACE_ROOT, 'test/programs/tddab/planexecutor.ts');

describe('TDDAB E2E Pipeline', () => {
  const uplanDir = resolve(process.cwd(), '.cvm');
  const storageDir = resolve(process.cwd(), '.cvm-e2e-storage');
  let originalSandbox: string | undefined;

  beforeAll(() => {
    mkdirSync(uplanDir, { recursive: true });
    mkdirSync(storageDir, { recursive: true });
    try { rmSync(resolve(uplanDir, 'uplan-progress.json')); } catch { /* may not exist */ }
    originalSandbox = process.env['CVM_SANDBOX_ROOT'];
    process.env['CVM_SANDBOX_ROOT'] = process.cwd();
  });

  afterAll(() => {
    if (originalSandbox !== undefined) {
      process.env['CVM_SANDBOX_ROOT'] = originalSandbox;
    } else {
      delete process.env['CVM_SANDBOX_ROOT'];
    }
    rmSync(storageDir, { recursive: true, force: true });
    try { rmSync(resolve(uplanDir, 'uplan.json')); } catch { /* may not exist */ }
    try { rmSync(resolve(uplanDir, 'uplan-progress.json')); } catch { /* may not exist */ }
  });

  it('should parse sample-plan.md correctly with 3 blocks', () => {
    const planMd = readFileSync(SAMPLE_PLAN_PATH, 'utf-8');
    const result = parseTddabPlan(planMd, 'sample-plan.md');

    expect(result.valid).toBe(true);
    expect(result.plan).not.toBeNull();
    expect(result.plan!.blocks).toHaveLength(3);
    expect(result.plan!.blocks[0].id).toBe('01-greeting');
    expect(result.plan!.blocks[1].id).toBe('02-farewell');
    expect(result.plan!.blocks[2].id).toBe('03-summary');
    expect(result.plan!.mission).toContain('E2E validation');
  });

  it('should generate correct uplan.json structure from parsed plan', () => {
    const planMd = readFileSync(SAMPLE_PLAN_PATH, 'utf-8');
    const result = parseTddabPlan(planMd, 'sample-plan.md');
    const plan = result.plan!;

    const uplanData = {
      mission: plan.mission,
      sourceFile: plan.sourceFile,
      blocks: plan.blocks.map(b => ({
        id: b.id,
        title: b.title,
        intro: b.intro,
        red: b.redTests.map(t => '- ' + t).join('\n'),
        success: b.success.map(s => '- [ ] ' + s).join('\n'),
        planRef: `See ${plan.sourceFile} lines ${b.startLine}-${b.endLine}`,
      })),
    };

    expect(uplanData.blocks).toHaveLength(3);
    expect(uplanData.blocks[0].id).toBe('01-greeting');
    expect(typeof uplanData.blocks[0].red).toBe('string');
    expect(typeof uplanData.blocks[0].success).toBe('string');
    expect(uplanData.blocks[0].red).toContain('- greet("World")');
    expect(uplanData.blocks[0].success).toContain('- [ ] greet function exists');
    expect(uplanData.blocks[0].planRef).toMatch(/^See sample-plan\.md lines \d+-\d+$/);
  });

  it('should execute full pipeline: parse → uplan.json → planexecutor → dry-run', async () => {
    const planMd = readFileSync(SAMPLE_PLAN_PATH, 'utf-8');
    const result = parseTddabPlan(planMd, 'sample-plan.md');
    const plan = result.plan!;

    const toRedKey = (t: string) => t.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 40).trim().replace(/ +/g, '_').toLowerCase();
    const uplanData = {
      mission: plan.mission,
      sourceFile: plan.sourceFile,
      blocks: plan.blocks.map(b => ({
        id: b.id,
        title: b.title,
        intro: b.intro,
        red: b.redTests.map(t => '- ' + t).join('\n'),
        redKeys: b.redTests.map(t => toRedKey(t)),
        success: b.success.map(s => '- [ ] ' + s).join('\n'),
        planRef: `See sample-plan.md lines ${b.startLine}-${b.endLine}`,
      })),
    };
    writeFileSync(resolve(uplanDir, 'uplan.json'), JSON.stringify(uplanData));

    const storage = new FileStorageAdapter(storageDir);
    const fs = new SandboxedFileSystem();
    const vmManager = new VMManager(storage, fs);
    await vmManager.initialize();

    const executorSource = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vmManager.loadProgram('planexecutor', executorSource);
    await vmManager.startExecution('planexecutor', 'e2e-run');

    const prompts: string[] = [];
    let retriedBlock2 = false;
    let next = await vmManager.getNext('e2e-run');

    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      let response = 'done';

      if (next.message!.includes('CROSS-CHECK')) {
        response = '{"t1": true, "t2": true}';
      } else if (next.message!.includes('VERIFY') && next.message!.includes('02-farewell') && !retriedBlock2) {
        response = 'failed';
        retriedBlock2 = true;
      } else if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }

      await vmManager.reportCCResult('e2e-run', response);
      next = await vmManager.getNext('e2e-run');
    }

    expect(next.type).toBe('completed');

    // Verify first prompt has project context + RED phase
    expect(prompts[0]).toContain('PROJECT CONTEXT');
    expect(prompts[0]).toContain('E2E validation');
    expect(prompts[0]).toContain('RED PHASE');

    // Verify 3 blocks × 4 phases + CROSS-CHECK after each passed VERIFY + 1 retry (FIX + RE-VERIFY) + FINAL REVIEW
    expect(prompts.filter(p => p.includes('RED PHASE'))).toHaveLength(3);
    expect(prompts.filter(p => p.includes('GREEN PHASE'))).toHaveLength(3);
    expect(prompts.filter(p => p.includes('COMMIT PHASE'))).toHaveLength(3);
    expect(prompts.filter(p => p.includes('CROSS-CHECK'))).toHaveLength(3);

    // Block 02 has extra FIX + RE-VERIFY
    expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
    expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);

    // FINAL REVIEW at end
    expect(prompts[prompts.length - 1]).toContain('FINAL REVIEW');

    // Verify correct block ordering in prompts
    const redPrompts = prompts.filter(p => p.includes('RED PHASE'));
    expect(redPrompts[0]).toContain('01-greeting');
    expect(redPrompts[1]).toContain('02-farewell');
    expect(redPrompts[2]).toContain('03-summary');

    await vmManager.dispose();
  });

  it('should execute step plan with EXECUTE/VERIFY/COMMIT flow (no RED/GREEN)', async () => {
    const planMd = readFileSync(SAMPLE_STEP_PLAN_PATH, 'utf-8');
    const result = parseTddabPlan(planMd, 'sample-step-plan.md');

    expect(result.valid).toBe(true);
    expect(result.plan!.blocks).toHaveLength(2);
    expect(result.plan!.blocks[0].isAction).toBe(true);

    const toRedKey = (t: string) => t.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 40).trim().replace(/ +/g, '_').toLowerCase();
    const uplanData = {
      type: 'step',
      mission: result.plan!.mission,
      sourceFile: result.plan!.sourceFile,
      blocks: result.plan!.blocks.map(b => ({
        id: b.id,
        title: b.title,
        intro: b.intro,
        red: b.redTests.map(t => '- ' + t).join('\n'),
        redKeys: b.redTests.map(t => toRedKey(t)),
        success: b.success.map(s => '- [ ] ' + s).join('\n'),
        planRef: `See sample-step-plan.md lines ${b.startLine}-${b.endLine}`,
      })),
    };
    writeFileSync(resolve(uplanDir, 'uplan.json'), JSON.stringify(uplanData));

    const storage = new FileStorageAdapter(storageDir);
    const fs = new SandboxedFileSystem();
    const vmManager = new VMManager(storage, fs);
    await vmManager.initialize();

    const executorSource = readFileSync(EXECUTOR_PATH, 'utf-8');
    await vmManager.loadProgram('step-executor', executorSource);
    await vmManager.startExecution('step-executor', 'step-run');

    const prompts: string[] = [];
    let next = await vmManager.getNext('step-run');

    while (next.type === 'waiting') {
      prompts.push(next.message || '');
      let response = 'done';
      if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }
      await vmManager.reportCCResult('step-run', response);
      next = await vmManager.getNext('step-run');
    }

    expect(next.type).toBe('completed');

    expect(prompts[0]).toContain('PROJECT CONTEXT');
    expect(prompts[0]).toContain('EXECUTE');
    expect(prompts.filter(p => p.includes('EXECUTE'))).toHaveLength(2);
    expect(prompts.filter(p => p.includes('VERIFY'))).toHaveLength(2);
    expect(prompts.filter(p => p.includes('COMMIT'))).toHaveLength(2);

    expect(prompts.filter(p => p.includes('RED PHASE'))).toHaveLength(0);
    expect(prompts.filter(p => p.includes('GREEN PHASE'))).toHaveLength(0);
    expect(prompts.filter(p => p.includes('CROSS-CHECK'))).toHaveLength(0);

    const execPrompts = prompts.filter(p => p.includes('EXECUTE'));
    expect(execPrompts[0]).toContain('01-config');
    expect(execPrompts[1]).toContain('02-remove-files');

    expect(prompts[prompts.length - 1]).toContain('FINAL REVIEW');

    await vmManager.dispose();
  });
});
