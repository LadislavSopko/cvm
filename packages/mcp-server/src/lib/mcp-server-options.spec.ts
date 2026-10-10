import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';

vi.mock('@cvm/vm', () => ({
  VMManager: vi.fn().mockImplementation(() => ({ initialize: vi.fn(), dispose: vi.fn() })),
  SandboxedFileSystem: vi.fn()
}));

const plan = `<mission>
Mission.
</mission>

<block id="01-one">
## TDDAB-1: One

<intro>
Intro.
</intro>

<red>
- test: one works
</red>

<success>
- [ ] done
</success>
</block>
`;

describe('CVMMcpServer options', () => {
  const previous = process.env['CVM_DATA_DIR'];
  let dir = '';

  afterEach(async () => {
    if (previous === undefined) delete process.env['CVM_DATA_DIR'];
    else process.env['CVM_DATA_DIR'] = previous;
    await rm(dir, { recursive: true, force: true });
  });

  it('CVMMcpServer with explicit dataDir writes uplan.json there regardless of CVM_DATA_DIR', async () => {
    dir = await mkdtemp(join(tmpdir(), 'cvm-options-'));
    const explicit = join(dir, 'explicit');
    const fromEnv = join(dir, 'from-env');
    process.env['CVM_DATA_DIR'] = fromEnv;
    const planPath = join(dir, 'plan.md');
    await writeFile(planPath, plan, 'utf-8');

    const server = new CVMMcpServer('test', { dataDir: explicit });
    const transport = new TestTransport();
    await server.start(transport);
    const result = await transport.callTool('parsePlan', { filePath: planPath });
    await server.stop();

    expect('content' in result && !result.isError).toBe(true);
    expect(existsSync(join(explicit, 'uplan.json'))).toBe(true);
    expect(existsSync(join(fromEnv, 'uplan.json'))).toBe(false);
  });
});
