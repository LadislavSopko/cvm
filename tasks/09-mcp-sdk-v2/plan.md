# TDDAB Plan: MCP SDK v2, Both Protocol Eras, Release 3.0.0
**Date:** 2026-10-10

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx 21 monorepo at /home/laco/cvm, TypeScript 5.8 strict, ES2022, `moduleResolution: nodenext` (every relative import uses the `.js` extension), Vitest 3, Node 22 (`.nvmrc` = 22; run every command in a shell prepared with `source ~/.nvm/nvm.sh && nvm use 22`). CVM compiles a TypeScript subset to bytecode and runs it in a stack VM driven over MCP: an agent pulls each CC("prompt") with the MCP tool getTask and answers with submitTask.

PACKAGES (own code):
- packages/mcp-server — class CVMMcpServer in src/lib/mcp-server.ts: constructor(version, options: CVMServerOptions { dataDir?, sandboxPaths?, maxInstructions? }) builds one VMManager (from @cvm/vm) and one DeleteConfirmations; private setupTools() registers 15 tools on `this.server` (a McpServer) with `registerTool(name, { description, inputSchema }, this.withErrors(handler))`, input schemas written as raw zod shapes (e.g. `{ programId: z.string(), executionId: z.string(), setCurrent: z.boolean().optional() }`; tools without parameters use `{}`); `start(transport?)` calls `vmManager.initialize()` then `server.connect(transport ?? new StdioServerTransport())`; `stop()` closes the transport and calls `vmManager.dispose()`; `getVMManager()` is used by specs. Tool names: server_info, load, loadFile, start, getTask, submitTask, status, list_executions, get_execution, set_current, delete_execution, list_programs, delete_program, restart, parsePlan.
- packages/mcp-server/src/lib/test-transport.ts — class TestTransport implements Transport: `start()` sends a raw JSON-RPC `initialize` (protocolVersion '2024-11-05') through the server's onmessage handler and awaits the response; `callTool(name, args)` and `listTools()` throw 'Transport not initialized' before that; exports type TextToolResult. Specs mock `@cvm/vm` with `vi.mock('@cvm/vm', () => ({ VMManager: vi.fn()..., SandboxedFileSystem: vi.fn() }))`.
- apps/cvm-server — the published npm package `cvm-server` (currently 2.1.1): src/main.ts creates `new CVMMcpServer(version, { dataDir, sandboxPaths, maxInstructions })` and calls `start()`; vite.config.ts builds a single CJS bundle dist/main.cjs with `rollupOptions.external` listing third-party packages; package.json `dependencies` are what npm installs for users; CHANGELOG.md at apps/cvm-server/CHANGELOG.md (newest entry on top, format `## X.Y.Z (YYYY-MM-DD)` + `### 🚀 Changed` / `### 🩹 Fixed` bullet lists).
- packages/integration — repo-level specs reading files with fs (src/repo-config.spec.ts uses `const root = resolve(__dirname, '../../..')` and `read(path)`).
- test/integration/mcp-test-client.ts — e2e MCP client (run by `bash test/programs/run-all-tests.sh` via `npx tsx mcp-test-client.ts <program> [responses...]`, cwd test/integration); spawns `node ../../apps/cvm-server/dist/main.cjs` with StdioClientTransport.
- .github/workflows/ci.yml (PR main→production gate) and release.yml (push to production → npm Trusted Publishing); every action pinned to a full commit SHA, enforced by repo-config.spec.ts.

MCP SDK v2 (decided, verified on npm and the official migration guides): the monolithic `@modelcontextprotocol/sdk` (v1, currently ^1.32.1) is replaced by split packages, all version 2.3.1, engines node >=20, ESM + CJS builds:
- `@modelcontextprotocol/server` — exports McpServer, Transport (type), CallToolResult, CallToolRequest, InitializeRequest, JSONRPCMessage, Tool (types); subpath `@modelcontextprotocol/server/stdio` exports StdioServerTransport and `serveStdio(factory: (ctx) => McpServer | Promise<McpServer>, options?: { legacy?: 'serve' | 'reject'; transport?: Transport; onerror?: (e: Error) => void }): { close(): Promise<void> }`.
- `@modelcontextprotocol/client` — exports Client and InMemoryTransport (`InMemoryTransport.createLinkedPair()` → [clientSide, serverSide]); subpath `/stdio` exports StdioClientTransport. `new Client(info, { versionNegotiation: { mode: 'auto' } | { mode: { pin: '2026-07-28' } } })`; after connect: `client.getProtocolEra()` → 'legacy' | 'modern', `client.getNegotiatedProtocolVersion()` → e.g. '2025-11-25' or '2026-07-28'.
- v2 requires zod ^4.2.0 (zod 3 compiles but fails at the first tools/list at runtime). Raw zod shapes are deprecated: pass `inputSchema: z.object({...})`; no-parameter tools use `z.object({})`. The zod API used here (z.string, z.boolean, z.number, .optional) is unchanged in zod 4.
- Protocol eras: a server connected with `server.connect(new StdioServerTransport())` speaks only the 2025 era. `serveStdio(factory)` serves BOTH eras on one connection (2025-era `initialize` openings and 2026-07-28 openings); it starts the transport WITHOUT awaiting it and returns the handle synchronously; it may call the factory MORE THAN ONCE per connection (a probe instance can be discarded), so the factory must build a fresh McpServer on every call. Verified by a prototype: InMemoryTransport + serveStdio negotiates 2025-11-25 with a default client and 2026-07-28 with a pinned or auto client.
- All v2 packages resolve through the local npm registry proxy (Nexus) and npmjs.

DECISIONS (user): serve both eras with serveStdio; GitHub Actions to v7 (actions/checkout v7 = 3d3c42e5aac5ba805825da76410c181273ba90b1, actions/setup-node v7 = 949feb2413d6458794dcd2491c4babbbce0c15c1; they replace the v4 pins 11d5960a326750d5838078e36cf38b85af677262 and 49933ea5288caeca8642d1e84afbd3f7d6820020); release cvm-server 3.0.0; toolchain majors (TS, Nx, Vitest, Vite, pino) are OUT of scope.

TEST SCOPE: RED/GREEN/FIX run only the spec files being written or touched (`npx nx test PACKAGE -- FILE.spec.ts`); a block's green gate runs the tests of the packages it touches (`npx nx test PACKAGE`); the full suite (`npx nx run-many --target=test --all --skip-nx-cache`) and the e2e suite (`bash test/programs/run-all-tests.sh`, 64 programs) run once at FINAL REVIEW.

COMMANDS: install `npm install` (lockfile must be committed in sync); build `npx nx run-many --target=build --all`; typecheck `npx nx run-many --target=typecheck --all --skip-nx-cache` (ALWAYS without cache); lint `npx nx run-many --target=lint --all` (0 errors; warnings only for no-explicit-any). No code comments unless needed. LSAI (code navigation) needs the defining file opened (lsai_outline) before name-based lookups.
</mission>

<block id="01-sdk-v2-server-and-zod4">
## TDDAB-1: Move the Server to @modelcontextprotocol/server 2.3.1 and zod 4

<intro>
Files: /home/laco/cvm/packages/mcp-server/package.json, /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts, /home/laco/cvm/packages/mcp-server/src/lib/test-transport.ts, /home/laco/cvm/packages/mcp-server/vite.config.ts, /home/laco/cvm/apps/cvm-server/package.json, /home/laco/cvm/apps/cvm-server/vite.config.ts, /home/laco/cvm/package-lock.json, new /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-sdk-v2.spec.ts. No dependencies.

Atomic dependency swap (cannot be split without leaving a non-building state): replace `@modelcontextprotocol/sdk` with `@modelcontextprotocol/server` `^2.3.1` and `zod` `^3.25.64` with `zod` `^4.2.0` in packages/mcp-server/package.json and in the published apps/cvm-server/package.json dependencies; `npm install` (lockfile in sync). Imports: `McpServer`, `CallToolResult`, `Transport` from `@modelcontextprotocol/server`; `StdioServerTransport` from `@modelcontextprotocol/server/stdio`; test-transport.ts types (Transport, JSONRPCMessage, CallToolRequest, CallToolResult, InitializeRequest, Tool) from `@modelcontextprotocol/server`. Every one of the 15 inputSchema raw shapes becomes `z.object({...})` (tools with `{}` become `z.object({})`); field types and optionality unchanged. Bundle externals: packages/mcp-server/vite.config.ts and apps/cvm-server/vite.config.ts replace the `@modelcontextprotocol/sdk` entries with a regex `/^@modelcontextprotocol\//` (covers the `/stdio` subpath). Wire behaviour stays 2025-era (still `server.connect`); all existing mcp-server specs must stay green unchanged.
</intro>

<red>
- test: mcp-server sources and the mcp-server and cvm-server package manifests no longer reference @modelcontextprotocol/sdk
- test: mcp-server and cvm-server manifests depend on @modelcontextprotocol/server ^2.3.1 and zod ^4.2.0
- test: tools/list advertises start with an object input schema requiring programId and executionId and an optional boolean setCurrent
- test: tools/list advertises list_programs with an object input schema without required properties
- test: calling load without source does not reach VMManager.loadProgram and answers an error
</red>

### Implementation
```ts
// mcp-server.ts
import { McpServer, type CallToolResult, type Transport } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod';
this.server.registerTool('start', {
  description: '…unchanged…',
  inputSchema: z.object({ programId: z.string(), executionId: z.string(), setCurrent: z.boolean().optional() })
}, this.withErrors(async ({ programId, executionId, setCurrent = true }) => { /* unchanged */ }));
this.server.registerTool('list_programs', { description: '…', inputSchema: z.object({}) }, this.withErrors(async () => { /* unchanged */ }));

// mcp-server-sdk-v2.spec.ts (VMManager mocked like the other specs, TestTransport)
const tools = await transport.listTools();
const start = tools.find(t => t.name === 'start')!;
expect(start.inputSchema.type).toBe('object');
expect(start.inputSchema.required).toEqual(['programId', 'executionId']);
expect((start.inputSchema.properties as any).setCurrent.type).toBe('boolean');
const listPrograms = tools.find(t => t.name === 'list_programs')!;
expect(listPrograms.inputSchema.required ?? []).toEqual([]);
const result = await transport.callTool('load', { programId: 'p' });
expect(vmManager.loadProgram).not.toHaveBeenCalled();
expect('error' in result || result.isError === true).toBe(true);

// manifest facts (fs, paths from __dirname = packages/mcp-server/src/lib)
const mcpPkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'));
const appPkg = JSON.parse(readFileSync(resolve(__dirname, '../../../../apps/cvm-server/package.json'), 'utf8'));
expect(mcpPkg.dependencies['@modelcontextprotocol/server']).toBe('^2.3.1');
expect(mcpPkg.dependencies.zod).toBe('^4.2.0');
// same for appPkg; and no '@modelcontextprotocol/sdk' key in either, no 'from '@modelcontextprotocol/sdk' in any packages/mcp-server/src file
```

<success>
- [ ] No `@modelcontextprotocol/sdk` left in packages/mcp-server (sources, manifest, vite config) or apps/cvm-server (manifest, vite config); lockfile in sync
- [ ] The 15 tools use `z.object` input schemas; existing mcp-server specs pass unchanged
- [ ] apps/cvm-server dist/main.cjs builds and `require("@modelcontextprotocol/server` appears external (not bundled); started with `node apps/cvm-server/dist/main.cjs </dev/null` it writes 0 bytes to stdout
- [ ] All 5 RED tests pass: npx nx test mcp-server -- mcp-server-sdk-v2.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="02-serve-stdio-both-eras">
## TDDAB-2: Serve Both Protocol Eras Through serveStdio

<intro>
Files: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts, /home/laco/cvm/packages/mcp-server/src/lib/test-transport.ts, /home/laco/cvm/packages/mcp-server/package.json (add dependency `"@cvm/types": "*"` — mcp-server.ts did not import it before; `@cvm/types` is already external in packages/mcp-server/vite.config.ts and referenced in tsconfig.lib.json), /home/laco/cvm/package.json (root devDependencies: add `@modelcontextprotocol/client` `^2.3.1`; `npm install`, lockfile in sync), new /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-eras.spec.ts. Depends on block 01.

CVMMcpServer no longer owns a single McpServer: `private buildServer(): McpServer` creates a fresh `new McpServer({ name: 'cvm-server', version: this.version }, { capabilities: { tools: {} } })`, calls `this.setupTools(server)` (setupTools now takes the server as a parameter; withErrors / resolveExecutionId / VMManager / DeleteConfirmations / dataDir stay instance members, so every connection instance shares them) and returns it. `start(transport?)`: `await this.vmManager.initialize()` then `this.handle = serveStdio(() => this.buildServer(), { transport, onerror: e => logger.error(...) })` (transport undefined → real stdio). `stop()`: `await this.handle?.close(); this.handle = undefined; await this.vmManager.dispose()`. Because serveStdio starts the transport without awaiting it, TestTransport keeps its start promise: `start()` assigns `this.ready = this.initialize()` and returns it; `callTool` and `listTools` first `await this.ready` (so specs that call them right after `server.start(transport)` keep working). The old `transport` field and `server` field are removed.
</intro>

<red>
- test: a default client connected through start with an in-memory transport negotiates the 2025 era and lists the 15 tools
- test: a client pinned to protocol 2026-07-28 negotiates the modern era, lists the 15 tools and calls server_info
- test: an auto-negotiating client ends on the modern era and calls list_programs
- test: a delete token issued on one connection is accepted on a later connection of the same server because state is shared
- test: VMManager is constructed once per CVMMcpServer however many connections are served
- test: after stop the client can no longer list tools
</red>

### Implementation
```ts
// mcp-server.ts
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { logger } from '@cvm/types';
private handle?: { close(): Promise<void> };
private buildServer(): McpServer {
  const server = new McpServer({ name: 'cvm-server', version: this.version }, { capabilities: { tools: {} } });
  this.setupTools(server);
  return server;
}
async start(transport?: Transport): Promise<void> {
  await this.vmManager.initialize();
  this.handle = serveStdio(() => this.buildServer(), { transport, onerror: error => logger.error({ err: error }, 'MCP transport error') });
}
async stop(): Promise<void> {
  await this.handle?.close();
  this.handle = undefined;
  await this.vmManager.dispose();
}

// test-transport.ts
private ready?: Promise<void>;
async start(): Promise<void> { this.ready = this.initialize(); return this.ready; }
async callTool(name: string, args: any) { await this.ready; /* unchanged */ }
async listTools() { await this.ready; /* unchanged */ }

// mcp-server-eras.spec.ts (vi.mock('@cvm/vm') with VMManager + SandboxedFileSystem mocks)
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
async function connect(server: CVMMcpServer, options?: object) {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.start(serverSide);
  const client = new Client({ name: 'era-test', version: '1.0.0' }, options);
  await client.connect(clientSide);
  return client;
}
const legacy = await connect(server);
expect(legacy.getProtocolEra()).toBe('legacy');
expect((await legacy.listTools()).tools).toHaveLength(15);
const modern = await connect(server, { versionNegotiation: { mode: { pin: '2026-07-28' } } });
expect(modern.getProtocolEra()).toBe('modern');
expect(modern.getNegotiatedProtocolVersion()).toBe('2026-07-28');
const info = await modern.callTool({ name: 'server_info', arguments: {} });
// shared state: issue a delete token on connection A, stop A's client, connect B, confirm with the same token → VMManager.deleteExecution called once
// VMManager constructor mock called exactly once for one CVMMcpServer serving 2 connections
// after server.stop(): await expect(client.listTools()).rejects.toThrow()
```

<success>
- [ ] CVMMcpServer serves through serveStdio with a fresh McpServer per factory call and shared VMManager / DeleteConfirmations
- [ ] All existing mcp-server specs (TestTransport, 2025 era) pass unchanged in their assertions
- [ ] All 6 RED tests pass: npx nx test mcp-server -- mcp-server-eras.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="03-e2e-client-v2-auto">
## TDDAB-3: E2E Client on @modelcontextprotocol/client with Automatic Era Negotiation

<intro>
Files: /home/laco/cvm/test/integration/mcp-test-client.ts, /home/laco/cvm/packages/integration/src/repo-config.spec.ts. Depends on blocks 01 and 02 (root devDependency `@modelcontextprotocol/client` added in block 02).

The e2e client imports `Client` from `@modelcontextprotocol/client` and `StdioClientTransport` from `@modelcontextprotocol/client/stdio`, and creates the client with `{ versionNegotiation: { mode: 'auto' } }` so the whole e2e suite exercises the 2026-07-28 path over real stdio (the SDK probes on a short-lived sibling process). After connect it prints `✓ Protocol era: <era> (<version>)` so the log shows the negotiated era. The 2025 era stays covered by the mcp-server specs (TestTransport and the legacy era test of block 02). No `@modelcontextprotocol/sdk` may remain anywhere in the repository manifests.
</intro>

<red>
- test: mcp-test-client.ts imports Client from @modelcontextprotocol/client and StdioClientTransport from @modelcontextprotocol/client/stdio
- test: mcp-test-client.ts creates the client with versionNegotiation mode auto
- test: no package.json in the repository declares @modelcontextprotocol/sdk and the root declares @modelcontextprotocol/client ^2.3.1
</red>

### Implementation
```ts
// mcp-test-client.ts
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
this.client = new Client({ name: 'cvm-test-client', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
async connect() {
  await this.client.connect(this.transport);
  console.log(`✓ Connected to CVM server\n✓ Protocol era: ${this.client.getProtocolEra()} (${this.client.getNegotiatedProtocolVersion()})\n`);
}

// repo-config.spec.ts
const client = read('test/integration/mcp-test-client.ts');
expect(client).toContain("from '@modelcontextprotocol/client'");
expect(client).toContain("from '@modelcontextprotocol/client/stdio'");
expect(client).toMatch(/versionNegotiation:\s*\{\s*mode:\s*'auto'\s*\}/);
for (const manifest of ['package.json', 'packages/mcp-server/package.json', 'apps/cvm-server/package.json', 'packages/integration/package.json', 'packages/vm/package.json', 'packages/parser/package.json', 'packages/storage/package.json', 'packages/types/package.json']) {
  expect(read(manifest), manifest).not.toContain('@modelcontextprotocol/sdk');
}
expect(JSON.parse(read('package.json')).devDependencies['@modelcontextprotocol/client']).toBe('^2.3.1');
```

<success>
- [ ] One e2e program run (`cd test/integration && npx tsx mcp-test-client.ts ../programs/01-basics/return-types.ts`) prints `Protocol era: modern (2026-07-28)` and exits 0
- [ ] All 3 RED tests pass: npx nx test integration -- repo-config.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="04-release-3-0-0">
## TDDAB-4: Release cvm-server 3.0.0 with Actions v7

<intro>
Files: /home/laco/cvm/apps/cvm-server/package.json (version), /home/laco/cvm/apps/cvm-server/CHANGELOG.md, /home/laco/cvm/.github/workflows/ci.yml, /home/laco/cvm/.github/workflows/release.yml, /home/laco/cvm/packages/integration/src/repo-config.spec.ts. Depends on blocks 01-03.

Version `3.0.0`. CHANGELOG entry on top: `## 3.0.0 (2026-10-10)` with a `### 🚀 Changed` list: MCP SDK v2 (`@modelcontextprotocol/server` 2.3.1 replaces `@modelcontextprotocol/sdk`), zod 4, serves both protocol eras over stdio (2025-11-25 and 2026-07-28) via `serveStdio`, tool input schemas as zod objects, non-JSON stdout lines no longer break the stdio transport (SDK behaviour). Workflows: replace `actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4` with `actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7` and `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4` with `actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7` in both files (all other workflow lines unchanged). Publishing happens later through the PR main→production (CD), not in this block.
</intro>

<red>
- test: apps/cvm-server/package.json version is 3.0.0
- test: the CHANGELOG starts with a 3.0.0 entry mentioning @modelcontextprotocol/server, zod 4 and protocol 2026-07-28
- test: ci.yml and release.yml use the v7 commit shas of actions/checkout and actions/setup-node and no v4 sha remains
</red>

### Implementation
```ts
// repo-config.spec.ts
expect(JSON.parse(read('apps/cvm-server/package.json')).version).toBe('3.0.0');
const changelog = read('apps/cvm-server/CHANGELOG.md');
expect(changelog.startsWith('## 3.0.0')).toBe(true);
const entry = changelog.split('\n## ')[0];
for (const term of ['@modelcontextprotocol/server', 'zod 4', '2026-07-28']) expect(entry).toContain(term);
for (const file of ['ci.yml', 'release.yml']) {
  const wf = read(`.github/workflows/${file}`);
  expect(wf).toContain('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1');
  expect(wf).toContain('actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1');
  expect(wf).not.toMatch(/11d5960a326750d5838078e36cf38b85af677262|49933ea5288caeca8642d1e84afbd3f7d6820020/);
}
```

<success>
- [ ] Version 3.0.0 and CHANGELOG entry present; workflows pinned to v7 shas and still accepted by actionlint
- [ ] All 3 RED tests pass: npx nx test integration -- repo-config.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

## Execution Order
01-sdk-v2-server-and-zod4   → no dependencies
02-serve-stdio-both-eras    → depends on 01
03-e2e-client-v2-auto       → depends on 01, 02
04-release-3-0-0            → depends on 01, 02, 03
