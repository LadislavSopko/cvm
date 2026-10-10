# TDDAB Plan: CVM Remediation (A correctness · B simplification · C modernity)
**Date:** 2026-10-10

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx 21 monorepo at /home/laco/cvm, TypeScript 5.8 strict, ES2022, nodenext (every relative import uses the .js extension), Vitest 3. CVM compiles a TypeScript subset (only main(); no user functions, no try/catch, no Math/Date) to bytecode and runs it in a stack VM driven over MCP: an agent pulls each CC("prompt") with the MCP tool getTask and answers with submitTask.

PACKAGES (own code):
- packages/types — OpCode enum (src/lib/types.ts), CVMValue helpers (src/lib/cvm-value.ts: isCVMString, isCVMUndefined, isCVMArrayRef, createCVMArray, createCVMUndefined), pino logger (src/lib/logger.ts).
- packages/parser — compile(source) in src/lib/compiler.ts returns { success, bytecode, errors[{message,line,character}] }; visitors in src/lib/compiler/{statements,expressions}/*.ts receive (node, state, context) with context = { compileStatement, compileExpression, reportError } (reportError records line/column and throws; use `return reportError(...)` for TS narrowing). src/lib/parser.ts (parseProgram) is a second AST pass used only by compile().
- packages/vm — VM (src/lib/vm.ts: execute(bytecode, initialState?, fileSystem?) is SYNCHRONOUS; validateStack() checks handler.stackIn before every handler), handlers in src/lib/handlers/*.ts (OpcodeHandler { stackIn, stackOut, execute(state, instruction) → VMError | undefined }), VMManager (src/lib/vm-manager.ts: getNext executes the VM, reportCCResult resumes it), SandboxedFileSystem (src/lib/file-system.ts).
- packages/storage — StorageAdapter + FileStorageAdapter + StorageFactory.
- packages/mcp-server — CVMMcpServer (src/lib/mcp-server.ts, 15 tools registered with the deprecated server.tool()), plan parser src/lib/tddab-parser.ts, TestTransport (src/lib/test-transport.ts: callTool(name, args) → TextToolResult).
- packages/integration — e2e client outcome logic (src/e2e-outcome.ts).
- apps/cvm-server — entry src/main.ts, config src/config.ts (loadConfig), planexecutor program in programs/planexecutor.ts.
- test/integration/mcp-test-client.ts + test/programs/run-all-tests.sh — e2e program suite (64 programs; the client exit code is truthful).

BUG REPROS: packages/{parser,vm,mcp-server}/src/lib/audit-repro.spec.ts hold `it.fails` tests that assert the CORRECT behaviour of 11 proven bugs (audit tasks/audit-cvm-2026-10-09.md). A block that fixes a bug MUST turn the matching `it.fails(` into `it(` — that is its RED (it fails until GREEN) — and remove the control test that documented the wrong behaviour, if any.

DECISIONS (user, 2026-10-10; study tasks/08-e2e-and-compiler-fixes/study-remediation.md): syntax errors via ts.transpileModule diagnostics and parser.ts removed; `undefined` singleton + structural equality; step-plan titles accepted; deletion keeps a REAL two-step confirmation (single-use server-side nonce with expiry); execution limits = ONLY an instruction budget between two CC() (protects against loops without CC; loops with CC are never limited); stack/output/time limits removed; eslint (flat config) + Node 22; toolchain majors and MCP SDK v2 are OUT of scope (separate feature).

TEST SCOPE (tddab-planner "Test scope tiers"): RED/GREEN/FIX run only the tests being written/touched (npx nx test PACKAGE -- FILE.spec.ts); a block's green gate runs the tests of the packages it touches (npx nx test PACKAGE); the FULL suite (npx nx run-many --target=test --all --skip-nx-cache and bash test/programs/run-all-tests.sh) runs once at FINAL REVIEW.

COMMANDS: build `npx nx run-many --target=build --all`; typecheck `npx nx run-many --target=typecheck --all --skip-nx-cache` (ALWAYS without cache: the cache once hid a failing typecheck); lint: none until block 15, then `npx nx run-many --target=lint --all`. LSAI (code navigation) needs the defining file opened (lsai_outline) before name-based lookups. No code comments unless needed.
</mission>

<files>
- a-correctness.md
- b-simplification.md
- c-modernity.md
</files>
