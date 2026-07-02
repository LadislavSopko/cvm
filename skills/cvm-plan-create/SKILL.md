---
name: cvm-plan-create
description: "Author a valid CVM Plan Protocol (CVM-PP) plan that CVM can execute. Use this skill whenever you need to write, draft, or structure a CVM plan — a mission plus ordered TDDAB/step blocks — so an AI agent can be driven through the work one task at a time by the CVM planexecutor. Triggers: create a CVM plan, write a plan.md for CVM, turn this feature into a CVM-PP plan, prepare work for autonomous execution."
---

# cvm-plan-create — Author a CVM-PP Plan

## Purpose

CVM (Cognitive Virtual Machine) drives an AI agent through a piece of work **one task at
a time** by reading a structured Markdown plan written in the **CVM Plan Protocol
(CVM-PP)**. This skill guides you to author such a plan so that `parsePlan` accepts it and
the `planexecutor` can run it — no bespoke agent setup required. Your deliverable is a
single `plan.md` (or an index + sub-files for large plans) that validates cleanly.

## Step 1 — Read the format spec (source of truth)

**READ `docs/PLAN_FORMAT.md` first.** It is the authoritative CVM-PP grammar: tags,
plan shapes, type detection, compiled output, validation rules. Do **not** rely on memory
or reproduce the grammar from this skill — the spec is the contract and may have evolved.
This skill is a workflow guide; `docs/PLAN_FORMAT.md` is the law.

## Step 2 — Authoring checklist

Write the plan against the spec, ensuring:

- **Mission is self-sufficient.** Exactly one `<mission>` (in the single file, or in the
  index of a multi-file plan). It becomes `PROJECT CONTEXT:` for every block, so it must
  carry the tech stack, build/test commands, conventions, and file layout — enough that
  any single block can be executed on a clean context with no other knowledge.
- **Block ids are `NN-kebab-case` and globally unique.** Two digits, a hyphen, kebab
  slug (e.g. `01-parser`, `02-task-store`). Unique across all sub-files too.
- **Decompose bottom-up, atomic blocks.** One responsibility/layer per block; each block
  independently verifiable and rollback-able. Never one monolithic block per feature.
- **`<red>` lines are strictly `- test: ...`.** Each item is one unit-level failing test
  (contract, not E2E). Any annotation goes **after** the colon:
  `- test: register happy path @local-only — needs a live DB`.
- **`<actions>` blocks for non-testable work** (docs, config, release steps). Each line
  is strictly `- action: ...`. A pure `step` plan needs **all** blocks to be `<actions>`.
- **`<success>` is a checklist of objectively checkable items** (`- [ ]`), each provable
  against real code/tests with file:line evidence.
- **Put rich detail in the block body** (`### Implementation` prose/code) — it is not
  parsed but stays reachable via `planRef`.
- **End with an Execution Order** section listing blocks and their dependencies.
- **Multi-file mode** for large plans: an index file with `<mission>` + a `<files>` list
  (one `- filename` per line, file order = execution order); each sub-file holds only
  blocks. See the multi-file rules in the spec.

## Step 3 — Common mistakes to avoid

- **Tag before the colon (issue #10 trap).** `- test @local-only: register happy` does
  **not** match `- test:` — it is now a hard validation error, and before CVM-PP v1.1 was
  silently dropped while the plan still looked `valid:true`. Always put tags/annotations
  **after** the colon.
- **Prose or code inside `<red>` / `<actions>`.** These sections are a strict contract:
  every non-empty line must be a valid `- test:` / `- action:` item (blank lines are OK).
  Move explanations into the block body.
- **Options / TODOs / "investigate" in a block.** A plan is a recipe, not a discussion —
  resolve every decision before writing it.
- **Vague `<success>` items.** If the agent cannot point at code to prove it, the VERIFY
  loop stalls.
- **Raw TDDAB tag names with angle brackets inside tag content** — the parser cannot tell
  them from real tag boundaries.

## Step 4 — Validate before delivering

Run the **`parsePlan` MCP tool** on your plan file. It returns `valid:true` with the
block count/ids, or a list of `line N: message` errors. **Fix every reported error and
re-run until it is clean.** Do not deliver a plan that `parsePlan` rejects.
