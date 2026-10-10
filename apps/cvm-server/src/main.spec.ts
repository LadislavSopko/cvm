import { describe, it, expect, vi } from 'vitest';

const created = vi.hoisted(() => [] as unknown[][]);

vi.mock('@cvm/mcp-server', () => ({
  CVMMcpServer: vi.fn().mockImplementation((...args: unknown[]) => {
    created.push(args);
    return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined) };
  })
}));

describe('main', () => {
  it('main passes the loaded config to CVMMcpServer', async () => {
    process.env.CVM_DATA_DIR = '/tmp/main-data';
    process.env.CVM_SANDBOX_PATHS = '/tmp/main-sandbox';
    await import('./main.js');
    await vi.waitFor(() => expect(created).toHaveLength(1));
    expect(created[0][1]).toEqual(expect.objectContaining({
      dataDir: '/tmp/main-data',
      sandboxPaths: ['/tmp/main-sandbox']
    }));
  });
});
