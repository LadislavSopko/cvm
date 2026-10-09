# Step Plan: Tiered Test Scope Rules + Release 2.1.0
**Date:** 2026-10-09

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx monorepo at /home/laco/cvm. The AI-agent workflow files (skills, mindsets) live in the git SUBMODULE /home/laco/cvm/.ai-agent (separate repo LadislavSopko/ai-agent), currently checked out on branch feature/06-tddab-review, created by the user for this work. /home/laco/cvm/.claude/commands is a symlink to /home/laco/cvm/.ai-agent/.claude/commands.

WHY: on big projects agents run the FULL test suite at every phase of every block, which becomes absurdly slow. Decided rule (plain text, no new j-settings keys), three tiers:
- FOCUSED — while developing a block (RED, GREEN, FIX): run only the tests being written or touched (single test file or test-name filter).
- BLOCK — the block's green gate (VERIFY / RE-VERIFY, the "tests" part of BTLT): run the tests of the project(s)/package(s) the block touches.
- FULL — once per plan/feature: at the end of the plan (FINAL REVIEW / j-develop completion) and as the pre-merge barrier in j-close.
The companion TDDAB plan (tasks/07-agent-loop-robustness/plan.md) already puts the same tiers into the planexecutor prompts (constants scopeFocused / scopeBlock in apps/cvm-server/programs/planexecutor.ts).

FILES (all markdown, no unit tests):
- /home/laco/cvm/.ai-agent/.claude/commands/mind-sets/tddab-planner.md — single source of the TDDAB method; section "VERIFY = the block's GREEN GATE (BTLT)" defines the end-of-block gate; every block's success list ends with the canonical line "- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)". That canonical line MUST stay byte-identical (j-review-plan checks for it).
- /home/laco/cvm/.ai-agent/.claude/commands/j-review-plan.md — plan review skill; section "#### D. Completeness (as defined by mindset file)".
- /home/laco/cvm/.ai-agent/.claude/commands/j-develop.md — execution skill; "Run tests" lines in step 3, "After EACH step" gate, "Report Completion", "Internal Quality Checks".
- /home/laco/cvm/.ai-agent/.claude/commands/j-close.md — close skill; "### 4. Final Tests".
- /home/laco/cvm/apps/cvm-server/package.json (version) and /home/laco/cvm/apps/cvm-server/CHANGELOG.md (newest entry on top, format "## X.Y.Z (YYYY-MM-DD)").

COMMIT RULES: edits inside .ai-agent are committed IN the submodule (cd /home/laco/cvm/.ai-agent; git add; git commit) on branch feature/06-tddab-review; then the parent repo records the new submodule pointer (cd /home/laco/cvm; git add .ai-agent; git commit). Never push (pushing happens at j-close with user approval). Commit messages: conventional, no emojis.

Build/test commands of the parent repo: npx nx run-many --target=build --all ; npx nx run-many --target=typecheck --all ; npx nx run-many --target=test --all ; lint not configured (n/a).
</mission>

<block id="01-planner-test-tiers">
## TDDAB-1: Define Test Scope Tiers in tddab-planner

<intro>
Edit /home/laco/cvm/.ai-agent/.claude/commands/mind-sets/tddab-planner.md. Inside the section "VERIFY = the block's GREEN GATE (BTLT)", right after the BTLT bullet list, add a subsection "### Test scope tiers (speed rule)" stating the three tiers FOCUSED / BLOCK / FULL exactly as in the mission, that the "T" of the block gate means BLOCK scope (never the full suite), that the full suite runs once at plan end and in j-close, and that a block's success list MUST NOT contain full-suite commands (examples: nx run-many --target=test --all, root npm test / dotnet test of the whole solution, pytest at repo root) but block-scoped ones (examples: npx nx test PACKAGE, npm run test -w PACKAGE, dotnet test path/to/Project.Tests.csproj). Also add to "TDDAB Quality Checklist" one item: success list uses block-scoped test commands, no full-suite command. Keep the canonical green-gate line unchanged. No dependencies.
</intro>

<actions>
- action: Add subsection "### Test scope tiers (speed rule)" inside the BTLT section with FOCUSED / BLOCK / FULL definitions, BLOCK meaning of the gate's tests, and the ban on full-suite commands in a block's success list with examples per ecosystem
- action: Add the quality-checklist item "Success list uses block-scoped test commands (no full-suite command)"
- action: Commit in the submodule: docs(tddab): tiered test scope (focused/block/full)
</actions>

<success>
- [ ] tddab-planner.md contains the subsection "Test scope tiers (speed rule)" with all three tiers
- [ ] The canonical line "- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)" is unchanged (grep finds it byte-identical)
- [ ] The quality checklist has the block-scoped test command item
- [ ] Commit exists in .ai-agent on branch feature/06-tddab-review
</success>
</block>

<block id="02-review-plan-flags-full-suite">
## TDDAB-2: j-review-plan Flags Full-Suite Commands in Blocks

<intro>
Edit /home/laco/cvm/.ai-agent/.claude/commands/j-review-plan.md, section "#### D. Completeness (as defined by mindset file)": add a check that every block's success list uses BLOCK-scoped test commands; a full-suite command (nx run-many --target=test --all, root-level npm test / dotnet test / pytest of the whole repo) inside a block is reported as an issue with the fix "replace with the block-scoped command (npx nx test PACKAGE, …); the full suite runs once at plan end / j-close", referencing the tddab-planner subsection "Test scope tiers (speed rule)" as source of truth (do not re-declare the tiers). Depends on step 01.
</intro>

<actions>
- action: Add the block-scoped test command check to section D of j-review-plan.md, pointing to the tddab-planner tiers subsection
- action: Commit in the submodule: docs(j-review-plan): flag full-suite test commands inside blocks
</actions>

<success>
- [ ] j-review-plan.md section D contains the full-suite-in-block check with the suggested fix
- [ ] The check references tddab-planner "Test scope tiers" instead of redefining the tiers
- [ ] Commit exists in .ai-agent on branch feature/06-tddab-review
</success>
</block>

<block id="03-develop-close-align-tiers">
## TDDAB-3: Align j-develop and j-close with the Tiers

<intro>
Edit /home/laco/cvm/.ai-agent/.claude/commands/j-develop.md and /home/laco/cvm/.ai-agent/.claude/commands/j-close.md, referencing tddab-planner "Test scope tiers (speed rule)" (no redefinition). j-develop: in step 3 the "Run tests" lines for TDDAB and TDD become FOCUSED tests while developing; the "After EACH step" green gate states its tests are BLOCK scope; "Report Completion" final gate states FULL suite; in "Internal Quality Checks" replace the per-step "Full test suite still passes (no regressions)" with "Block-scoped tests pass (tests of the touched packages)"; the completion check "Full test suite passes with zero failures" stays. j-close: step "4. Final Tests" states it runs the FULL suite (all projects), e.g. for Nx npx nx run-many --target=test --all, as the pre-merge barrier. Depends on step 01.
</intro>

<actions>
- action: Update j-develop.md test lines to FOCUSED during development, BLOCK at the per-step gate, FULL at completion, and replace the per-step full-suite internal check with the block-scoped one
- action: Update j-close.md step 4 to run the FULL suite across all projects as the pre-merge barrier
- action: Commit in the submodule: docs(j-develop,j-close): apply tiered test scope
- action: In the parent repo record the submodule pointer: git add .ai-agent and commit chore(ai-agent): bump to tiered test scope rules
</actions>

<success>
- [ ] j-develop.md has no per-step "Full test suite still passes" check; per-step gate is block-scoped; completion is full suite
- [ ] j-close.md step 4 explicitly runs the full suite of all projects
- [ ] Both files reference the tddab-planner tiers subsection
- [ ] Submodule commit exists and the parent repo has a commit updating the .ai-agent pointer
</success>
</block>

<block id="04-release-2-1-0">
## TDDAB-4: Prepare cvm-server 2.1.0 Release

<intro>
Depends on the TDDAB plan tasks/07-agent-loop-robustness/plan.md being fully executed and on steps 01-03. Edit /home/laco/cvm/apps/cvm-server/package.json version 2.0.0 → 2.1.0 and add on top of /home/laco/cvm/apps/cvm-server/CHANGELOG.md an entry "## 2.1.0 (DATE)" with sections Fixed (issue #11: CROSS-CHECK asks to submit via cvm_submitTask; CROSS-CHECK answer extracted from code fences/prose and validated, invalid or incomplete answers are re-asked until valid instead of silently passing) and Changed (submitTask replies by next state: "OK. Call getTask for the next task." / "OK. Execution completed[ with result: …]" / error; reportCCResult returns the reached ExecutionResult; getTask keeps the program return value after completion inside submitTask; getTask appends "--- When done, call submitTask with your result as requested." to every task; planexecutor prompts carry tiered test scope; planexecutor moved to apps/cvm-server/programs/). Update /home/laco/cvm/memory-bank/techContext.md: remove the "@planexecutor::production builtin under test/" infrastructure issue line. Then run the FULL suite once. Publishing to npm and closing GitHub issue #11 are NOT part of this step (done at j-close with explicit user approval).
</intro>

<actions>
- action: Bump apps/cvm-server/package.json to 2.1.0
- action: Add the 2.1.0 CHANGELOG entry with Fixed and Changed sections
- action: Remove the stale planexecutor-location issue line from memory-bank/techContext.md
- action: Run npx nx run-many --target=build --all, npx nx run-many --target=typecheck --all and npx nx run-many --target=test --all and confirm all green
</actions>

<success>
- [ ] apps/cvm-server/package.json version is 2.1.0
- [ ] CHANGELOG.md top entry is 2.1.0 with Fixed and Changed sections covering all items
- [ ] techContext.md no longer lists the planexecutor-under-test issue
- [ ] Full build, typecheck and full test suite of all projects pass
- [ ] Nothing was published and issue #11 is still open (left for j-close)
</success>
</block>

## Execution Order
01-planner-test-tiers         → no dependencies
02-review-plan-flags-full-suite → depends on 01
03-develop-close-align-tiers  → depends on 01
04-release-2-1-0              → depends on plan.md fully executed + 01-03
