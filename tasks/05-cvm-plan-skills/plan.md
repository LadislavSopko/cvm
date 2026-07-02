# TDDAB Plan: Strict red/actions parsing (issue #10) + 3 universal CVM skills
**Date:** 2026-07-02

<mission>
CVM (Cognitive Virtual Machine) is a TypeScript Nx monorepo (repo root /home/laco/cvm) that orchestrates AI agents through plan execution. Packages live under packages/ (parser, vm, types, storage, mcp-server). The MCP server package (packages/mcp-server) exposes tools parsePlan, start, getTask, submitTask, status; parsePlan compiles a CVM-PP markdown plan (spec: docs/PLAN_FORMAT.md, "CVM Plan Protocol (CVM-PP) Specification" v1.0) into .cvm/uplan.json consumed by the planexecutor.

Tech stack and conventions:
- TypeScript strict mode, ESM with "moduleResolution": "nodenext" — ALL imports use the .js extension even for .ts files: import { foo } from './bar.js'
- Tests: Vitest. Run with npx nx test mcp-server (never npm test). Single file: npx nx test mcp-server -- tddab-parser.spec.ts
- Build: npx nx run-many --target=build --all
- Source files start with the SPDX header: // SPDX-License-Identifier: AGPL-3.0-or-later and // Copyright (C) 2025-2026 Ladislav Sopko
- No code comments unless required. Zero-warnings policy.

The plan parser is packages/mcp-server/src/lib/tddab-parser.ts, exporting parseTddabPlan(markdown, sourceFile, options) → ParseResult { valid, plan, errors: ParseError[] } where ParseError = { line: number (1-based), message: string }. Its unit tests are packages/mcp-server/src/lib/tddab-parser.spec.ts (31 existing tests, Vitest describe/it/expect on raw markdown strings). The parser scans line by line; inside a red section it currently only collects lines matching /^-\s*test:\s*(.+)/ and inside an actions section only /^-\s*action:\s*(.+)/ — any other line is silently skipped. GitHub issue #10 documents the resulting silent test loss: a line like "- test @local-only: xyz" (tag BEFORE the colon) looks valid to humans but is dropped, and parsePlan still reports valid:true. This plan makes red/actions content a strict contract (issue option 1): any non-empty line inside those sections that does not parse as a test/action line becomes a validation error carrying the 1-based line number. Blank and whitespace-only lines remain legal. No existing test or fixture relies on the lenient behavior (verified: only blank lines appear as non-test content in fixtures).

The plan also ships three universal skills as versioned content in a new top-level skills/ directory so CVM can be used standalone by any AI agent without the author's full ai-agent setup: skills/cvm-plan-create/SKILL.md (author a CVM-PP plan), skills/cvm-plan-review/SKILL.md (review a plan for conformity, using parsePlan for machine validation), skills/cvm-plan-execute/SKILL.md (drive execution: parsePlan → start → getTask/submitTask loop). Skills are markdown with YAML frontmatter (name, description) compatible with Claude Code .claude/skills; they must REFERENCE docs/PLAN_FORMAT.md as the single source of truth for the format rather than duplicating the grammar. README.md gets an installation section for these skills.
</mission>

<block id="01-strict-red-validation">
## TDDAB-1: Reject unparseable lines inside red sections

<intro>
Modify packages/mcp-server/src/lib/tddab-parser.ts so the red-section loop (currently lines 165-177) reports a ParseError for every non-empty trimmed line that does not match /^-\s*test:\s*(.+)/, instead of silently skipping it. Blank and whitespace-only lines stay legal. The error carries the 1-based line number of the offending line and quotes it. Error message format (no angle brackets, the literal word red): Block "BLOCKID" has unparseable line in red at line N: "RAW LINE". Tests go in packages/mcp-server/src/lib/tddab-parser.spec.ts alongside the existing 31 tests. No other file changes. This is the direct fix for GitHub issue #10.
</intro>

<red>
- test: red section containing "- test @local-only: register happy" (tag before colon) → valid:false, one error whose message contains the block id, the word "unparseable", the correct 1-based line number, and the quoted raw line
- test: red section containing a prose line ("these cover the auth flows") → valid:false with one unparseable-line error
- test: red section with blank lines and whitespace-only lines between valid test lines → valid:true, all tests collected
- test: red section with three malformed lines among six valid ones (issue #10 repro shape) → valid:false, exactly three errors, redTests would have collected the six valid lines
- test: tag written after the colon ("- test: register happy @local-only — details") → parsed as a normal test line, valid:true
- test: fully valid existing-style plan → still valid:true with unchanged redTests (regression guard)
- test: malformed line error coexists with other block errors (e.g. missing success tag) → both errors reported
</red>

### Implementation
Inside the existing red-section scan loop of parseTddabPlan (the while that consumes lines until the closing red tag, tddab-parser.ts around line 168), replace the silent skip with:
```typescript
const raw = lines[i].trim();
const testMatch = raw.match(/^-\s*test:\s*(.+)/);
if (testMatch) {
  redTests.push(testMatch[1].trim());
} else if (raw !== '') {
  errors.push({
    line: i + 1,
    message: `Block "${blockId}" has unparseable line in red at line ${i + 1}: "${raw}"`,
  });
}
i++;
```
The surrounding loop structure, tag-open detection and post-loop advance stay exactly as they are today.
Test pattern (Vitest, same style as existing spec — build the markdown with a small helper that wraps given lines in a minimal valid plan with a red section):
```typescript
it('should reject red line with tag before colon', () => {
  const md = planWithRedLines(['- test: ok line', '- test @local-only: dropped line']);
  const result = parseTddabPlan(md, 'plan.md');
  expect(result.valid).toBe(false);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].message).toContain('unparseable line in red');
  expect(result.errors[0].message).toContain('- test @local-only: dropped line');
});
```

<success>
- [ ] npx nx test mcp-server -- tddab-parser.spec.ts passes with the seven new tests green
- [ ] All 31 pre-existing parser tests still pass unchanged
- [ ] npx nx run-many --target=build --all succeeds with zero new warnings
</success>
</block>

<block id="02-strict-actions-validation">
## TDDAB-2: Reject unparseable lines inside actions sections

<intro>
Apply the same strictness to the actions-section loop in packages/mcp-server/src/lib/tddab-parser.ts (currently lines 179-192): every non-empty trimmed line not matching /^-\s*action:\s*(.+)/ produces a ParseError with the 1-based line number, message format Block "BLOCKID" has unparseable line in actions at line N: "RAW LINE". Blank/whitespace-only lines stay legal. Depends on block 01 only in that it edits the sibling loop of the same file; logic is independent. Tests in packages/mcp-server/src/lib/tddab-parser.spec.ts. Also verify the parsePlan MCP tool surfaces these errors end-to-end via one test in packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts (tool returns valid:false and the error list for a plan with a malformed actions line).
</intro>

<red>
- test: actions section containing "- action @manual: run migration" (tag before colon) → valid:false, one error with the word "unparseable", the correct line number and the quoted raw line
- test: actions section with prose line → valid:false with one unparseable-line error
- test: actions section with blank lines between valid action lines → valid:true, all actions collected
- test: fully valid step-style plan (only action lines) → still valid:true, deducePlanType still yields step (regression guard)
- test: parsePlan MCP tool on a plan file with one malformed actions line → tool response has valid:false and an errors array containing the unparseable-line message
</red>

### Implementation
Inside the existing actions-section scan loop of parseTddabPlan (the while that consumes lines until the closing actions tag, tddab-parser.ts around line 183), replace the silent skip with:
```typescript
const raw = lines[i].trim();
const actionMatch = raw.match(/^-\s*action:\s*(.+)/);
if (actionMatch) {
  redTests.push(actionMatch[1].trim());
} else if (raw !== '') {
  errors.push({
    line: i + 1,
    message: `Block "${blockId}" has unparseable line in actions at line ${i + 1}: "${raw}"`,
  });
}
i++;
```
The surrounding loop structure, tag-open detection, isAction flag and post-loop advance stay exactly as they are today.

<success>
- [ ] npx nx test mcp-server passes: new actions tests plus the parsePlan end-to-end test green
- [ ] Full mcp-server suite green (no regression in planexecutor / e2e specs)
- [ ] npx nx run-many --target=build --all succeeds with zero new warnings
</success>
</block>

<block id="03-plan-format-docs">
## TDDAB-3: Document the strict red/actions contract in the CVM-PP spec

<intro>
Update docs/PLAN_FORMAT.md (CVM-PP v1.0 spec) to document the behavior introduced in blocks 01-02. Non-testable documentation work — actions block. Three additions: (1) red/actions content is a STRICT contract — any non-empty line that is not a valid test/action line fails validation with a per-line error; blank lines are allowed; (2) tags/annotations such as @local-only must go AFTER the colon ("- test: register happy @local-only — details"), never between the word test and the colon; include the wrong-vs-right example from issue #10; (3) bump the spec changelog/version note (v1.1) mentioning issue #10. Keep the existing document structure and tone; edit sections in place.
</intro>

<actions>
- action: add a "Strict content rule" paragraph to the red and actions sections of docs/PLAN_FORMAT.md stating that unparseable non-empty lines fail validation with file:line errors and blank lines are permitted
- action: add a tag-placement example block showing the malformed form (- test @local-only: ...) marked WRONG and the correct form (- test: ... @local-only — ...) marked CORRECT
- action: add a v1.1 changelog entry to docs/PLAN_FORMAT.md referencing strict red/actions validation and issue #10
</actions>

<success>
- [ ] docs/PLAN_FORMAT.md contains the strict content rule for both red and actions sections
- [ ] docs/PLAN_FORMAT.md contains the WRONG/CORRECT tag-placement example
- [ ] Changelog entry v1.1 present and mentions issue #10
</success>
</block>

<block id="04-skill-plan-create">
## TDDAB-4: Add universal skill cvm-plan-create

<intro>
Create skills/cvm-plan-create/SKILL.md (this block also creates the top-level skills/ directory — no separate setup block). The skill guides ANY AI agent, without the author's ai-agent setup, to author a valid CVM-PP plan. Markdown with YAML frontmatter compatible with Claude Code skills. Content outline (concise, references docs/PLAN_FORMAT.md as source of truth instead of duplicating the grammar): frontmatter name cvm-plan-create and a trigger-oriented description; purpose paragraph; instruction to READ docs/PLAN_FORMAT.md first; authoring checklist (mission self-sufficiency, NN-kebab-case unique block ids, red lines strictly "- test: ..." with annotations after the colon, actions blocks for non-testable work, success checklists, execution order, multi-file mode with files tag in index.md); common mistakes section featuring the issue #10 tag-before-colon trap; final step: validate with the parsePlan MCP tool and fix every reported error before delivering the plan.
</intro>

<actions>
- action: create skills/cvm-plan-create/SKILL.md with YAML frontmatter (name, description) and the content outline from the intro, referencing docs/PLAN_FORMAT.md rather than duplicating the format grammar
</actions>

<success>
- [ ] skills/cvm-plan-create/SKILL.md exists with valid YAML frontmatter (name, description)
- [ ] Skill instructs reading docs/PLAN_FORMAT.md and validating with parsePlan
- [ ] Common-mistakes section covers the tag-before-colon trap from issue #10
</success>
</block>

<block id="05-skill-plan-review">
## TDDAB-5: Add universal skill cvm-plan-review

<intro>
Create skills/cvm-plan-review/SKILL.md. The skill guides an agent to review an existing CVM-PP plan before execution. Content outline: frontmatter name cvm-plan-review plus description; two-stage review — stage 1 machine validation: run the parsePlan MCP tool, require valid:true, zero errors, and per-block sanity (block count and red line counts match the source file); stage 2 semantic review checklist derived from TDDAB quality rules (mission sufficient for clean-context execution, blocks atomic and bottom-up by responsibility, red lines are unit-level contracts not E2E wishes, no options/TODOs/investigations in any block, success items verifiable, execution order present and consistent with dependencies); output format: verdict APPROVED or list of concrete findings with block id and severity. References docs/PLAN_FORMAT.md for format questions.
</intro>

<actions>
- action: create skills/cvm-plan-review/SKILL.md with YAML frontmatter and the two-stage review flow (parsePlan machine validation, then semantic checklist with verdict output)
</actions>

<success>
- [ ] skills/cvm-plan-review/SKILL.md exists with valid YAML frontmatter
- [ ] Stage 1 requires parsePlan valid:true with zero errors before semantic review
- [ ] Semantic checklist covers atomicity, self-sufficiency, unit-level red contracts, no options/TODOs, execution order
</success>
</block>

<block id="06-skill-plan-execute">
## TDDAB-6: Add universal skill cvm-plan-execute

<intro>
Create skills/cvm-plan-execute/SKILL.md. The skill guides an agent to execute a validated plan through the CVM MCP tools end to end. Content outline: frontmatter name cvm-plan-execute plus description; prerequisites (CVM MCP server connected, plan validated via cvm-plan-review); execution flow: call parsePlan on the plan file, then start the planexecutor execution, then loop getTask → perform the task exactly as prompted (RED write failing tests, GREEN implement, VERIFY run checks, COMMIT) → submitTask with the result, until no task remains; resume section: after interruption use status / list_executions and set_current to continue the same execution rather than restarting; rules: never skip a task, never answer outside the current getTask prompt, report blockers via submitTask honestly. References the CC/getTask paradigm briefly (the VM orchestrates, the agent is the cognitive processor).
</intro>

<actions>
- action: create skills/cvm-plan-execute/SKILL.md with YAML frontmatter, prerequisites, the parsePlan/start/getTask/submitTask loop, resume-after-interruption instructions, and execution rules
</actions>

<success>
- [ ] skills/cvm-plan-execute/SKILL.md exists with valid YAML frontmatter
- [ ] Execution loop documents parsePlan, start, getTask, submitTask in order with the RED/GREEN/VERIFY/COMMIT phases
- [ ] Resume section documents status, list_executions and set_current
</success>
</block>

<block id="07-readme-skills-section">
## TDDAB-7: Document skills installation in README

<intro>
Add a "Universal Skills" section to README.md (repo root) after the existing CVM-PP section. Content: what the three skills are (one line each pointing to skills/cvm-plan-create/SKILL.md, skills/cvm-plan-review/SKILL.md, skills/cvm-plan-execute/SKILL.md); why they exist (use CVM standalone with any AI agent, no bespoke agent setup required); installation for Claude Code (copy or symlink each skill directory into the project .claude/skills/ folder, with the exact cp -r and ln -s commands); note that the markdown is agent-agnostic and other agent frameworks can ingest the same files. Keep README tone and heading style consistent with the existing document.
</intro>

<actions>
- action: add a Universal Skills section to README.md listing the three skills, their purpose, and copy/symlink installation commands for Claude Code .claude/skills
</actions>

<success>
- [ ] README.md has the Universal Skills section listing all three skills with correct paths
- [ ] Installation commands (cp -r and ln -s variants) are present and correct
- [ ] Section states the skills are agent-agnostic
</success>
</block>

## Execution Order
01-strict-red-validation      → no dependencies
02-strict-actions-validation  → depends on 01 (same file, sibling loop)
03-plan-format-docs           → depends on 01, 02 (documents their behavior)
04-skill-plan-create          → depends on 03 (references final spec wording)
05-skill-plan-review          → depends on 03 (can run parallel with 04)
06-skill-plan-execute         → depends on 03 (can run parallel with 04-05)
07-readme-skills-section      → depends on 04, 05, 06
