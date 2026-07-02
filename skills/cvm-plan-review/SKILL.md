---
name: cvm-plan-review
description: "Review an existing CVM Plan Protocol (CVM-PP) plan for conformity and quality before it is executed. Use this skill whenever you need to check, review, audit, or approve a CVM plan.md — machine-validate it with parsePlan and then semantically review its blocks against TDDAB quality rules. Triggers: review this CVM plan, check the plan before execution, is this plan.md valid, approve the plan for the planexecutor."
---

# cvm-plan-review — Review a CVM-PP Plan

## Purpose

Before a plan is handed to the CVM `planexecutor`, it should be verified — a plan that is
internally malformed, or valid-but-low-quality, wastes an entire autonomous run. This
skill runs a **two-stage review**: machine validation first (objective), then a semantic
quality pass (judgement). Your deliverable is a verdict: **APPROVED**, or a list of
concrete findings the author must fix.

For any question about the format itself (tags, ids, plan shapes, validation rules),
consult **`docs/PLAN_FORMAT.md`** — the authoritative CVM-PP spec.

## Stage 1 — Machine validation (objective, must pass first)

1. Run the **`parsePlan` MCP tool** on the plan file.
2. Require **`valid:true` with zero errors.** Any `line N: message` error is a blocker —
   report it and stop; there is no point reviewing semantics of a plan that will not
   parse.
3. **Per-block sanity check.** Compare the compiled result against the source:
   - The **block count** returned by `parsePlan` matches the number of `<block>` tags in
     the source file(s).
   - The **red/action line count per block** matches the source: count `- test:` /
     `- action:` lines in each block in the source and confirm the block's `redKeys` (in
     `.cvm/uplan.json`) has the same count. A mismatch means lines were dropped — inspect
     for malformed items (e.g. a tag before the colon) and report them with file + block
     id.

Only proceed to Stage 2 if Stage 1 is fully clean.

## Stage 2 — Semantic review (judgement, per TDDAB quality rules)

Review each block against these criteria:

- **Mission sufficiency.** Is `<mission>` enough for **clean-context execution** — stack,
  build/test commands, conventions, file layout — so any single block runs with no other
  knowledge?
- **Atomic, bottom-up blocks.** Is each block one responsibility/layer, independently
  verifiable and rollback-able? Flag monolithic "whole feature in one block" designs and
  blocks that span multiple layers.
- **Red lines are unit-level contracts.** Each `- test:` describes ONE unit behavior, not
  an E2E/API wish for the whole stack. Flag E2E-shaped red lines.
- **No options / TODOs / investigations.** No "Option A or B", "TODO", "investigate",
  "consider…", or unresolved decisions in any block. A plan is a recipe, not a discussion.
- **Success items are verifiable.** Each `- [ ]` must be provable against real code/tests
  with file:line evidence. Flag vague criteria that would stall the VERIFY loop.
- **Execution order present and consistent.** An Execution Order section exists, and no
  block depends on a symbol/file/type created by a **later** block (dependency inversion
  is a hard finding — it fails at execution time).

## Output format

Produce one of:

```
PLAN REVIEW — APPROVED ✅
- Stage 1: parsePlan valid:true, N blocks, red/action counts match source.
- Stage 2: mission sufficient, blocks atomic & ordered, red lines unit-level,
  no options/TODOs, success items verifiable.
```

or, if any issue is found:

```
PLAN REVIEW — ISSUES FOUND
[block id] SEVERITY(blocker|major|minor): concrete finding + why it is wrong + suggested fix
...
Fix these before executing with the CVM planexecutor.
```

Every finding must name the **block id**, a **severity**, explain **why** it is wrong, and
suggest a **specific fix** — not vague advice.
