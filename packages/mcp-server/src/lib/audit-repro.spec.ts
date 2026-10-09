import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { parseTddabPlan } from './tddab-parser.js';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';

vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
    deleteExecution: vi.fn(),
    deleteProgram: vi.fn(),
    getCurrentExecutionId: vi.fn()
  }))
}));

const stepPlan = `# Step Plan: Sample

<mission>
Mission text.
</mission>

<block id="01-first-step">
## Step 1: Remove Legacy Files

<intro>
Intro text.
</intro>

<actions>
- action: delete the files
</actions>

<success>
- [ ] files deleted
</success>
</block>
`;

// Audit 2026-10-09 bug repro. Asserts the CORRECT behaviour and is marked it.fails while
// the bug exists; when fixed, turn it.fails into it.
describe('audit 2026-10-09 repro: step plan block title', () => {
  it.fails('a "## Step N: Title" heading becomes the block title', () => {
    const result = parseTddabPlan(stepPlan, 'plan-steps.md');
    expect(result.valid).toBe(true);
    expect(result.plan!.blocks[0].title).toBe('Remove Legacy Files');
  });

  it('the title is empty today (control: documents the actual behaviour)', () => {
    const result = parseTddabPlan(stepPlan, 'plan-steps.md');
    expect(result.plan!.blocks[0].title).toBe('');
  });
});

describe('audit 2026-10-09 repro: delete_execution confirmation token', () => {
  let server: CVMMcpServer;
  let transport: TestTransport;
  let vmManager: any;

  beforeAll(async () => {
    server = new CVMMcpServer('test');
    vmManager = ((await import('@cvm/vm')).VMManager as any).mock.results[0].value;
    transport = new TestTransport();
    await server.start(transport);
  });

  afterAll(async () => {
    await server.stop();
  });

  it.fails('rejects a token that was never issued by the server', async () => {
    await transport.callTool('delete_execution', { executionId: 'exec-1', confirmToken: 'delete-exec-1-forged' });
    expect(vmManager.deleteExecution).not.toHaveBeenCalled();
  });

  it.fails('delete_program rejects a token that was never issued by the server', async () => {
    await transport.callTool('delete_program', { programId: 'prog-1', confirmToken: 'delete-prog-1-forged' });
    expect(vmManager.deleteProgram).not.toHaveBeenCalled();
  });
});
