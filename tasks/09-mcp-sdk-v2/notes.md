# Feature: 09-mcp-sdk-v2

## Requirements (from user)
- Update the MCP SDK (@modelcontextprotocol/sdk) to v2 (the "new world"; check what changed, e.g. sessions).
- Update GitHub Actions to v5 (actions/checkout, actions/setup-node; Node 20 deprecation warning on runners), in this same feature.

## Analysis

### What "SDK v2" is (verified 2026-10-10 on npmjs + official repo docs)
- v1 `@modelcontextprotocol/sdk` stays at 1.32.1 (`latest`). v2 is a SPLIT set of packages, all 2.3.1 (2.0.0 released 2026-07-27):
  `@modelcontextprotocol/server`, `/client`, `/core` (public zod schemas), `/node`, `/express`, `/hono`, `/fastify` (HTTP adapters). `core-internal` is private.
- engines node >=20 (we already require 22). ESM + CJS builds (our app bundle is CJS: OK).
- deps: `zod ^4.2.0` (server/core/client). **zod 3 is NOT supported**: with a zod-3 range the code typechecks and the server starts, but the first `tools/list` answers an error (silent runtime failure). → zod must go to ^4.2 (latest 4.6.5).
- Official guides: docs/migration/upgrade-to-v2.md (SDK surface) + support-2026-07-28.md (new protocol revision). Codemod: `npx @modelcontextprotocol/codemod@latest v1-to-v2 .` (2.3.1).

### Two separate layers
1. **SDK surface v1→v2** (mechanical): import paths, `server.tool()` removed (we already use `registerTool` since R14), raw zod shapes deprecated → `inputSchema: z.object({...})`, stdio transports under `./stdio` subpath.
2. **Protocol revision 2026-07-28** ("new world", opt-in, NOT automatic): per-request `_meta` envelope instead of initialize-scoped identity, no sessions on HTTP (`createMcpHandler`), `server/discover` probe, multi-round-trip `inputRequired(...)` instead of server→client requests, `subscriptions/listen` instead of unsolicited list_changed.
   - "Nothing in v2 puts a 2026-07-28 byte on the wire by default": `server.connect(new StdioServerTransport())` keeps speaking 2025-era exactly as today.
   - stdio opt-in: `serveStdio(() => buildServer(), { transport? })` from `@modelcontextprotocol/server/stdio` → serves BOTH eras (legacy 'serve' default), one factory instance pinned per connection; `transport` option allows injecting our TestTransport.
   - CVM uses only tools over stdio: no sampling/elicitation/roots/resources/prompts/notifications/HTTP → the 2026 features that need redesign (requestState, inputRequired, subscriptions) do not apply. Our state lives in storage (.cvm), not in sessions; DeleteConfirmations is in-memory per server instance = per stdio connection (OK).

### Our SDK surface (4 places)
- packages/mcp-server/src/lib/mcp-server.ts: McpServer, StdioServerTransport, Transport, CallToolResult; zod shapes in 15 registerTool calls.
- packages/mcp-server/src/lib/test-transport.ts: Transport, JSONRPCMessage, CallToolRequest, CallToolResult, InitializeRequest, Tool (all exported by `@modelcontextprotocol/server` 2.3.1; Transport interface unchanged).
- test/integration/mcp-test-client.ts: Client, StdioClientTransport → `@modelcontextprotocol/client` + `/client/stdio`.
- package.json (mcp-server, apps/cvm-server deps; root for client), vite externals (mcp-server, apps/cvm-server) list `@modelcontextprotocol/sdk*`.
- zod imported only in mcp-server.ts (z.string/z.boolean/.optional → same API in zod 4).

### Behavioural changes that touch us
- stdio: non-JSON stdout lines are now SKIPPED (v1 broke the transport) — hardens the stdout-logging issue found in R15; 10 MB max message buffer (default).
- Unknown tool / invalid params → JSON-RPC error (-32602) instead of isError result; "MCP error <code>:" prefix gone. Our specs do not depend on these (checked).
- Eager capability install: `tools` advertised with `listChanged: true`.
- Inbound frames that fail JSON-RPC shape validation are dropped (TestTransport sends well-formed frames).

### GitHub Actions
- Latest: actions/checkout v7.0.1 (v7 sha 3d3c42e), actions/setup-node v7.1.0 (v7 sha 949feb2). v5/v6/v7 all run on node24 (fixes the Node 20 deprecation warning).
- v6 checkout: credentials persisted to a separate file. v7 checkout: blocks fork-PR checkout on pull_request_target/workflow_run (security), ESM. setup-node v6: auto-caching limited to npm; v7: removes the dummy NODE_AUTH_TOKEN export (cleaner for OIDC Trusted Publishing), cache outputs.
- Our workflows use pull_request (not _target), npm cache, OIDC publish → v7 compatible.

## Research
- Codemod exists (official) but our surface is 4 files: manual edit is smaller and reviewable; codemod `--dry-run` can be used as a cross-check.
- Reuse: `serveStdio` (official entry) instead of hand-wiring both eras; `fromJsonSchema` not needed (we author zod).

## Decisions (user, interview 2026-10-10)
- Protocol: `serveStdio` serving BOTH eras (2025 legacy 'serve' + 2026-07-28).
- GitHub Actions: v7 (checkout 3d3c42e, setup-node 949feb2), pinned by SHA.
- Release version: cvm-server 3.0.0.
- Toolchain majors (TS 7, Nx 23, Vitest 5, Vite 8, pino 10): OUT, separate feature. zod 4 IN (required by SDK v2).

## Proposed Solution
1. **zod 4**: `zod ^4.2` (latest 4.6.5) in mcp-server + apps/cvm-server (+ root lock); 15 tool schemas wrapped as `z.object({...})` (raw shapes deprecated in v2).
2. **SDK v2 server**: replace `@modelcontextprotocol/sdk` with `@modelcontextprotocol/server` in mcp-server + apps/cvm-server (deps, vite externals `@modelcontextprotocol/server`, `@modelcontextprotocol/server/stdio`); imports `McpServer`, `CallToolResult`, `Transport`, test-transport types from `@modelcontextprotocol/server`.
3. **Both eras over stdio**: CVMMcpServer builds its McpServer through a factory (`buildServer()` registers the 15 tools); `start(transport?)` → `serveStdio(() => this.buildServer(), { transport })` (TestTransport injected in tests, real stdio in production); `stop()` → handle.close(). Shared state (VMManager, DeleteConfirmations, dataDir) stays on CVMMcpServer, so the factory instance per connection reuses it.
4. **Client side**: test/integration/mcp-test-client.ts → `@modelcontextprotocol/client` + `/client/stdio` (root devDependency); optional era check: one e2e run with `versionNegotiation: { mode: 'auto' }` proving the 2026 path works end to end.
5. **Tests**: existing mcp-server specs stay green unchanged (2025 era via TestTransport); new tests: tools/list works with zod 4 schemas (descriptions + input JSON schema present), a 2026-era client connected through serveStdio lists and calls tools, no `@modelcontextprotocol/sdk` left in sources/manifests.
6. **Actions v7**: ci.yml + release.yml pins → v7 SHAs (repo-config spec keeps enforcing SHA pinning).
7. **Release 3.0.0**: version bump + CHANGELOG (SDK v2, zod 4, protocol 2026-07-28 support); publish via PR main→production (CD).

## Prototype (2026-10-10, isolated scratch dir, official packages 2.3.1)
serveStdio(factory, { transport: InMemoryTransport half from @modelcontextprotocol/client }) + Client:
- default client → era legacy, 2025-11-25; tools/list + callTool OK
- versionNegotiation { mode: { pin: '2026-07-28' } } → era modern, 2026-07-28; OK
- versionNegotiation { mode: 'auto' } → era modern; OK
→ both eras testable in-process. serveStdio starts the transport WITHOUT awaiting it (returns a handle synchronously) and may call the factory more than once per connection (probe instance discarded, then pinned instance) → factory must build a fresh McpServer each call; shared state stays on CVMMcpServer.

## Complexity Assessment
| Task | Score | Plan |
|---|---|---|
| SDK v2 server packages + zod 4 (deps, imports, z.object schemas, bundle externals, test transport types) | 5 | 1 block (atomic dependency swap; split would leave a non-building state) |
| serveStdio both eras (factory, async start/stop, shared state, TestTransport readiness) | 6 | 1 block with in-process era tests (InMemoryTransport) |
| e2e client on @modelcontextprotocol/client with auto negotiation | 3 | 1 block |
| Release 3.0.0 (version, CHANGELOG, Actions v7 pins) | 2 | 1 block (config-only items merged, not separate) |

## TDDAB Rules Applied
1. Bottom-up by layer: dependency/surface swap (package level) → server wiring (serveStdio, era behaviour) → e2e client → release metadata. Each block leaves the repo building and green, revertible alone.
2. RED is the contract of the block's own layer: manifest/source facts and tools/list schema shape for the swap; negotiated era + tool calls through the server's own start() for the wiring; client source facts for the e2e block; version/CHANGELOG/workflow pins for release. No whole-stack e2e assertions inside RED.
3. Self-sufficient blocks: full paths, exact package versions/SHAs, exact API names (serveStdio, McpServerFactory, InMemoryTransport, versionNegotiation) in mission+intro; reference code carries every decision.
4. Non-testable setup (npm install, lockfile, vite externals) is merged into the block that needs it — no setup blocks; config-only items merged into the release block.
5. Every success list ends with the canonical BTLT line and uses block-scoped test commands (npx nx test PACKAGE); full suite + e2e only at FINAL REVIEW.

## Status
- [x] Requirements gathered (user: "study very well what changes; done; interview if needed")
- [x] Code analyzed
- [x] Solution proposed (approved 2026-10-10: serveStdio both eras, Actions v7, release 3.0.0, toolchain out)
- [x] Plan created (plan.md tddab 4 blocks, 19 redKeys; parsePlan valid; j-review-plan x2: logger import + @cvm/types dep; handles set; legacy e2e toggle; actionlint removed)
- [ ] Development done
- [ ] Tested
- [ ] Deployed
