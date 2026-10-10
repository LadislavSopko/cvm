import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';

const vmManager = vi.hoisted(() => ({
  initialize: vi.fn(),
  dispose: vi.fn(),
  listPrograms: vi.fn(),
  getCurrentExecutionId: vi.fn()
}));

vi.mock('@cvm/vm', () => ({
  SandboxedFileSystem: vi.fn(),
  VMManager: vi.fn().mockImplementation(() => vmManager)
}));

const TOOL_NAMES = [
  'server_info', 'load', 'loadFile', 'start', 'getTask', 'submitTask', 'status', 'list_executions',
  'get_execution', 'set_current', 'delete_execution', 'list_programs', 'delete_program', 'restart', 'parsePlan'
];

describe('MCP tool registration', () => {
  let server: CVMMcpServer;
  let transport: TestTransport;

  beforeEach(async () => {
    vi.clearAllMocks();
    server = new CVMMcpServer('test');
    transport = new TestTransport();
    await server.start(transport);
  });

  afterEach(async () => {
    await server.stop();
  });

  it('tools/list returns the 15 tools and every tool has a non-empty description', async () => {
    const tools = await transport.listTools();
    expect(tools.map(t => t.name).sort()).toEqual([...TOOL_NAMES].sort());
    for (const tool of tools) {
      expect(tool.description?.trim(), tool.name).toBeTruthy();
    }
  });

  it('the getTask and submitTask descriptions mention the getTask submitTask loop', async () => {
    const tools = await transport.listTools();
    for (const name of ['getTask', 'submitTask']) {
      const description = tools.find(t => t.name === name)!.description!;
      expect(description, name).toContain('getTask');
      expect(description, name).toContain('submitTask');
    }
  });

  it('mcp-server.ts no longer calls server.tool(', () => {
    const source = readFileSync(join(__dirname, 'mcp-server.ts'), 'utf8');
    expect(source).not.toContain('server.tool(');
  });

  it('a handler that throws returns isError with Error: and the message through withErrors', async () => {
    expect(typeof (server as any).withErrors).toBe('function');
    vmManager.listPrograms.mockRejectedValue(new Error('storage offline'));
    const result = await transport.callTool('list_programs', {});
    expect('content' in result && result.isError).toBe(true);
    expect('content' in result && result.content[0].text).toBe('Error: storage offline');
  });

  it('a tool needing an execution id without one and without a current execution returns the no-current-execution message', async () => {
    expect(typeof (server as any).resolveExecutionId).toBe('function');
    vmManager.getCurrentExecutionId.mockResolvedValue(null);
    const status = await transport.callTool('status', {});
    expect('content' in status && status.isError).toBe(true);
    expect('content' in status && status.content[0].text).toBe('Error: No current execution set');
    const task = await transport.callTool('getTask', {});
    expect('content' in task && task.content[0].text).toBe('No current execution set. Use list_executions to see available executions.');
  });
});
