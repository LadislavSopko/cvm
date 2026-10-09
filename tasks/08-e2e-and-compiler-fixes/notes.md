# Feature: 08-e2e-and-compiler-fixes

## Requirements (from user)
- Fix the problems found by the e2e program suite (test/programs/run-all-tests.sh) after feature 07: analyze, fix, verify (user, 2026-10-09)
- Decisions already taken (2026-10-09): develop as separate feature 08; rewrite file-persistence.ts without Math.min/Date.now; rewrite block-scoping.ts without try/catch
- Pre-analysis available in memory-bank/activeContext.md [FEATURE-08-ANALYSIS] (A runner false-pass, B compiler swallows errors, C break in for-of/for-in, D slice(n), E invalid tests)

## Analysis

Baseline: test/programs/run-all-tests.sh reports 64/64 PASSED, but 8 programs end in "Execution error"; the same 8 errors appear identically in all 6 previous runs in test/integration/test-results.log (pre-existing, 0 regressions from 07).

### A. E2E client false pass — test/integration/mcp-test-client.ts
- :79-84 on `Error:` from getTask sets done=true and the process exits 0; load/start results are printed with "✓" even when they are errors (block-scoping: "✓ Program loaded: Error: Compilation failed ...").
- No way to declare an intentional-error test (10-regex/regex-literal-errors.ts, regex-pattern-matching-errors.ts).

### B. Compiler swallows errors — packages/parser/src/lib/compiler.ts:111-120
- catch assumes "Error already added by reportError", but 7 visitor sites `throw new Error(...)` without reportError:
  call-expression.ts:362 (Method call 'X' is not supported), :366 (Unsupported call expression),
  expression-statement.ts:64 (compound assignment to array elements), object-literal.ts:27 (computed property names), :51 (unsupported property type),
  for-of-statement.ts:28, for-in-statement.ts:27 (unsupported loop variable declaration).
- Effect: statement silently dropped (`const endIdx = Math.min(...)` vanishes) or loop half-emitted (`Date.now()` inside for body → JUMP_IF_FALSE -1 → runtime "Invalid jump target: -1"), and compile() returns success:true.
- Unpatched -1 jumps are only debug-logged (compiler.ts:133-142).
- EXPERIMENT (patched catch to record unreported errors, then reverted): parser 241, vm 706, mcp-server 136, integration 37 → all green. Scan of the 64 e2e programs: only 2 swallowed errors, both in file-persistence.ts.

### C. break inside for-of / for-in — "ITER_END: No active iterator"
- break-statement.ts:17-18 emits ITER_END then BREAK; BREAK targets the loop-end address which is itself ITER_END (for-of-statement.ts:82-86, for-in-statement.ts:69-76) → iterator popped twice.
- Verified live: for-of (03-control-flow/for-of-loops.ts) and for-in (probe) both fail at break.
- Existing specs (compiler-break-continue.spec.ts) only check opcodes are emitted, never execute.

### D. slice — compiler/VM contract mismatch
- call-expression.ts:148-170: compiler always pushes 3 values (target, start, end|PUSH_UNDEFINED) and always emits STRING_SLICE.
- handlers/advanced.ts:355-390: handler guesses arity from value types → `s.slice(n)` (end = CVMUndefined) mis-parsed → "STRING_SLICE requires a string".
- Arrays: `arr.slice(a,b)` also fails ("requires a string") — no array slice support at all.
- vm-string-slice.spec.ts uses a 2-push form the compiler never emits.

### E. Invalid test programs
- 03-control-flow/block-scoping.ts uses try/catch (unsupported) → compile error.
- 06-file-system/file-persistence.ts uses Math.min and Date.now (unsupported).
- 10-regex/*-errors.ts are intentional runtime-error demos.

### F. Release hygiene
- npm publish warns `"bin[cvm-server]" script name was cleaned`: apps/cvm-server/package.json bin = "./bin/cvm-server.cjs" (leading ./).
- Stale build artifacts tracked in git: apps/cvm-server/main.cjs (55 KB, old build; bin/cvm-server.cjs require('../main.cjs') would load it from the source tree; polluted LSAI results) and apps/cvm-server/tsconfig.tsbuildinfo.

## Research
- Codebase only (internal compiler/VM): reportError already gives line/column → reuse it at the throw sites; STRING_SPLIT handler shows heap.allocate('array', createCVMArray(...)) for new arrays; isCVMUndefined/isCVMArrayRef helpers exist in @cvm/types.

## Proposed Solution
1. B compiler: the 7 throw sites call context.reportError(node, msg) (precise line/col); safety net in compiler.ts catch records any unreported error at the statement position; an unpatched -1 jump after compilation is a compile error ("internal: unpatched jump").
2. C break: break-statement.ts no longer emits ITER_END (loop end cleans up). Tests EXECUTE break/continue in for-of, for-in, nested for-of, break in inner loop only.
3. D slice: handler always pops 3 (target, start, end); CVMUndefined end = absent; target string → string slice; target array → new heap array with sliced elements; other → error. VM specs updated to the compiler contract.
4. A e2e client: exit 1 on load error / start error / execution error / missing output; flag --expect-error "<substring>" turns an expected runtime error into a pass (exit 0) and a missing/different error into a fail; run-all-tests.sh passes it for the two regex error demos.
5. E tests: rewrite block-scoping.ts (no try/catch; documents CVM function-level scope with explicit output) and file-persistence.ts (no Math.min/Date.now).
6. F hygiene: bin "bin/cvm-server.cjs" (no ./); git rm apps/cvm-server/main.cjs + tsconfig.tsbuildinfo and ignore them.
Order: compiler/VM fixes first (B, C, D), then client (A) so the e2e suite becomes truthful, then tests (E) so it is green, then hygiene (F). Release as cvm-server 2.1.1 (bug fixes).

## Status
- [x] Requirements gathered (user: "decide what is needed")
- [x] Code analyzed
- [ ] Solution proposed
- [ ] Plan created
- [ ] Development done
- [ ] Tested
- [ ] Deployed
