# TDDAB Plan: PlanExecutor Resume Capability
**Date:** 2026-05-25

<mission>
PROJECT: CVM (Cognitive Virtual Machine) - an algorithmic TODO manager for Claude.
CVM compiles TypeScript-subset programs into bytecode and executes them in a stack-based VM.
CC() calls pause execution and create prompts for Claude. Claude responds, VM continues.

TECH STACK: TypeScript 5.8.2, Node.js 18.16+, Nx 21.2.0 monorepo, Vitest 3.0.0.
All imports require .js extension (moduleResolution: nodenext).

MCP SERVER: packages/mcp-server/src/lib/mcp-server.ts — CVMMcpServer class.
Tools registered via this.server.tool(name, zodSchema, handler) in setupTools() method.
Imports: import { z } from 'zod'; import { readFile, writeFile, mkdir } from 'fs/promises';
Error pattern: try/catch returning { content: [...], isError: true }.

CVM LANGUAGE SUBSET (for .ts programs executed by CVM):
var/const/let, while, for, for-of, for-in, if/else, switch,
arrays, objects, string concat with +, CC(), console.log(), JSON.stringify(),
property access, fs.readFile(), fs.writeFile(), fs.listFiles().
NO: arrow functions, async/await, destructuring, template literals, ++/--.

SANDBOX: CVM programs access files via SandboxedFileSystem.
fs.readFile(path) returns string | null. fs.writeFile(path, content) returns boolean.

EXISTING STATE:
- parsePlan MCP tool: reads plan.md → saves .cvm/uplan.json (overwrites always)
- planexecutor: CVM program at test/programs/tddab/planexecutor.ts + apps/cvm-server/programs/
- planexecutor tracks completedBlocks array in memory during execution
- planexecutor reads .cvm/uplan.json at startup

WHAT WE ARE ADDING:
1. Progress persistence — planexecutor saves .cvm/uplan-progress.json after each block
2. Resume on restart — planexecutor reads progress file and skips completed blocks
3. Backup on parsePlan — parsePlan renames old uplan.json to uplan.json.bak before writing new
4. Reset mechanism — deleting uplan-progress.json restarts from scratch

FLOW AFTER CHANGES:
- Normal run: executor saves progress after each COMMIT, resumes if restarted
- Plan fix: user stops → fixes plan.md → parsePlan (backs up old, writes new) → restart executor → skips done blocks
- Full reset: delete .cvm/uplan-progress.json → executor starts from block 01

BUILD/VERIFY: npx nx test mcp-server, npx nx run-many --target=build --all.
E2E tests: ./test/programs/run-test.sh 11-tddab/<test>.ts [responses...]
</mission>

<block id="01-progress-persist">
## TDDAB-1: PlanExecutor Progress Persistence

<intro>
Modify planexecutor.ts to write .cvm/uplan-progress.json after each completed block.
The file contains the list of completed block IDs so execution can resume.

Files to modify:
- test/programs/tddab/planexecutor.ts — single source of truth (viteStaticCopy copies to dist)

After the line `completedBlocks.push(block.id)`, add:
```
fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
```

This writes a simple JSON array: ["01-greet", "02-farewell"]

At startup (before the while loop), read progress and skip completed blocks:
```
var progressRaw = fs.readFile(".cvm/uplan-progress.json");
var skipBlocks = [];
if (progressRaw !== null) {
  skipBlocks = JSON.parse(progressRaw);
  console.log("Resuming: " + skipBlocks.length + " blocks already completed");
}
```

Inside the while loop, at the top, check if current block should be skipped:
```
if (skipBlocks.indexOf(block.id) >= 0) {
  console.log("SKIP block " + block.id + " (already completed)");
  completedBlocks.push(block.id);
  blockIndex = blockIndex + 1;
  continue;
}
```

Note: CVM does not support Array.includes() — use indexOf() >= 0.

E2E test: test/programs/11-tddab/planexecutor-resume.ts
- Writes uplan-progress.json with ["01-alpha"] before execution
- Has 2 blocks (01-alpha, 02-beta)
- Expects block 01-alpha to be SKIPPED
- Only block 02-beta goes through RED/GREEN/VERIFY/COMMIT
</intro>

<red>
- test: planexecutor skips blocks listed in uplan-progress.json
- test: planexecutor logs "SKIP block 01-alpha (already completed)"
- test: planexecutor executes remaining blocks normally after skipping
- test: planexecutor writes updated progress after each new block completion
- test: planexecutor works normally when no progress file exists (fresh start)
</red>

### Implementation

planexecutor.ts changes (insert after `var completedBlocks = [];`):

```typescript
var progressRaw = fs.readFile(".cvm/uplan-progress.json");
var skipBlocks = [];
if (progressRaw !== null) {
  skipBlocks = JSON.parse(progressRaw);
  console.log("Resuming: " + skipBlocks.length + " blocks already completed");
}
```

Inside while loop, after `var block = blocks[blockIndex];`:

```typescript
if (skipBlocks.indexOf(block.id) >= 0) {
  console.log("SKIP block " + block.id + " (already completed)");
  completedBlocks.push(block.id);
  blockIndex = blockIndex + 1;
  continue;
}
```

After `completedBlocks.push(block.id);`:

```typescript
fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
```

E2E test (planexecutor-resume.ts):
```typescript
/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

function main() {
  // Setup: write progress showing block 01 already done
  fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(["01-alpha"]));

  // Write uplan with 2 blocks
  var testPlan = JSON.stringify({
    "mission": "Test resume capability",
    "sourceFile": "resume-test.md",
    "blocks": [
      { "id": "01-alpha", "title": "Alpha", "intro": "Already done", "red": "- test: alpha", "success": "- [ ] alpha", "planRef": "lines 1-5" },
      { "id": "02-beta", "title": "Beta", "intro": "Needs work", "red": "- test: beta", "success": "- [ ] beta", "planRef": "lines 6-10" }
    ]
  });
  fs.writeFile(".cvm/uplan.json", testPlan);

  // Now execute like planexecutor does
  var raw = fs.readFile(".cvm/uplan.json");
  var data = JSON.parse(raw);
  var blocks = data.blocks;
  var completedBlocks = [];

  var progressRaw = fs.readFile(".cvm/uplan-progress.json");
  var skipBlocks = [];
  if (progressRaw !== null) {
    skipBlocks = JSON.parse(progressRaw);
    console.log("Resuming: " + skipBlocks.length + " blocks already completed");
  }

  CC("MISSION BRIEFING: " + data.mission + " Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];

    if (skipBlocks.indexOf(block.id) >= 0) {
      console.log("SKIP block " + block.id + " (already completed)");
      completedBlocks.push(block.id);
      blockIndex = blockIndex + 1;
      continue;
    }

    var progress = (blockIndex + 1) + "/" + blocks.length;
    CC("RED PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");
    CC("GREEN PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    var testResult = CC("VERIFY PHASE [" + progress + "] block " + block.id + ". Respond with passed or failed.");

    while (testResult === "failed") {
      CC("FIX PHASE block " + block.id + ". Respond with done when complete.");
      testResult = CC("RE-VERIFY block " + block.id + ". Respond with passed or failed.");
    }

    CC("COMMIT PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");
    completedBlocks.push(block.id);
    fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
    console.log("Block " + block.id + " COMPLETED");
    blockIndex = blockIndex + 1;
  }

  console.log("=== ALL BLOCKS COMPLETED ===");
  CC("FINAL REVIEW: All blocks done. Respond with done when complete.");
  console.log("Completed: " + JSON.stringify(completedBlocks));
}
```

CC Responses needed: "done" "done" "done" "passed" "done" "done"
(MISSION, RED[02], GREEN[02], VERIFY[02]→passed, COMMIT[02], FINAL)

<success>
- [ ] planexecutor-resume.ts logs "SKIP block 01-alpha (already completed)"
- [ ] planexecutor-resume.ts only triggers CC for block 02-beta (not 01-alpha)
- [ ] planexecutor-resume.ts writes updated progress after block 02 completion
- [ ] existing tests (planexecutor-test, retry, multiblock, multi-retry, missing) still pass
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="02-parseplan-backup">
## TDDAB-2: parsePlan Backup Before Overwrite

<intro>
Modify the parsePlan MCP tool to rename the existing uplan.json to uplan.json.bak
before writing the new one. This preserves the previous state for debugging.

Files to modify:
- packages/mcp-server/src/lib/mcp-server.ts — add rename before writeFile in parsePlan handler

Use fs/promises `rename` to move uplan.json → uplan.json.bak. If uplan.json doesn't
exist yet (first run), skip the rename (catch ENOENT silently).

Add import: `import { readFile, writeFile, mkdir, rename } from 'fs/promises';`
(rename added to existing import)

In parsePlan handler, before `await writeFile(uplanPath, ...)`:
```typescript
try { await rename(uplanPath, uplanPath + '.bak'); } catch {}
```

Test: add test case to mcp-server-parseplan.spec.ts verifying .bak file exists
after second parsePlan call.
</intro>

<red>
- test: parsePlan creates uplan.json.bak when overwriting existing uplan.json
- test: parsePlan works on first run when no uplan.json exists (no .bak created)
- test: uplan.json.bak contains the previous plan content
</red>

### Implementation

In packages/mcp-server/src/lib/mcp-server.ts, change import:
```typescript
import { readFile, writeFile, mkdir, rename } from 'fs/promises';
```

In parsePlan handler, before the writeFile line:
```typescript
const uplanPath = resolve(dataDir, 'uplan.json');
try { await rename(uplanPath, uplanPath + '.bak'); } catch {}
await writeFile(uplanPath, JSON.stringify(uplanData, null, 2), 'utf-8');
```

Test in mcp-server-parseplan.spec.ts:
```typescript
it('should create uplan.json.bak when overwriting', async () => {
  // First call
  await transport.callTool('parsePlan', { filePath: planFile });
  // Second call
  await transport.callTool('parsePlan', { filePath: planFile });

  const bakContent = await readFile(join(dataDir, 'uplan.json.bak'), 'utf-8');
  const bak = JSON.parse(bakContent);
  expect(bak.mission).toContain('Test project context');
});
```

<success>
- [ ] parsePlan creates uplan.json.bak on second call
- [ ] parsePlan works fine on first call (no previous file)
- [ ] uplan.json.bak has the content from the previous uplan.json
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

## Execution Order
```
01-progress-persist → no dependencies (modifies planexecutor + adds E2E test)
02-parseplan-backup → no dependencies (modifies parsePlan tool + adds unit test)
```

## BTLT Checkpoints
After each block: Build, TypeCheck, Lint, Test (zero failures).
