import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { CVMMcpServer } from './mcp-server.js';
import { TestTransport } from './test-transport.js';

const vmManager = vi.hoisted(() => ({
  initialize: vi.fn(),
  dispose: vi.fn(),
  loadProgram: vi.fn()
}));

vi.mock('@cvm/vm', () => ({
  SandboxedFileSystem: vi.fn(),
  VMManager: vi.fn().mockImplementation(() => vmManager)
}));

const packageDir = resolve(__dirname, '../..');
const appDir = resolve(__dirname, '../../../../apps/cvm-server');
const manifest = (dir: string) => JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? sourceFiles(join(dir, entry.name)) : entry.name.endsWith('.ts') ? [join(dir, entry.name)] : []
  );
}

describe('MCP SDK v2 server surface', () => {
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

  it('mcp-server sources and the mcp-server and cvm-server package manifests no longer reference @modelcontextprotocol/sdk', () => {
    const offenders = sourceFiles(join(packageDir, 'src'))
      .filter(file => file !== __filename)
      .filter(file => readFileSync(file, 'utf8').includes("from '@modelcontextprotocol/sdk"));
    expect(offenders).toEqual([]);
    for (const dir of [packageDir, appDir]) {
      expect(readFileSync(join(dir, 'package.json'), 'utf8'), dir).not.toContain('@modelcontextprotocol/sdk');
    }
  });

  it('mcp-server and cvm-server manifests depend on @modelcontextprotocol/server ^2.3.1 and zod ^4.2.0', () => {
    for (const dir of [packageDir, appDir]) {
      const dependencies = manifest(dir).dependencies;
      expect(dependencies['@modelcontextprotocol/server'], dir).toBe('^2.3.1');
      expect(dependencies.zod, dir).toBe('^4.2.0');
    }
  });

  it('tools/list advertises start with an object input schema requiring programId and executionId and an optional boolean setCurrent', async () => {
    const tools = await transport.listTools();
    const start = tools.find(tool => tool.name === 'start')!;
    expect(start.inputSchema.type).toBe('object');
    expect(start.inputSchema.required).toEqual(['programId', 'executionId']);
    expect((start.inputSchema.properties as Record<string, { type: string }>).setCurrent.type).toBe('boolean');
  });

  it('tools/list advertises list_programs with an object input schema without required properties', async () => {
    const tools = await transport.listTools();
    const listPrograms = tools.find(tool => tool.name === 'list_programs')!;
    expect(listPrograms.inputSchema.type).toBe('object');
    expect(listPrograms.inputSchema.required ?? []).toEqual([]);
  });

  it('calling load without source does not reach VMManager.loadProgram and answers an error', async () => {
    const result = await transport.callTool('load', { programId: 'p' });
    expect(vmManager.loadProgram).not.toHaveBeenCalled();
    expect('error' in result || result.isError === true).toBe(true);
  });
});
