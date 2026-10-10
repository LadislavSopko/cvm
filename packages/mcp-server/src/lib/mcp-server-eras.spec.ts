import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { VMManager } from '@cvm/vm';
import { CVMMcpServer } from './mcp-server.js';

const vmManager = vi.hoisted(() => ({
  initialize: vi.fn(),
  dispose: vi.fn(),
  listPrograms: vi.fn(),
  listExecutions: vi.fn(),
  deleteExecution: vi.fn(),
  getCurrentExecutionId: vi.fn()
}));

vi.mock('@cvm/vm', () => ({
  SandboxedFileSystem: vi.fn(),
  VMManager: vi.fn().mockImplementation(() => vmManager)
}));

type ClientOptions = ConstructorParameters<typeof Client>[1];

const textOf = (result: unknown) => (result as { content: Array<{ text: string }> }).content[0].text;

describe('CVMMcpServer protocol eras', () => {
  let server: CVMMcpServer;
  const clients: Client[] = [];

  async function connect(options?: ClientOptions): Promise<Client> {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.start(serverSide);
    const client = new Client({ name: 'era-test', version: '1.0.0' }, options);
    await client.connect(clientSide);
    clients.push(client);
    return client;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vmManager.listPrograms.mockResolvedValue([]);
    vmManager.listExecutions.mockResolvedValue([]);
    server = new CVMMcpServer('test');
  });

  afterEach(async () => {
    await Promise.all(clients.splice(0).map(client => client.close().catch(() => undefined)));
    await server.stop();
  });

  it('a default client connected through start with an in-memory transport negotiates the 2025 era and lists the 15 tools', async () => {
    const client = await connect();
    expect(client.getProtocolEra()).toBe('legacy');
    expect((await client.listTools()).tools).toHaveLength(15);
  });

  it('a client pinned to protocol 2026-07-28 negotiates the modern era, lists the 15 tools and calls server_info', async () => {
    const client = await connect({ versionNegotiation: { mode: { pin: '2026-07-28' } } });
    expect(client.getProtocolEra()).toBe('modern');
    expect(client.getNegotiatedProtocolVersion()).toBe('2026-07-28');
    expect((await client.listTools()).tools).toHaveLength(15);
    const info = JSON.parse(textOf(await client.callTool({ name: 'server_info', arguments: {} })));
    expect(info).toMatchObject({ name: 'cvm-server', version: 'test', programs: 0, executions: 0 });
  });

  it('an auto-negotiating client ends on the modern era and calls list_programs', async () => {
    const client = await connect({ versionNegotiation: { mode: 'auto' } });
    expect(client.getProtocolEra()).toBe('modern');
    expect(textOf(await client.callTool({ name: 'list_programs', arguments: {} }))).toBe('No programs loaded');
  });

  it('a delete token issued on one connection is accepted on a later connection of the same server because state is shared', async () => {
    const first = await connect();
    const { token } = JSON.parse(textOf(await first.callTool({ name: 'delete_execution', arguments: { executionId: 'exec-1' } })));
    await first.close();
    const second = await connect({ versionNegotiation: { mode: 'auto' } });
    const deleted = await second.callTool({ name: 'delete_execution', arguments: { executionId: 'exec-1', confirmToken: token } });
    expect(textOf(deleted)).toBe('Execution deleted: exec-1');
    expect(vmManager.deleteExecution).toHaveBeenCalledTimes(1);
  });

  it('VMManager is constructed once per CVMMcpServer however many connections are served', async () => {
    const constructed = vi.mocked(VMManager).mock.calls.length;
    await connect();
    await connect({ versionNegotiation: { mode: 'auto' } });
    expect(vi.mocked(VMManager).mock.calls.length).toBe(constructed);
  });

  it('after stop the client can no longer list tools', async () => {
    const client = await connect();
    await server.stop();
    await expect(client.listTools()).rejects.toThrow();
  });

  it('stop closes every connection started on the server', async () => {
    const first = await connect();
    const second = await connect({ versionNegotiation: { mode: 'auto' } });
    await server.stop();
    await expect(first.listTools()).rejects.toThrow();
    await expect(second.listTools()).rejects.toThrow();
  });
});
