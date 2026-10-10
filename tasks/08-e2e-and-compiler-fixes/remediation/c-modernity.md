# C — Modernity and Infrastructure

<block id="14-register-tools">
## TDDAB-14: MCP Tools via registerTool with Descriptions and One Error Wrapper

<intro>
Files: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts, /home/laco/cvm/packages/mcp-server/src/lib/test-transport.ts (add listTools()), new /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-tools.spec.ts. Depends on block 12 (constructor options) and block 04 (delete tools).

@modelcontextprotocol/sdk is 1.32.1: every `server.tool()` overload is `@deprecated` ("Use registerTool instead", sdk dist/esm/server/mcp.d.ts). The 15 tools (server_info, load, loadFile, start, getTask, submitTask, status, list_executions, get_execution, set_current, delete_execution, list_programs, delete_program, restart, parsePlan) have NO description, so agents see only names. 14 handlers repeat the same `catch → { content: [Error: msg], isError: true }`, and 6 handlers repeat the "use current execution if no id" lookup (mcp-server.ts:202,256,304,334,371,382). Change: `this.server.registerTool(name, { description, inputSchema }, withErrors(handler))`; helpers `withErrors(fn)` (single catch) and `resolveExecutionId(id?) → string | ToolResult` (single lookup). Descriptions are one or two sentences that state what the tool does and, for getTask/submitTask, the loop protocol (getTask → work → submitTask → getTask until completed). Tool names, input schemas and response texts are unchanged.
</intro>

<red>
- test: tools/list returns the 15 tools and every tool has a non-empty description
- test: the getTask and submitTask descriptions mention the getTask submitTask loop
- test: mcp-server.ts no longer calls server.tool(
- test: a handler that throws returns isError with Error: and the message through withErrors
- test: a tool needing an execution id without one and without a current execution returns the no-current-execution message
</red>

### Implementation
```ts
private withErrors<A>(fn: (args: A) => Promise<CallToolResult>) {
  return async (args: A): Promise<CallToolResult> => {
    try { return await fn(args); }
    catch (error) { return { content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true }; }
  };
}
this.server.registerTool('getTask', {
  description: 'Return the next cognitive task (CC prompt) of the current or given execution, or its completion/error status. Loop: getTask, do the work, submitTask, then getTask again until completed.',
  inputSchema: { executionId: z.string().optional() }
}, this.withErrors(async ({ executionId }) => { /* unchanged body */ }));
```
TestTransport.listTools(): sends `{ method: 'tools/list' }` and returns `result.tools`.

<success>
- [ ] 15 tools registered with registerTool and descriptions; 0 `server.tool(` calls; one catch wrapper; one execution-id resolver
- [ ] All existing mcp-server tests still pass unchanged (same names, schemas, texts)
- [ ] All 5 RED tests pass: npx nx test mcp-server -- mcp-server-tools.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="15-eslint">
## TDDAB-15: ESLint Flat Config with Nx Lint Targets

<intro>
Files: new /home/laco/cvm/eslint.config.mjs, /home/laco/cvm/nx.json (plugins), /home/laco/cvm/package.json (devDependencies), new /home/laco/cvm/packages/integration/src/repo-config.spec.ts, plus whatever source files the linter flags. Independent of 14 (run after it so it lints the final code).

Today there is no lint (audit: no eslint/biome config, no lint target). eslint 9.39.5 and @nx/eslint 21.3.11 are only transitive (via @nx/node 21.3.11). Decision (user): eslint. Add devDependencies `eslint` (^9.39.5), `typescript-eslint` (^8.71.1), `@nx/eslint` (21.3.11, the version already resolved). Root flat config: `js.configs.recommended` + `tseslint.configs.recommended`; rules: `@typescript-eslint/no-unused-vars: ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]`, `@typescript-eslint/no-explicit-any: 'warn'` (48 existing `any` in own src are tracked, not fixed here), `no-unreachable: 'error'`; ignores `**/dist/**`, `**/node_modules/**`, `.nx/**`, `tmp/**`, `test/programs/**`, `.ai-agent/**`, `wwwroot/**`, `docs/**`, `apps/cvm-server/programs/**` (CVM-language programs, not Node code). nx.json: add `{ "plugin": "@nx/eslint/plugin", "options": { "targetName": "lint" } }` so every project gets a `lint` target. Fix every reported ERROR (warnings allowed only for no-explicit-any).
</intro>

<red>
- test: eslint.config.mjs exists and ignores dist node_modules .nx test/programs and apps/cvm-server/programs
- test: nx.json registers @nx/eslint/plugin with targetName lint
- test: package.json devDependencies contain eslint typescript-eslint and @nx/eslint
</red>

### Implementation
repo-config.spec.ts reads the files with fs and asserts the content. The real proof is the green gate: `npx nx run-many --target=lint --all` exits 0.

<success>
- [ ] Every project has a lint target; `npx nx run-many --target=lint --all` exits 0 (no errors)
- [ ] All 3 RED tests pass: npx nx test integration -- repo-config.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="16-node-22">
## TDDAB-16: Node 22 as the Supported Runtime

<intro>
Files: new /home/laco/cvm/.nvmrc, /home/laco/cvm/package.json (engines), /home/laco/cvm/apps/cvm-server/package.json (engines), /home/laco/cvm/packages/integration/src/repo-config.spec.ts, /home/laco/cvm/README.md and /home/laco/cvm/apps/cvm-server/README.md (requirements). Depends on block 15.

Today engines is `>=18.0.0` and the shell default is Node 18.20.8 (end-of-life). Node 22.14.0 is installed via nvm (`~/.nvm/versions/node/v22.14.0`). Decision (user): Node 22. `.nvmrc` = `22`; engines `"node": ">=22"` in the root and in the published apps/cvm-server/package.json. Run the WHOLE gate under Node 22 (`source ~/.nvm/nvm.sh && nvm use 22` in the same shell before each command). Do NOT change the user's global nvm default alias (tell the user to run `nvm alias default 22` themselves if they want it).
</intro>

<red>
- test: .nvmrc pins Node 22
- test: root and apps/cvm-server package.json declare engines node >=22
- test: the test runner itself runs on Node 22 or newer
</red>

### Implementation
The runtime test asserts `Number(process.versions.node.split('.')[0]) >= 22` (it fails under Node 18 — that is the RED).

<success>
- [ ] .nvmrc and engines updated; READMEs state Node 22
- [ ] Build, typecheck, lint and the block-scoped tests pass under Node 22
- [ ] All 3 RED tests pass under Node 22: npx nx test integration -- repo-config.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="17-ci-workflow">
## TDDAB-17: GitHub Actions CI Running the Full Gate and the E2E Suite

<intro>
Files: new /home/laco/cvm/.github/workflows/ci.yml, /home/laco/cvm/test/integration/mcp-test-client.ts (CVM_SANDBOX_PATHS default), /home/laco/cvm/packages/integration/src/e2e-outcome.ts (+ spec), /home/laco/cvm/packages/integration/src/repo-config.spec.ts. Depends on blocks 15 and 16.

There is no CI (audit). Two obstacles verified: (1) the e2e client defaults CVM_SANDBOX_PATHS to the hard-coded `/home/laco/cvm/test/integration` (mcp-test-client.ts:32), which does not exist on a CI runner; (2) package-lock.json has 168 `resolved` URLs on the private proxy `https://nexus.0ics.ai/repository/npm-group/` (876 on registry.npmjs.org). Changes: `defaultSandboxPath(cwd)` in e2e-outcome.ts returns `path.resolve(cwd)` and the client uses it as default (cwd is test/integration when run by run-all-tests.sh); the workflow rewrites the Nexus prefix to `https://registry.npmjs.org/` before `npm ci` (same tarball path layout, integrity hashes unchanged; the committed lockfile and the local Nexus setup stay untouched). Workflow: on push and pull_request; ubuntu-latest; actions/checkout@v4 (submodules: false — the .ai-agent submodule is not needed to build/test); actions/setup-node@v4 with node-version-file .nvmrc and cache npm; steps: rewrite lockfile prefix, `npm ci`, build, typecheck `--skip-nx-cache`, lint, test `--skip-nx-cache`, `bash test/programs/run-all-tests.sh`.
</intro>

<red>
- test: defaultSandboxPath resolves the given working directory
- test: mcp-test-client.ts contains no hard-coded home directory path
- test: ci.yml runs build typecheck lint test with --skip-nx-cache where applicable and the e2e suite
- test: ci.yml uses .nvmrc for the Node version and rewrites the Nexus registry prefix before npm ci
</red>

### Implementation
```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: .nvmrc, cache: npm }
      - run: sed -i 's#https://nexus.0ics.ai/repository/npm-group/#https://registry.npmjs.org/#g' package-lock.json
      - run: npm ci
      - run: npx nx run-many --target=build --all
      - run: npx nx run-many --target=typecheck --all --skip-nx-cache
      - run: npx nx run-many --target=lint --all
      - run: npx nx run-many --target=test --all --skip-nx-cache
      - run: bash test/programs/run-all-tests.sh
```
Local proof (no push needed): run the same commands in a clean shell under Node 22 with the rewritten lockfile in a temporary copy, and confirm all pass. Pushing the branch (which triggers the real CI) happens only at j-close with user approval.

<success>
- [ ] ci.yml present with all gate steps; client sandbox default is cwd-based
- [ ] The CI command sequence passes locally under Node 22
- [ ] All 4 RED tests pass: npx nx test integration -- e2e-outcome.spec.ts repo-config.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

## Execution Order
01-syntax-diagnostics            → none
02-undefined-strict-equality     → none
03-step-plan-titles              → none
04-delete-confirmation-nonce     → none
05-method-dispatch-table         → 01
06-array-aware-methods           → 05 (and 02 for strictEquals)
07-single-slice-implementation   → none
08-runtime-error-helper          → none
09-single-stack-check-and-trace  → 08
10-vm-state-transition           → none
11-dead-code-removal             → 06, 07
12-single-config                 → none
13-instruction-budget            → 12
14-register-tools                → 04, 12
15-eslint                        → 14
16-node-22                       → 15
17-ci-workflow                   → 15, 16
