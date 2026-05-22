# TDDAB Planner Mindset v2

## What is TDDAB?
**Test Driven Development Atomic Block** - Each block is:
- **Test-First**: Write FAILING tests before implementation
- **Atomic**: Complete, self-contained, independently deployable
- **Block**: Cohesive unit of functionality

### The Three Sacred Phases
```
1. RED Phase    → Write tests that FAIL
2. GREEN Phase  → Write code to make tests PASS
3. VERIFY Phase → Confirm atomic deployment works
```

---

## TDDAB Plan Format

### Required Tags

Plans use lightweight XML tags for machine-parseable structure.
Keep markdown readable — tags mark boundaries, not replace content.

| Tag | Where | Purpose |
|-----|-------|---------|
| `<mission>` | Once, top of plan | Full project context — enough that any block can execute on clean context |
| `<block id="NN-name">` | Wraps each TDDAB | Block boundary with unique id |
| `<intro>` | Inside block | Context: what, why, dependencies, files |
| `<red>` | Inside block | Test definitions (bullet list) |
| `<success>` | Inside block | Checklist of verifiable outcomes that must ALL pass |

### Plan Template

```markdown
# TDDAB Plan: [Feature Name]
**Date:** YYYY-MM-DD

<mission>
[Full project context — architecture, tech stack, patterns, conventions,
file structure, testing approach, build commands. Must contain enough
information that ANY block can be executed on a completely clean context
without prior knowledge. This becomes the first CC() prompt when executed
by CVM. Think of it as the briefing document for a developer who just
walked into the project.]
</mission>

<block id="01-short-name">
## TDDAB-1: [Block Title]

<intro>
[What this block does. Dependencies on previous blocks.
Files to create/modify. Key decisions already made.]
</intro>

<red>
- test: [first test that must fail then pass]
- test: [second test]
- test: [third test]
</red>

### Implementation
[Exact steps, complete code, full file paths.
No snippets, no "...", no TODOs, no pseudo-code.]

<success>
- [ ] [first verifiable outcome that must pass]

- [ ] [second verifiable outcome that must pass]
- [ ] [third verifiable outcome that must pass]
</success>
</block>

<block id="02-next-thing">
## TDDAB-2: [Next Block]
...same structure...
</block>
```

### Tag Rules
1. `<mission>` — EXACTLY once, before first block, must be comprehensive enough for clean-context execution
2. `<block id="">` — id format: `NN-kebab-case`, must be unique
3. `<intro>` — MUST be self-sufficient (executable with zero prior context)
4. `<red>` — each line starts with `- test:`, describes ONE testable behavior
5. `<success>` — checklist of verifiable outcomes (`- [ ]` format), ALL must pass
6. Tags can span multiple lines
7. No nesting tags inside other tags (except all tags are inside `<block>`)
8. Standard markdown between tags is preserved for human reading

---

## WHAT A TDDAB PLAN IS NOT

### NEVER Include:
- Options or alternatives ("Should we A or B?")
- Decisions to be made later
- Discussion or analysis
- "Investigation needed" sections
- "Consider using..." phrases
- Multiple approaches

### NEVER Write:
```
// WRONG - This is discussion, not a plan
"Option A: Use library X"
"Option B: Build custom solution"

// WRONG - This is not executable
"Investigate if we need..."
"Consider whether..."
```

---

## TDDAB Planning Rules

### 1. Information Self-Sufficiency (CRITICAL!)
**Each TDDAB must be executable with ZERO context:**
- Include COMPLETE code, not snippets
- Show FULL file paths, not relative references
- Include ALL necessary imports
- Never reference "previous discussion" or "as we decided"
- Never use "..." or "rest remains the same"
- `<mission>` must contain enough project context that ANY block works on clean context

**Why:** Plans are executed in fresh context or by CVM where only one block is visible at a time. The `<mission>` is the only briefing Claude gets — it must cover architecture, stack, patterns, commands.

### 2. Preliminary Work Handling
**Merge non-testable setup into first TDDAB implementation:**
- Package additions → Part of TDDAB-1 implementation
- Configuration changes → Part of implementation phase
- File deletions → Part of implementation phase

**NEVER create separate "setup" or "preparation" blocks**

### 3. Atomic Block Rules
Each TDDAB must be:
- **Deployable alone** — System works after this block
- **Rollback-able** — Can revert with `git revert HEAD`
- **Complete** — No dependencies on future blocks
- **Tested** — Has tests that prove it works

### 4. Test-First Enforcement
```
CORRECT:
1. Write failing test       (RED)
2. Write implementation     (GREEN)
3. Verify tests pass        (VERIFY)
4. Commit and push          (COMMIT)

WRONG:
1. Write implementation
2. Write tests afterward
```

---

## TDDAB Size Guidelines

### Ideal TDDAB Size:
- **Tests**: 3-5 test cases
- **Files**: 1-3 files modified
- **Lines**: 50-200 lines total
- **Scope**: Single cohesive feature

### Too Large (Split It):
- Modifies > 5 files
- Multiple unrelated features
- Can't deploy independently

### Too Small (Merge It):
- Single test case
- < 10 lines of code
- Just config changes

---

## TDDAB Naming Convention

```
<block id="NN-kebab-case-name">
## TDDAB-N: [Verb] [Feature] [Context]
```

Examples:
```
<block id="01-add-auth-config">
## TDDAB-1: Add Authentication Configuration

<block id="02-replace-jwt-oauth">
## TDDAB-2: Replace JWT with OAuth Provider

<block id="03-update-claims-logic">
## TDDAB-3: Update Claims Extraction Logic
```

id matches the block number and a short descriptive slug.

---

## Execution Order Section

Every plan MUST end with an execution order showing dependencies:

```markdown
## Execution Order
01-first-thing    → no dependencies
02-second-thing   → depends on 01
03-third-thing    → depends on 01, 02
04-parallel-thing → depends on 01 (can run parallel with 02-03)
```

---

## TDDAB Quality Checklist

For each block, verify:
- [ ] Has unique `<block id="">`
- [ ] Has `<intro>` with full context
- [ ] Has `<red>` with testable behaviors
- [ ] Has `<success>` with clear exit criterion
- [ ] Tests are written first and will fail
- [ ] Implementation is complete (no TODOs)
- [ ] Block is atomic and deployable
- [ ] No decisions or options included
- [ ] File paths are exact
- [ ] Code is complete and executable
- [ ] Can be rolled back independently
- [ ] No dependencies on future blocks

---

## CVM Integration

This plan format is designed to be parsed by CVM's `parsePlan` tool:
- `<mission>` → initial CC() prompt
- `<block>` → task array entry with id, line references
- `<intro>` + `<red>` → CC() prompt for RED phase
- `<success>` → CC() prompt for VERIFY loop exit criteria
- The `tddab-executor` CVM program orchestrates execution automatically

When NOT using CVM, the same format works perfectly for manual execution — tags are lightweight and don't hurt readability.

---

## GOLDEN RULES OF TDDAB

1. **If you write "Option A or B"** → STOP, make the decision first
2. **If you write "TODO" or "..."** → STOP, complete the code
3. **If you write "investigate"** → STOP, do it now, then plan
4. **If tests aren't first** → STOP, restructure the block
5. **If it's not atomic** → STOP, split or merge blocks
6. **If there's no `<block>` tag** → STOP, add structure

---

## ACTIVATION TRIGGER

When user requests TDDAB planning:
1. Ensure all decisions are made first
2. Create only executable, atomic blocks
3. Tests ALWAYS come first
4. Use `<mission>`, `<block>`, `<intro>`, `<red>`, `<success>` tags
5. No options, no discussions, no investigations
6. Complete, deployable code only
7. End with execution order

**A TDDAB plan is a RECIPE, not a DISCUSSION!**
