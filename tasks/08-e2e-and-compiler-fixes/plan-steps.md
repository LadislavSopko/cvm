# Step Plan: E2E Programs, Release Hygiene and 2.1.1
**Date:** 2026-10-09

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx monorepo at /home/laco/cvm. CVM programs are a TypeScript subset: only main(), var/let/const, if/while/for/for-of/for-in, arrays, objects, string methods, fs.readFile/writeFile/listFiles, CC(prompt); NO user functions, NO try/catch, NO Math.* and NO Date.* (they are now compile errors instead of being silently dropped).

PRECONDITION: the TDDAB plan tasks/08-e2e-and-compiler-fixes/plan.md is fully executed (compiler reports unsupported constructs, break in for-of/for-in fixed, slice for strings/arrays fixed, e2e client exits 1 on any failure and supports --expect-error=<text>).

E2E suite: from /home/laco/cvm run `bash test/programs/run-all-tests.sh` (it rebuilds; each program runs through test/integration/mcp-test-client.ts against apps/cvm-server/dist/main.cjs; PASSED/FAILED now reflect the client exit code). Single program: `cd test/integration && npx tsx mcp-test-client.ts ../programs/<path>.ts [responses...]`.

Release files: /home/laco/cvm/apps/cvm-server/package.json (version, bin), /home/laco/cvm/apps/cvm-server/CHANGELOG.md (newest on top, "## X.Y.Z (YYYY-MM-DD)", sections "### 🚀 Changed" / "### 🩹 Fixed"). Publishing to npm is done BY THE USER by hand (npx nx run cvm-server:publish --otp=…), then the user invalidates the Nexus npm-proxy cache; NOT part of this plan.

Commands: npx nx run-many --target=build --all ; npx nx run-many --target=typecheck --all ; npx nx run-many --target=test --all ; lint n/a. Commits: conventional, no emojis.
</mission>

<block id="01-rewrite-invalid-e2e-programs">
## Step 1: Rewrite the Two Invalid E2E Programs

<intro>
Precondition: plan.md executed. Files: /home/laco/cvm/test/programs/03-control-flow/block-scoping.ts and /home/laco/cvm/test/programs/06-file-system/file-persistence.ts (and their run_test lines in /home/laco/cvm/test/programs/run-all-tests.sh only if the CC responses change).
block-scoping.ts uses try/catch (unsupported) to "prove" block scoping; CVM variables are function-scoped. Rewrite it to document CVM's real behaviour with plain console.log lines: outer variable modified inside if-block is visible after; a let declared inside an if-block and a for-loop counter are still visible after the block (print their values); nested blocks see outer variables. Header comment states CVM uses function-level scope.
file-persistence.ts uses Math.min and Date.now (unsupported). Replace `Math.min(startIdx + 3, files.length)` with an if/else computing the same value, and `timestamp: Date.now()` with `step: i + 1`. It is also not repeatable: at the end it writes "{}" to ./tmp/cvm-state.json, and the next run parses it into a state without filesProcessed (startIdx undefined). Treat a parsed state whose filesProcessed is undefined like no state (initialize { filesProcessed: 0, totalSize: 0, history: [] }). Its run_test line in run-all-tests.sh has NO CC responses although the program asks up to 4 CCs (at most 3 file summaries per run + 1 overview; ./ in test/integration has 3+ .ts files): change it to
run_test "../programs/06-file-system/file-persistence.ts" "summary 1" "summary 2" "summary 3" "overview"
(4 responses cover any starting state; unused responses are ignored by the client).
</intro>

<actions>
- action: Rewrite test/programs/03-control-flow/block-scoping.ts without try/catch, documenting function-level scope with explicit console.log output
- action: Rewrite test/programs/06-file-system/file-persistence.ts replacing Math.min with if/else and Date.now with a step counter, and treating a state without filesProcessed as fresh
- action: Give the file-persistence run_test line in test/programs/run-all-tests.sh the 4 CC responses "summary 1" "summary 2" "summary 3" "overview"
- action: Run both programs with the e2e client and confirm exit code 0 and expected output
</actions>

<success>
- [x] block-scoping.ts compiles (no try/catch) and the client exits 0 with the scoping lines printed
- [x] file-persistence.ts compiles without errors (no Math/Date) and the client exits 0 with the 4 responses from run-all-tests.sh, on two consecutive runs
- [x] grep finds no "try {", "Math." or "Date." in these two files
</success>
</block>

<block id="02-release-hygiene">
## Step 2: Remove Stale Artifacts and Fix the bin Field

<intro>
Independent of step 1. /home/laco/cvm/apps/cvm-server/main.cjs (55 KB, an old build committed long ago; bin/cvm-server.cjs requires ../main.cjs, so running from the source tree loads it; it also pollutes code navigation) and the TypeScript build-info files tracked in git (today: tsconfig.tsbuildinfo, apps/cvm-server/tsconfig.tsbuildinfo, packages/integration/tsconfig.tsbuildinfo, packages/storage/tsconfig.tsbuildinfo — list them with git ls-files '*tsbuildinfo') are build artifacts. The published package is built into apps/cvm-server/dist (vite copies package.json, bin, programs; main.cjs is emitted there), so the root copies are not needed. npm publish warns `"bin[cvm-server]" script name was cleaned` because bin is "./bin/cvm-server.cjs".
</intro>

<actions>
- action: git rm --cached apps/cvm-server/main.cjs and every file listed by git ls-files '*tsbuildinfo', delete apps/cvm-server/main.cjs, and add apps/cvm-server/main.cjs and **/tsconfig.tsbuildinfo to the repository .gitignore
- action: In apps/cvm-server/package.json set "bin": { "cvm-server": "bin/cvm-server.cjs" }
- action: Rebuild and run `cd apps/cvm-server/dist && npm pack --dry-run` to confirm the tarball still contains bin/cvm-server.cjs, main.cjs, programs/planexecutor.ts and no bin warning
</actions>

<success>
- [x] git ls-files no longer lists apps/cvm-server/main.cjs or any tsconfig.tsbuildinfo, and they are ignored
- [x] apps/cvm-server/package.json bin is "bin/cvm-server.cjs"
- [x] npm pack --dry-run in apps/cvm-server/dist lists bin/cvm-server.cjs, main.cjs, programs/planexecutor.ts and prints no "script name was cleaned" warning
- [x] npx nx run-many --target=build --all passes
</success>
</block>

<block id="03-truthful-e2e-run-and-release">
## Step 3: Full Truthful E2E Run and cvm-server 2.1.1

<intro>
Precondition: steps 1-2. This is the end-of-plan FULL tier: run the whole Nx suite and the whole e2e program suite once. Then bump apps/cvm-server/package.json 2.1.0 → 2.1.1 and add the CHANGELOG entry "## 2.1.1 (DATE)" with "### 🩹 Fixed": compiler reports unsupported constructs (Math.*, Date.*, unsupported method calls, computed property names, compound assignment to array elements, unsupported loop variable declarations) instead of silently dropping statements, and reports unpatched jumps; break inside for-of / for-in no longer fails with "ITER_END: No active iterator"; slice works with one argument and on arrays; e2e client exit code reflects load/start/execution failures and supports --expect-error; packaging: bin field fixed, stale build artifacts removed. Publishing is done by the user.
</intro>

<actions>
- action: Run npx nx run-many --target=build --all, npx nx run-many --target=typecheck --all and npx nx run-many --target=test --all
- action: Run bash test/programs/run-all-tests.sh and confirm Failed 0 with the truthful client
- action: Bump apps/cvm-server/package.json to 2.1.1 and add the 2.1.1 CHANGELOG entry
</actions>

<success>
- [x] Build, typecheck and the full Nx test suite pass
- [x] run-all-tests.sh reports Failed: 0 and every program's client run exited 0 (the two regex demos via --expect-error)
- [x] apps/cvm-server/package.json is 2.1.1 and CHANGELOG.md top entry is 2.1.1 with the Fixed items
- [x] Nothing was published (npm latest still 2.1.0)
</success>
</block>

## Execution Order
01-rewrite-invalid-e2e-programs → after plan.md
02-release-hygiene              → independent
03-truthful-e2e-run-and-release → after 01 and 02
