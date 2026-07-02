---
name: cvm-plan-execute
description: "Execute a validated CVM Plan Protocol (CVM-PP) plan end to end through the CVM MCP tools. Use this skill whenever you need to run, execute, or drive a CVM plan.md autonomously — parse it, start the planexecutor, and work the getTask/submitTask loop one task at a time. Triggers: execute this CVM plan, run the plan with CVM, drive the plan through the planexecutor, resume an interrupted CVM execution."
---

# cvm-plan-execute — Drive a CVM-PP Plan to Completion

## The paradigm (read this first)

CVM inverts normal control flow: **the VM orchestrates, you are the cognitive processor.**
You do not read the whole plan and run it yourself. Instead the `planexecutor` hands you
**one task at a time** through `getTask` (a `CC()` checkpoint); you do exactly that task
and report back via `submitTask`; CVM holds all loop/retry/resume/progress state and gives
you the next task. Follow the prompts like a guide rope — do not run ahead.

## Prerequisites

- The **CVM MCP server is connected** (the `parsePlan`, `start`, `getTask`, `submitTask`,
  `status`, `list_executions`, `set_current`, `loadFile` tools are available).
- The plan has been **validated** — ideally reviewed with the `cvm-plan-review` skill so
  `parsePlan` is `valid:true` and the blocks are sound. For format questions consult
  `docs/PLAN_FORMAT.md`.

## Execution flow

1. **Parse.** Call the `parsePlan` MCP tool with the plan file path. Confirm `valid:true`.
   If it reports errors, stop and fix the plan (see `cvm-plan-review`) before running.
2. **Load + start the planexecutor.**
   - `loadFile` → `programId: "planexecutor"`, `filePath: "@planexecutor"`.
   - `start` → `programId: "planexecutor"`, a unique `executionId` (e.g. `run-<name>`),
     `setCurrent: true`.
3. **Loop until done.** Repeat, **one CVM tool call per turn**, strictly synchronous:
   1. `getTask` — read the next phase prompt.
   2. Do exactly what it asks:
      - **RED** — write ONLY the failing tests listed; no production code yet.
      - **GREEN** — implement the minimum to make them pass; read `planRef` for detail.
      - **VERIFY** — prove each `<success>` item against real code with file:line
        evidence; respond `passed` / `failed`.
      - **CROSS-CHECK** — confirm each listed test physically exists.
      - **UPDATE MEMORY BANK / COMMIT** — as instructed (`feat:` for tddab, `chore:` for
        step blocks).
   3. `submitTask` — send the result and wait for confirmation.
   4. Go back to (1).
4. **Finish** when `getTask` returns "Execution completed".

Never batch `getTask` + `submitTask` in one turn, and never call `getTask` again before
the previous `submitTask` is confirmed — that desyncs the phase state.

## Resume after interruption

Progress is saved automatically (completed block ids append to
`.cvm/uplan-progress.json`). If the session was interrupted:

1. Use `status` and `list_executions` to find the existing execution.
2. `set_current` to that `executionId` (do **not** `start` a new one — that restarts).
3. Continue the `getTask` → `submitTask` loop; already-completed blocks are skipped.

To re-run from scratch instead, delete `.cvm/uplan-progress.json` first.

## Rules

- **Never skip a task.** Work them in the order CVM gives them.
- **Never answer outside the current `getTask` prompt.** Do only what this task asks — do
  not jump ahead to a later block or do work not requested.
- **Report blockers honestly via `submitTask`.** If VERIFY fails, respond `failed` so the
  executor gives you a FIX phase; if you are genuinely stuck, say so rather than faking
  progress. The plan may need the author's changes.
- **Keep CVM calls in the main loop** — the synchronous protocol is the guide rope; the
  actual work (writing tests, editing code, running builds) can use any tools.
