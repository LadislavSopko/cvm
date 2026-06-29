# CVM Plan Format Specification

**Status:** Stable · **Audience:** plan authors and tool builders (e.g. external plan
generators that want to emit CVM-executable plans) · **Version:** 1.0

This document is the **contract** for the Markdown plan format that the CVM `parsePlan`
tool accepts. A plan that conforms to this spec can be validated and executed
autonomously by CVM with no further transformation. If you generate plans
programmatically, target this grammar exactly and your output will run as-is.

---

## 1. Overview

A **plan** is a Markdown file describing a piece of work as an ordered list of
**blocks**. Each block is an atomic, independently verifiable unit.

CVM does **not** execute the work itself. It turns a plan into a sequence of
**checkpoints** and hands them to an AI agent (Claude) **one task at a time** — the agent
is the one that drives itself through the plan, doing the actual work for each task and
reporting back. CVM holds all the loop / retry / resume / progress state, so the agent
can follow a long plan one step at a time without keeping the whole plan in its context.
Think of it as a guide rope (or GPS): CVM says "do this next", the agent does it,
CVM advances.

Two pieces consume the format:

1. **`parsePlan`** — a validator/compiler. It reads the Markdown, validates it against
   this grammar, and writes a compiled artifact `.cvm/uplan.json` (the "universal
   plan"). On any violation it fails with `line N: message` errors and writes nothing.
2. **`planexecutor`** — the runtime program. It reads `.cvm/uplan.json` and walks the
   blocks, emitting one phase task at a time to the AI agent (via CVM's `CC()`
   checkpoints) and advancing as the agent reports each task done. The agent does the
   work; `planexecutor` just sequences the tasks and keeps state.

There are **two plan shapes**:

- **Single-file** — mission and all blocks in one `.md` file.
- **Multi-file** — an *index* file holds the mission and a `<files>` list; each listed
  sub-file holds only blocks. Blocks are merged in file order.

There are **two plan types**, auto-detected (you do not declare it):

- **`tddab`** — test-driven blocks (use `<red>`). Default.
- **`step`** — action blocks (use `<actions>`). Selected only when **every** block is an
  action block.

---

## 2. Lexical rules

- Encoding: UTF-8 Markdown.
- Tags are matched **after trimming leading/trailing whitespace** on a line. Indentation
  does not matter, but a tag must be the first non-whitespace token on its line.
- All container tags (`<mission>`, `<intro>`, `<red>`, `<actions>`, `<success>`,
  `<block>`, `<files>`) may be written **inline** (`<tag>content</tag>` on one line) or
  **multiline** (open tag, content lines, close tag on its own line). `<mission>` and
  `<intro>` support both forms; list tags are normally multiline.
- Inside list tags, only lines matching the specific item pattern are captured. **Any
  other line is silently ignored** (see §4.6 — this is intentional and useful).
- Markdown outside the recognized tags (prose, `###` headings, fenced code blocks) is
  ignored by the parser but is preserved in the source file and reachable by the
  executor via `planRef` (§6).

---

## 3. Grammar (EBNF-style)

```
plan            = single_file_plan | index_plan ;

single_file_plan= mission , { block }+ ;          (* at least one block *)

index_plan      = mission , files_list ;          (* blocks live in sub-files *)
sub_file        = { block }+ ;                     (* no mission required *)

mission         = "<mission>" , text , "</mission>" ;       (* non-empty *)

files_list      = "<files>" , { "- " , filename }+ , "</files>" ;

block           = block_open ,
                  [ title ] ,
                  intro ,
                  ( red | actions ) ,
                  success ,
                  "</block>" ;

block_open      = '<block id="' , block_id , '">' ;
block_id        = digit , digit , "-" , kebab ;             (* see §4.3 *)

title           = "## TDDAB-" , number , ": " , text ;      (* optional *)
intro           = "<intro>" , text , "</intro>" ;           (* non-empty *)

red             = "<red>" , { "- test: " , text }+ , "</red>" ;
actions         = "<actions>" , { "- action: " , text }+ , "</actions>" ;

success         = "<success>" , { "- [ ] " , text }+ , "</success>" ;
```

> Note: the EBNF shows logical structure. The parser is line-oriented and tolerant of
> extra non-matching lines anywhere inside a block (they are dropped).

---

## 4. Element reference

### 4.1 `<mission>` (required, except in sub-files)
Free-form, multiline text describing the overall goal, tech stack, rules, and files to
touch. It is injected as `PROJECT CONTEXT:` into every block prompt, so make it useful
standalone context.

- **Required** in single-file plans and in the index of a multi-file plan.
- Must be **non-empty**.
- In multi-file **sub-files** the mission is **not required** and, if present, is
  **silently ignored** — the index mission is authoritative.

### 4.2 `<files>` (multi-file mode only)
Presence of a `<files>` tag in a file switches `parsePlan` to multi-file mode and marks
that file as the index.

```
<files>
- 01-parser.md
- 02-services.md
</files>
```

- Each entry is a `- filename` line (relative to the index file's directory).
- **File order = execution order.**
- Blank lines / non-`-` lines inside the tag are ignored.

### 4.3 `<block id="...">` (one or more)
The unit of execution.

- `id` **must** match `^\d{2}-[a-z0-9]+(-[a-z0-9]+)*$` — two digits, a hyphen, then
  kebab-case. Examples: `01-parser`, `02-task-store`, `10-final-cycle`.
- `id` **must be globally unique** across the whole plan (across all sub-files in
  multi-file mode). A duplicate is a hard error.
- A block must be closed with `</block>`.

### 4.4 `## TDDAB-N: Title` (optional but recommended)
A heading inside the block matching `## TDDAB-<number>: <title>` sets the block title
(used in logs and phase prompts). If absent, the title is empty. The `N` is cosmetic —
ordering comes from block position/file order, not from this number.

### 4.5 `<intro>` (required)
Per-block context: what this block is about, which files to modify, which test file,
dependencies on other blocks. Injected as `CONTEXT:` into the block's prompts. Must be
non-empty.

### 4.6 `<red>` vs `<actions>` (exactly one required)
This choice picks the block's nature.

**`<red>`** — for test-driven blocks. Each item is the description of a failing test to
write first:
```
<red>
- test: parseFilesTag returns empty array if no files tag
- test: duplicate block id across files returns an error
</red>
```

**`<actions>`** — for non-test "do this" steps:
```
<actions>
- action: run the database migration
- action: update the changelog
</actions>
```

Rules:
- A block must have **either** `<red>` **or** `<actions>`, with **at least one** item.
- Only lines starting with `- test:` (inside `<red>`) or `- action:` (inside
  `<actions>`) are captured. Other lines are ignored — so you can freely interleave
  prose or code between items if you want, though keeping items clean is preferred.

### 4.7 `<success>` (required)
The acceptance checklist. Each item is an unchecked Markdown checkbox:
```
<success>
- [ ] parseFilesTag exported and returns correct list
- [ ] all tests pass: npx nx test mcp-server
</success>
```
- At least one `- [ ]` item is required.
- These become the **VERIFY** criteria — the executor asks the agent to prove each one
  against the actual code with file:line evidence before the block can pass.

---

## 5. Plan type detection (`tddab` vs `step`)

You do **not** declare the type. `parsePlan` derives it:

| Blocks present                         | Resulting type |
|----------------------------------------|----------------|
| at least one `<red>` block             | `tddab`        |
| **all** blocks are `<actions>` blocks  | `step`         |

Consequences:
- A plan with mixed `<red>` and `<actions>` blocks is classified as **`tddab`** as a
  whole (the executor still runs each block by its own nature where relevant). If you
  want a pure `step` plan, make every block an `<actions>` block.
- `tddab` blocks get the full RED → GREEN → VERIFY → CROSS-CHECK → COMMIT cycle and
  commit with `feat:`. `step` blocks get EXECUTE → VERIFY → COMMIT and commit with
  `chore:`.

---

## 6. Compiled output: `.cvm/uplan.json`

`parsePlan` writes this artifact (backing up any previous one to `.bak`). You normally
do not produce it directly, but understanding it clarifies what the parser keeps:

```jsonc
{
  "type": "tddab",                       // or "step"
  "mission": "PROJECT: …",               // full mission text
  "sourceFile": "/abs/path/plan.md",     // index (or the single file)
  "sourceFiles": ["/abs/index.md", …],   // multi-file only: all source paths
  "blocks": [
    {
      "id": "01-parser",
      "title": "Make Mission Optional in Parser",
      "intro": "…",                      // full intro text
      "red": "- test: …\n- test: …",     // joined item lines (test OR action)
      "redKeys": ["parsetddabplan_with_…", …],  // normalized keys, see below
      "success": "- [ ] …\n- [ ] …",     // joined checklist
      "planRef": "See /abs/01-parser.md lines 3-51"  // back-pointer to source
    }
  ]
}
```

Key points:
- **`planRef`** is how detail survives. The parser keeps only the structured items; the
  full `### Implementation` prose, code snippets, etc. stay in the source file and the
  executor is told to read them via `planRef`. **Put rich implementation guidance in the
  block body** — it is not lost, it is referenced.
- **`redKeys`** are derived from each `red`/`action` item by: strip non-alphanumeric
  (keep spaces), trim, take first 40 chars, collapse spaces to `_`, lowercase. They are
  used by the executor's CROSS-CHECK phase to confirm each test actually exists.

---

## 7. Execution model (what authors should know)

For each block, in order, `planexecutor` hands the agent these tasks one at a time (the
agent does the work and reports back after each; CVM advances only on the agent's reply):

**`tddab` block:**
1. **RED** — write only the failing tests from `<red>`.
2. **GREEN** — implement the minimum to pass; reads `planRef` for detail.
3. **VERIFY** — prove every `<success>` item with file:line evidence → `passed`/`failed`.
4. **FIX / RE-VERIFY** loop until `passed`.
5. **CROSS-CHECK** — confirm each `redKeys` test physically exists; fix loop if not.
6. **UPDATE MEMORY BANK**, then **COMMIT** (`feat: <title>`).

**`step` block:**
1. **EXECUTE** the `<actions>`.
2. **VERIFY** `<success>` → fix loop.
3. **UPDATE MEMORY BANK**, then **COMMIT** (`chore: <title>`).

**Resume:** completed block ids are appended to `.cvm/uplan-progress.json`; on restart
those blocks are skipped. Delete that file to re-run from scratch.

Design implications for authors:
- Blocks should be **independently verifiable** and **ordered by dependency** (a block
  may depend on earlier ones; say so in `<intro>`).
- `<success>` items must be **objectively checkable** (the agent must be able to point at
  code/tests). Vague criteria stall the FIX loop.
- `<red>`/`<actions>` items should be **specific enough to write directly**.

---

## 8. Validation rules (hard errors)

`parsePlan` rejects the plan (no `uplan.json` written) on any of:

| Condition | Message (shape) |
|-----------|-----------------|
| No `<mission>` (when required) | `Missing <mission> tag` |
| Empty `<mission>` | `<mission> tag is empty` |
| `id` not `NN-kebab-case` | `Block id "X" must be NN-kebab-case format` |
| Duplicate `id` | `Duplicate block id "X"` |
| Block never closed | `Block "X" never closed with </block>` |
| Missing/empty `<intro>` | `Block "X" missing <intro> tag` / `has empty <intro>` |
| Missing `<red>`/`<actions>` | `Block "X" missing <red> or <actions> tag` |
| `<red>`/`<actions>` with no items | `Block "X" has <red>/<actions> but no "- test:"/"- action:" lines` |
| Missing `<success>` | `Block "X" missing <success> tag` |
| `<success>` with no `- [ ]` items | `Block "X" has <success> but no "- [ ]" items` |
| No blocks at all (when required) | `No <block> tags found` |
| (multi-file) sub-file not found | `Sub-file not found: F` |
| (multi-file) duplicate id across files | `Duplicate block id "X" in F` |

Errors are reported with 1-based line numbers.

---

## 9. Complete examples

### 9.1 Single-file `tddab` plan

```markdown
# TDDAB Plan: Add slug helper

<mission>
PROJECT: Add a slug() helper to packages/util.
TECH STACK: TypeScript, Vitest. Tests: npx nx test util.
RULES: pure function, no deps.
</mission>

<block id="01-slug-basic">
## TDDAB-1: Basic slugify

<intro>
Add slug(s: string): string in packages/util/src/lib/slug.ts.
Test file: packages/util/src/lib/slug.spec.ts.
</intro>

<red>
- test: slug("Hello World") returns "hello-world"
- test: slug("  A  B ") trims and collapses spaces
</red>

### Implementation
Lowercase, trim, replace non-alphanumerics with single hyphens.

<success>
- [ ] slug() exported from slug.ts
- [ ] both tests pass: npx nx test util -- slug
</success>
</block>
```

### 9.2 Multi-file plan

**`index.md`**
```markdown
# Plan: Feature X

<mission>
PROJECT: Build feature X across parser and services layers.
</mission>

<files>
- 01-parser.md
- 02-services.md
</files>
```

**`01-parser.md`** (no mission)
```markdown
# Parser Layer

<block id="01-parse-token">
## TDDAB-1: Tokenizer
<intro>Add tokenizer in parser.ts. Test: parser.spec.ts.</intro>
<red>
- test: tokenize("a b") returns ["a","b"]
</red>
<success>
- [ ] tokenize exported and test passes
</success>
</block>
```

### 9.3 `step` plan (all actions)

```markdown
# Step Plan: Release prep

<mission>
PROJECT: Prepare the 1.2.0 release.
</mission>

<block id="01-bump-version">
## TDDAB-1: Bump version
<intro>Update package.json version to 1.2.0.</intro>
<actions>
- action: set version to 1.2.0 in package.json
- action: update CHANGELOG.md with the 1.2.0 section
</actions>
<success>
- [ ] package.json shows 1.2.0
- [ ] CHANGELOG has a 1.2.0 entry dated today
</success>
</block>
```

---

## 10. Authoring checklist (for generators)

- [ ] Exactly one `<mission>` (single-file) or one mission in the index (multi-file).
- [ ] Every block id is `NN-kebab-case` and globally unique.
- [ ] Every block has a non-empty `<intro>`.
- [ ] Every block has `<red>` (≥1 `- test:`) **or** `<actions>` (≥1 `- action:`).
- [ ] Every block has `<success>` with ≥1 `- [ ]` item, all objectively checkable.
- [ ] Blocks ordered by dependency; cross-block deps stated in `<intro>`.
- [ ] Rich implementation detail placed in the block body (reachable via `planRef`).
- [ ] For a pure `step` plan, **all** blocks use `<actions>`.
- [ ] Validate with `parsePlan` before shipping; fix any `line N:` errors.
