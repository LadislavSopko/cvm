# Feature: 07-agent-loop-robustness

## Requirements (from user)
- Fix GitHub issue #11 ("and more" — scope to be detailed by user during LISTEN)
- `submitTask` must NOT reply only "Execution resumed": the response must tell the caller to continue with `getTask` (e.g. "Continue with getTask ..."), so the agent does not end its turn after submitting
- Test scope per phase (big projects): running the FULL test suite after every block becomes absurdly slow. Required tiering:
  - during block development (RED/GREEN): run only the tests related to what is being developed
  - at end of block (VERIFY): run all tests related to the block
  - at end of plan: run the full test suite once
  - User is unsure where this is decided (planexecutor prompts? TDDAB plan format / mindset / skills?) → to find out in ANALYZE

## Analysis

### A. CROSS-CHECK prompt (#11) — `test/programs/tddab/planexecutor.ts:183-188`
- Only CC() prompt ending with "Respond ONLY with the completed JSON" (no "Submit", no toolsReminder-before-submit). Every other step uses `submitDone`/`submitTest` (`:17-18`).
- Bundled into cvm-server via `apps/cvm-server/vite.config.ts:34` (copy of `test/programs/tddab/planexecutor.ts`), exposed as `@planexecutor` (`packages/mcp-server/src/lib/mcp-server.ts:26`).

### B. CROSS-CHECK parsing — WORSE than the issue says
- Issue claims `JSON.parse` throws. In CVM it does NOT: `JSON_PARSE` returns `null` on invalid JSON (`packages/vm/src/lib/handlers/strings.ts:136-141`).
- `for (crKey in null)` → `OBJECT_ITER_START` pushes an empty iterator for non-objects (`packages/vm/src/lib/handlers/object-iterators.ts:53-60`) → zero iterations → `crossCheckPassed` stays `true`.
- ⇒ Answer in a code fence / with prose / garbage ⇒ **cross-check SILENTLY PASSES**. False positive, not crash.
- Also passes when: keys missing from answer; values left `null` (template untouched); only `=== false` is checked (`:193`).
- Constraint: CVM has no user functions (helper funcs return undefined) → parsing/fence-stripping logic must be inline in main(); only VM-supported string methods usable.

### C. Tool responses — `packages/mcp-server/src/lib/mcp-server.ts`
- `submitTask` → `'Execution resumed'` (`:255`): no hint that next step is `getTask` → agent may end turn.
- `getTask` waiting → bare `result.message` (`:207-209`): no reminder that answer goes via `submitTask` only.
- Existing specs: `mcp-server.spec.ts`, `mcp-server-execution-management.spec.ts`.

### D. Test scope per phase — who decides?
- planexecutor RED/GREEN prompts say nothing about which tests to run; VERIFY/RE-VERIFY only "verify SUCCESS CRITERIA" → scope comes from the plan's `success` list.
- Planners write `npx nx run-many --target=test --all passes` in EVERY block's success (e.g. our own `tasks/06-drop-mongodb/plan.md`) → full suite per block, plus every FIX/RE-VERIFY loop.
- `tddab-planner.md` gives no guidance on test scope; FINAL REVIEW (`planexecutor.ts:255-257`) already runs the full suite once.
- ⇒ Two owners: (1) planexecutor prompts [this repo], (2) planning rules `tddab-planner.md` + `j-review-plan` [submodule `.ai-agent` = separate repo LadislavSopko/ai-agent].

### E. VM constraints for the fix
- Available string ops: indexOf, lastIndexOf, substring, slice, trim, startsWith, toLowerCase (handlers/strings.ts). No user functions → inline code only.
- Lesson from 04-verdict-gate-contract: keep method chains short (VM unstable on long chains).

## Interview (2026-10-09)
- Test tiers: TEXTUAL rule only (no new j-settings keys), defined once in tddab-planner.md inside the BTLT green gate.
- Executors aligned: planexecutor prompts + j-review-plan + j-develop/j-close.
- Bad CROSS-CHECK JSON: strip fence / extract {...}; if still invalid or incomplete → RE-ASK UNTIL VALID (no retry cap).
- getTask reminder: initially not selected; after live probe user chose a SHORT reminder suffix on getTask + short submitTask text.
- Extras: release 2.1.0, move planexecutor to apps/cvm-server/programs/, close issue #11.
- Publish to npm ONLY if perfectly tested. Development will itself run on TDDAB being fixed (dogfooding).
- .ai-agent changes go on its branch feature/06-tddab-review (created by user).

## Research
- Codebase: verdict parsing already hardened in 04-verdict-gate-contract (toLowerCase+startsWith) → reuse same minimal style.
- Extraction via indexOf("{") + lastIndexOf("}") + substring covers code fences AND leading/trailing prose in one rule, no fence-specific code.
- Completeness check: iterate `block.redKeys` (already in uplan.json) and require each value `=== true || === false`.
- No external library applies (logic runs inside the CVM VM).

## Proposed Solution
1. Relocate planexecutor (+ samples) → `apps/cvm-server/programs/`; update vite copy + spec paths. First, so all later edits land in the final location.
2. CROSS-CHECK robust: prompt ends with "Submit ONLY the completed JSON via cvm_submitTask — never in chat"; parse = slice from first `{` to last `}` → JSON.parse → every redKey must be true/false; invalid/incomplete → re-ask (unbounded loop, prompt says what was wrong); then false values → existing FIX/RE-VERIFY path.
3. Test-scope wording in planexecutor prompts: RED/GREEN → only tests related to current work; VERIFY/RE-VERIFY → tests of the block's affected package(s); FINAL REVIEW → full suite once.
4. Tool responses (short, always name the tool):
   - submitTask → `OK. Call getTask for the next task.`
   - getTask waiting → CC text + `\n\n--- When done, call submitTask with your result as requested.`
   - Live probe (cvm-dbg v2.0.0, 2026-10-09): submitTask always returned bare `Execution resumed`, even after the LAST CC.
   - CORRECTION (j-review-plan code cross-check): reportCCResult DOES resume the VM (vm-manager.ts:215-282) and persists the next state; earlier claim "submitTask does not execute" was wrong. User re-decided: submitTask text PER STATE (waiting → `OK. Call getTask for the next task.`; completed → `OK. Execution completed.` / `... with result: X`; error → isError `Error: ...`). reportCCResult returns ExecutionResult.
   - Bug found + included (block 04): getNext COMPLETED branch drops returnValue when completion happened inside reportCCResult (live: main returned "end", getTask said only "Execution completed").
5. .ai-agent (branch feature/06-tddab-review): textual tier rule in tddab-planner BTLT gate (block gate = block-scoped tests; full suite only at plan end / j-close); j-review-plan flags full-suite commands in a block's success; j-develop/j-close aligned.
6. Release: cvm-server 2.1.0 + CHANGELOG; full BTLT; npm publish only after user OK; comment + close #11.

## Complexity Assessment
| Task | Score | Decision |
|---|---|---|
| Relocate planexecutor | 2 | not a block: preliminary file move merged into block 01 (TDDAB rule 2) |
| CROSS-CHECK robust (#11) | 6 | split in 2 blocks: 01 submit wording + JSON extraction; 02 completeness validation + unbounded re-ask |
| Test-scope wording in prompts | 3 | single block 03 |
| Tool responses submitTask/getTask + return-value bug | 4 | 2 blocks bottom-up: 04 packages/vm (reportCCResult returns state, getNext keeps returnValue); 05 packages/mcp-server responses |
| .ai-agent rules (planner, review, develop, close) | 4 | separate STEP plan (markdown only, no unit tests; mixed plans are classified tddab and would get RED prompts) — 3 steps |
| Release 2.1.0 | 2 | last step of STEP plan (version + CHANGELOG); npm publish + closing #11 are outward actions → j-close with explicit user OK |

## TDDAB Rules Applied
1. RED is the CONTRACT of the block: tests describe observable behaviour of one unit (planexecutor prompts/flow driven through VMManager; MCP tool responses through TestTransport), not end-to-end.
2. Bottom-up, atomic, rollback-able: each block deployable alone, 1-3 files, no dependency on future blocks; non-testable setup (file move, vite copy path) is merged into the first block, never a separate setup block.
3. Self-sufficient blocks: mission + intro carry full paths, VM constraints (inline code only, no helper functions) and commands so any block runs on clean context.
4. Reference code is intentionally approximate (not compile-perfect) but contains ALL decisions: exact prompt strings, parsing algorithm, loop structure, assertions. No options, no TODOs.
5. Every success list ENDS with the green-gate BTLT line; RED lines start with `- test:` and cover happy path, edge and error cases with no count limit.

## Status
- [x] Requirements gathered
- [x] Code analyzed
- [x] Solution proposed
- [x] Plan created (plan.md tddab 5 blocks + plan-rules.md step 4 steps; j-review-plan fixes applied; parsePlan valid; redKeys 33/33)
- [ ] Development done
- [ ] Tested
- [ ] Deployed
