# TDDAB Plan: Verdict-Gate Contract (robust gate parsing + clean policy)
**Date:** 2026-06-02

<mission>
Refactor the CVM plan-executor gate loops so verdicts are parsed robustly and only terse submissions are accepted. Today the VERIFY/RE-VERIFY gates in test/programs/tddab/planexecutor.ts use exact string match (`=== "failed"`, lines 148 and 92), which is fragile against stochastic model output: a reply like "failed. <explanation>" does NOT equal "failed", so it slips past the fix-loop and a still-broken block proceeds to a false GREEN commit. Replace the match with a MINIMAL inline verdict check: var v = resp.toLowerCase(); var passed = v.startsWith("passed"); loop becomes while (!passed). Any reply not starting with "passed" biases to failed (re-runs, never a false pass). Keep it to two operations only — toLowerCase + startsWith — NO split, NO trim, NO includes: the CVM VM can be unstable on long method chains, and a terse submit makes the rest unnecessary. Tighten the gate prompts to demand terse submissions ("submit ONLY: passed|failed" for gates, "submit ONLY: done" for non-gates) with no invitation to write an essay; the agent reasons in tool calls, the submit carries only the token. Also fix the discarded-return bug at planexecutor.ts:205, where the post-cross-check RE-VERIFY CC asks for passed|failed but its return value is never read, so a still-failing state proceeds to COMMIT.

CONSTRAINTS (verified on the real VM): the CVM VM does NOT support user-defined functions (packages/vm/src/lib/handlers/control.ts:158 'Functions not implemented'; add(2,3) returns undefined). Keep ALL logic inline inside main() — no helper functions. Do NOT use === on the verdict; use startsWith + boolean negation (while (!passed)). Confirmed-working minimal ops on this VM: toLowerCase, startsWith, &&, !. The verdict logic must match benchmark-runner.ts (separate cvm-benchmark-kit repo, owned by ai-agent-builder) 1:1 — both use exactly `v.toLowerCase().startsWith("passed")`.

CLEAN POLICY — scoped to THIS repo's real toolchain: cvm has build, typecheck and test (it has NO linter, so there is NO lint gate — do not invent one). The work must leave the repo at 0 errors / 0 warnings on build + typecheck + test. "Pre-existing" is NOT an exception: if typecheck or a test reports it, it is part of the job and gets fixed at the root. No suppressions: no @ts-ignore, no .skip, no loosened config. Suppressing a warning instead of fixing it fails the block.
</mission>

<block id="01-clean-main">
## TDDAB-1: Clean main — zero typecheck warnings and no timing-out tests
<intro>
Before changing behavior, bring main to 0/0 on the real toolchain (build+typecheck+test; cvm has no linter). Two known violations on main right now: (1) packages/vm/src/lib/vm-manager.ts:386 emits TS6133 "'key' is declared but its value is never read"; (2) packages/vm/src/lib/integration.spec.ts fails with "Hook timed out in 10000ms". Both are pre-existing — under the clean policy that is no excuse. Fix the unused binding at its root (remove it or use it) and fix the hook timeout so the suite is green. No suppression, no .skip, no loosened timeout used as a workaround.
</intro>
<red>
- test: integration.spec.ts completes without "Hook timed out" (it is already failing — make it pass at the root)
- test: workspace typecheck reports zero TS6133 and zero warnings
</red>

### Implementation
- packages/vm/src/lib/vm-manager.ts:386 — remove the unused `key` binding at root (or use it if the loop needs it). Do NOT add `// @ts-ignore` or rename to `_key` as a suppression; delete the dead code.
- packages/vm/src/lib/integration.spec.ts — the failing hook is "Hook timed out in 10000ms". Read the failing beforeAll/afterAll/beforeEach hook, find the unresolved promise or missing await (e.g. a MongoDB/storage connect that never resolves in the test env), and fix the root cause so the hook completes. Do NOT raise the timeout or `.skip` the test as a workaround.
- Verify: `npx nx run-many --target=typecheck --all`, `npx nx test vm`, `npx nx test mcp-server` all green, 0 warnings.

<success>
- [ ] npx nx run-many --target=typecheck --all reports 0 errors and 0 warnings (TS6133 at vm-manager.ts:386 gone, fixed at root not suppressed)
- [ ] packages/vm/src/lib/integration.spec.ts passes with no hook timeout, no .skip, no loosened timeout workaround
- [ ] npx nx test vm and npx nx test mcp-server are fully green
- [ ] no @ts-ignore / eslint-disable / .skip introduced anywhere
</success>
</block>

<block id="02-verdict-inline">
## TDDAB-2: Minimal inline verdict parsing + terse-submit prompts
<intro>
In test/programs/tddab/planexecutor.ts the TDDAB VERIFY loop (line 148, `while (testResult === "failed")`) and the STEP VERIFY loop (line 92, `while (stepResult === "failed")`) use exact string match. Replace each with the minimal inline pattern in a boolean var: var v = resp.toLowerCase(); var passed = v.startsWith("passed"); and turn the loops into while (!passed), re-reading the verdict after each RE-VERIFY CC. Two operations only (toLowerCase + startsWith) — no split/trim/includes, no helper function (VM has none), no ===. Update the submitTest terminator (line 18) so gate prompts end with a terse "submit ONLY one word: passed or failed", and the submitDone terminator so non-gate prompts end with "submit ONLY one word: done". Keep the CHECKLIST/evidence instruction as reasoning the agent does in tool calls, not in the submitted text.
</intro>
<red>
- test: VERIFY gate treats "passed" as pass and exits with no FIX PHASE
- test: VERIFY gate treats a reply starting with "passed" then an essay on later lines as pass
- test: VERIFY gate treats "PASSED" (uppercase) as pass
- test: VERIFY gate treats "failed" as fail and enters exactly one FIX PHASE then one RE-VERIFY
- test: VERIFY gate treats a reply not starting with passed as failed and re-runs
- test: the VERIFY PHASE prompt instructs to submit only the word passed or failed
</red>

### Implementation
In test/programs/tddab/planexecutor.ts (CVM-script — inline only, no helper functions, no ===).

Terminators (line 18 area):
```
var submitTest = " Do all checking in your tool calls. Submit ONLY one word: passed or failed.";
var submitDone = " Submit ONLY one word: done.";
```

TDDAB VERIFY loop (replaces line ~144-165, `var testResult = CC(...); while (testResult === "failed")`):
```
var testResult = CC(verifyPrompt);
var v = testResult.toLowerCase();
var passed = v.startsWith("passed");
while (!passed) {
  CC("FIX PHASE ... " + submitDone);
  testResult = CC("RE-VERIFY ... " + submitTest);
  v = testResult.toLowerCase();
  passed = v.startsWith("passed");
}
```

STEP VERIFY loop (line ~83-109): same pattern with `stepResult`/`stepPassed`.

Notes: two ops only (toLowerCase + startsWith); first-line/essay tolerated because startsWith ignores the tail; uppercase tolerated by toLowerCase; anything not starting with "passed" → loop re-runs (bias to failed). Identical to benchmark-runner.ts.

<success>
- [ ] a "passed" verdict (alone or with trailing explanation lines or uppercase) exits the VERIFY loop with zero FIX PHASE prompts
- [ ] a "failed" verdict produces exactly one FIX PHASE and one RE-VERIFY, then a following "passed" exits
- [ ] a reply not starting with "passed" is treated as failed and re-runs
- [ ] both TDDAB (line 148) and STEP (line 92) loops use `v.toLowerCase().startsWith("passed")`; no ===, no split/trim/includes, no helper functions
- [ ] gate prompts end with "submit ONLY: passed|failed"; non-gate prompts end with "submit ONLY: done"
- [ ] all existing planexecutor.spec.ts tests pass; build + typecheck + test are 0/0
</success>
</block>

<block id="03-fix-crosscheck-reverify">
## TDDAB-3: Wire the post-cross-check RE-VERIFY verdict into the fix loop
<intro>
At planexecutor.ts:205 the RE-VERIFY CC issued after a cross-check fix asks for passed|failed but its return value is discarded — nothing reads it, so even a still-failing block proceeds straight to UPDATE MEMORY BANK and COMMIT. Capture that verdict with the same minimal inline check (v.toLowerCase().startsWith("passed")) and feed it back into the fix loop so a "failed" re-verify triggers another FIX instead of committing broken work. The cross-check-passed path (the common case) must be unchanged.
</intro>
<red>
- test: when cross-check fails and the following RE-VERIFY returns "failed", the executor issues another FIX PHASE and does not reach COMMIT
- test: when cross-check fails and the following RE-VERIFY returns "passed", the executor proceeds to UPDATE MEMORY BANK then COMMIT
- test: when cross-check passes, the prompt sequence is unchanged with no extra RE-VERIFY
</red>

### Implementation
In test/programs/tddab/planexecutor.ts, the `if (crossCheckPassed === false)` branch (line ~195-210). Today the RE-VERIFY there is `CC("RE-VERIFY ... (after cross-check fix) ...")` with its return value discarded. Capture and gate it with the same minimal parser, looping until passed:
```
if (crossCheckPassed === false) {
  CC("FIX PHASE ... (cross-check fix) ... " + submitDone);
  var ccResult = CC("RE-VERIFY ... (after cross-check fix) ... " + submitTest);
  var ccPassed = ccResult.toLowerCase().startsWith("passed");
  while (!ccPassed) {
    CC("FIX PHASE ... (cross-check fix) ... " + submitDone);
    ccResult = CC("RE-VERIFY ... (after cross-check fix) ... " + submitTest);
    ccPassed = ccResult.toLowerCase().startsWith("passed");
  }
}
```
The cross-check-passed path (crossCheckPassed === true) is untouched — no extra prompts, regression-safe.

<success>
- [ ] the post-cross-check RE-VERIFY verdict is captured (no discarded return) and gates progression
- [ ] a "failed" post-cross-check RE-VERIFY re-enters FIX and never proceeds to COMMIT while failing
- [ ] the cross-check-passed path produces the same prompt sequence as before (regression-safe)
- [ ] all existing planexecutor.spec.ts and test/programs/11-tddab/* behavior still holds; build + typecheck + test are 0/0
</success>
</block>

## Execution Order
01-clean-main              → no dependencies (cleans main to 0/0 first)
02-verdict-inline          → no code dependency on 01; runs after 01 so the repo is already clean
03-fix-crosscheck-reverify → depends on 02 (reuses the `v.toLowerCase().startsWith("passed")` parser introduced in 02)
