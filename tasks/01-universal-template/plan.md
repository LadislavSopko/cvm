# TDDAB Plan: parsePlan Tool + PlanExecutor
**Date:** 2026-05-23

<mission>
PROJECT: CVM (Cognitive Virtual Machine) - an algorithmic TODO manager for Claude.
CVM compiles TypeScript-subset programs into bytecode and executes them in a stack-based VM.
CC() calls pause execution and create prompts for Claude. Claude responds, VM continues.
CVM is a prompt orchestrator - it never executes code, never runs tests, never touches files.

TECH STACK: TypeScript 5.8.2, Node.js 18.16+, Nx 21.2.0 monorepo, Vitest 3.0.0.
All imports require .js extension (moduleResolution: nodenext).
Packages: parser, types, storage, mongodb, vm, mcp-server. App: cvm-server.

MCP SERVER: packages/mcp-server/src/lib/mcp-server.ts — CVMMcpServer class.
Tools registered via this.server.tool(name, zodSchema, handler) in setupTools() method.
Imports: import { z } from 'zod'; import { readFile } from 'fs/promises'; import { resolve } from 'path';
Error pattern: try/catch returning { content: [...], isError: true }.
Test pattern: vi.mock('@cvm/vm') + TestTransport (packages/mcp-server/src/lib/test-transport.ts).
Tests: packages/mcp-server/src/lib/mcp-server.spec.ts (uses vi.mock for VMManager).

CVM LANGUAGE SUBSET (for .ts programs executed by CVM):
var/const/let, while, for, for-of, for-in, if/else, switch,
arrays, objects, string concat with +, CC(), console.log(), JSON.stringify(),
property access, fs.readFile(), fs.writeFile(), fs.listFiles().
NO: arrow functions, async/await, destructuring, template literals, ++/--.

SANDBOX: CVM programs access files via SandboxedFileSystem (packages/vm/src/lib/file-system.ts).
Sandbox paths configured via CVM_SANDBOX_PATHS or CVM_SANDBOX_ROOT env vars.
fs.readFile(path) returns string | null. fs.writeFile(path, content) returns boolean.

STORAGE: FileStorageAdapter stores programs/executions in CVM_DATA_DIR (default .cvm).
Structure: .cvm/programs/, .cvm/executions/, .cvm/outputs/.
StorageFactory resolves config from env vars or defaults.

VMMANAGER: packages/vm/src/lib/vm-manager.ts — VMManager class.
constructor(storageAdapter?, fileSystem?) — both optional, defaults from env.
Key methods: loadProgram(id, source), startExecution(programId, execId),
getNext(execId), reportCCResult(execId, result), getExecutionStatus(execId).

EXISTING TOOLS: load, loadFile, start, getTask, submitTask, status,
list_executions, get_execution, set_current, delete_execution,
list_programs, delete_program, restart.

TDDAB PLAN FORMAT (5 XML tags in markdown):
- <mission> — once, top of plan, full project context
- <block id="NN-name"> — wraps each TDDAB block
- <intro> — what, why, dependencies, files
- <red> — test definitions as "- test:" bullet list
- <success> — checklist of verifiable outcomes "- [ ]" format

WHAT WE ARE BUILDING:
1. Parser module (tddab-parser.ts) — reads TDDAB plan markdown, extracts blocks into JSON
2. MCP tool parsePlan — wraps parser, reads plan file, saves uplan.json to CVM data dir, returns validity
3. PlanExecutor (planexecutor.ts) — predefined CVM program that reads uplan.json and executes
   TDDAB blocks with 4 CC() calls per block: RED → GREEN → VERIFY → COMMIT + fix loop

The parsePlan tool is the ONLY new MCP tool. The planexecutor is loaded via existing
loadFile tool. No code generation — the executor is a static program, the plan data is dynamic.

WORKING PROTOTYPE: tasks/poc/ contains:
- validate-plan.ts — proven parser implementation (parseTddabPlan function + types)
- universal-executor.ts — proven executor that reads plan-data.json via fs.readFile()
- plan-data.json — example of parsed plan data structure

BUILD/VERIFY: npx nx test mcp-server, npx nx run-many --target=build --all.
</mission>

<block id="01-parser-module">
## TDDAB-1: TDDAB Plan Parser Module

<intro>
Create a standalone parser module that reads a TDDAB plan markdown string and
extracts blocks into structured JSON. Pure logic — no MCP integration, no file I/O.
Line-by-line state machine approach.

Reference implementation: tasks/poc/validate-plan.ts parseTddabPlan function.
Port it to production code with proper types and error handling.

Files to create:
- packages/mcp-server/src/lib/tddab-parser.ts — parser module
- packages/mcp-server/src/lib/tddab-parser.spec.ts — unit tests

Types to export from tddab-parser.ts:

```typescript
export interface TddabBlock {
  id: string;
  title: string;
  intro: string;
  redTests: string[];
  success: string[];
  startLine: number;
  endLine: number;
}

export interface TddabPlan {
  mission: string;
  blocks: TddabBlock[];
  sourceFile: string;
}

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  valid: boolean;
  plan: TddabPlan | null;
  errors: ParseError[];
}

export function parseTddabPlan(markdown: string, sourceFile: string): ParseResult;
```

Parser returns ParseResult (not throws). valid=true when plan and all blocks pass validation.
errors array populated with line numbers for all issues found.

Parser strategy (from POC):
1. Scan for <mission> tag — extract content until </mission>
2. Scan for <block id="..."> — record startLine, extract id
3. Inside block: find ## TDDAB-N: title, extract <intro>, <red>, <success>
4. On </block> — record endLine, push to array
5. Red parsing: lines matching "- test:" prefix, strip prefix
6. Success parsing: lines matching "- [ ]" prefix, strip prefix
7. Validate: mission exists + not empty, no duplicate ids, all blocks have required tags
8. Block id format: NN-kebab-case (regex: /^\d{2}-[a-z0-9]+(-[a-z0-9]+)*$/)

Test file: packages/mcp-server/src/lib/tddab-parser.spec.ts
Import from: import { parseTddabPlan, ParseResult, TddabPlan } from './tddab-parser.js';
</intro>

<red>
- test: parseTddabPlan extracts mission text from mission tag
- test: parseTddabPlan extracts all blocks with correct ids
- test: each parsed block has intro, redTests array, and success array
- test: startLine and endLine are accurate for each block (1-indexed)
- test: returns valid=false with error on missing mission tag
- test: returns valid=false with error on duplicate block ids
- test: returns valid=false with error on missing required tags inside block
- test: handles multi-line content in all tags correctly
- test: block id validation rejects invalid formats
- test: returns valid=false when plan has zero blocks
</red>

### Implementation

Port parseTddabPlan from tasks/poc/validate-plan.ts (lines 25-213):
- Change return type from { plan, errors } to ParseResult { valid, plan, errors }
- valid = errors.length === 0
- Keep ValidationError as ParseError (same shape: { line, message })
- Remove CLI code, export only the parser function and types
- Remove escapeString, generatePlanData, generateExecutorSource — not needed here

Test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { parseTddabPlan } from './tddab-parser.js';

describe('parseTddabPlan', () => {
  it('should extract mission text', () => {
    const md = '<mission>\nProject context here\n</mission>\n<block id="01-test">\n## TDDAB-1: Test\n<intro>intro</intro>\n<red>\n- test: something\n</red>\n<success>\n- [ ] it works\n</success>\n</block>';
    const result = parseTddabPlan(md, 'test.md');
    expect(result.valid).toBe(true);
    expect(result.plan?.mission).toBe('Project context here');
  });

  it('should return valid=false on missing mission', () => {
    const md = '<block id="01-test">\n## TDDAB-1: Test\n<intro>intro</intro>\n<red>\n- test: x\n</red>\n<success>\n- [ ] y\n</success>\n</block>';
    const result = parseTddabPlan(md, 'test.md');
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({ message: expect.stringContaining('mission') }));
  });
});
```

Run: npx nx test mcp-server

<success>
- [ ] parseTddabPlan extracts mission text correctly from single and multi-line mission tags
- [ ] parseTddabPlan returns all blocks with correct ids and titles
- [ ] each parsed block has intro string, redTests string array, success string array
- [ ] startLine and endLine are accurate per block (1-indexed)
- [ ] returns valid=false with descriptive error on missing mission tag
- [ ] returns valid=false with descriptive error on duplicate block ids
- [ ] returns valid=false on missing intro/red/success tags inside block
- [ ] returns valid=false when plan has zero blocks
- [ ] block id validation rejects non-NN-kebab-case ids
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="02-mcp-parse-tool">
## TDDAB-2: MCP Tool parsePlan

<intro>
Register parsePlan as a new MCP tool in the CVM server. The tool reads a plan
markdown file from disk, parses it, and if valid saves the parsed data as
uplan.json in the CVM data directory. Returns validity status with block count
or validation errors. Each call overwrites uplan.json (one active plan per project).

Depends on block 01 (parser module).

Files to modify:
- packages/mcp-server/src/lib/mcp-server.ts — add import + tool registration

The tool saves uplan.json in the same directory the FileStorageAdapter uses
(.cvm/ by default). The path is resolved from CVM_DATA_DIR env var or defaults to '.cvm'.
The JSON structure matches what the planexecutor expects:

```json
{
  "mission": "...",
  "sourceFile": "path/to/plan.md",
  "blocks": [
    {
      "id": "01-name",
      "title": "Block Title",
      "intro": "...",
      "red": "- test one\n- test two",
      "success": "- [ ] criterion one\n- [ ] criterion two",
      "planRef": "See plan.md lines 10-30"
    }
  ]
}
```

Note: red and success are joined strings (not arrays) in uplan.json because
the planexecutor is a CVM program and works with string concatenation in CC() prompts.

Tool registration follows existing pattern in setupTools():

```typescript
import { parseTddabPlan } from './tddab-parser.js';
import { writeFile, mkdir } from 'fs/promises';

this.server.tool(
  'parsePlan',
  { filePath: z.string() },
  async ({ filePath }) => {
    try {
      const resolvedPath = resolve(filePath);
      const markdown = await readFile(resolvedPath, 'utf-8');
      const result = parseTddabPlan(markdown, filePath);

      if (!result.valid) {
        const errorText = result.errors.map(e => `line ${e.line}: ${e.message}`).join('\n');
        return {
          content: [{ type: 'text', text: `Plan validation failed:\n${errorText}` }],
          isError: true
        };
      }

      const plan = result.plan!;
      const uplanData = {
        mission: plan.mission,
        sourceFile: plan.sourceFile,
        blocks: plan.blocks.map(b => ({
          id: b.id,
          title: b.title,
          intro: b.intro,
          red: b.redTests.map(t => '- ' + t).join('\n'),
          success: b.success.map(s => '- [ ] ' + s).join('\n'),
          planRef: `See ${plan.sourceFile} lines ${b.startLine}-${b.endLine}`,
        })),
      };

      const dataDir = resolve(process.env['CVM_DATA_DIR'] || '.cvm');
      await mkdir(dataDir, { recursive: true });
      const uplanPath = resolve(dataDir, 'uplan.json');
      await writeFile(uplanPath, JSON.stringify(uplanData, null, 2), 'utf-8');

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: true,
            blocks: plan.blocks.length,
            path: uplanPath,
            blockIds: plan.blocks.map(b => b.id),
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
        isError: true
      };
    }
  }
);
```

Test approach: extend existing mcp-server.spec.ts. Use vi.mock for fs/promises
to verify writeFile is called with correct uplan.json content.
For parser behavior, import parseTddabPlan directly (already unit-tested in block 01).
</intro>

<red>
- test: parsePlan tool appears in MCP tool list
- test: parsePlan with valid plan file returns valid=true with block count and path
- test: parsePlan with valid plan writes uplan.json to CVM data dir
- test: parsePlan with non-existent file returns isError true
- test: parsePlan with invalid plan (no mission) returns isError true with error details
- test: uplan.json contains blocks with joined red/success strings (not arrays)
</red>

### Implementation

Add to existing import from 'fs/promises' in mcp-server.ts (line 6 already has readFile):
```typescript
import { readFile, writeFile, mkdir } from 'fs/promises';
```
Add new import:
```typescript
import { parseTddabPlan } from './tddab-parser.js';
```

Add tool registration in setupTools() after the restart tool.

For testing, the mock setup needs to handle fs/promises writeFile.
The test creates a temp plan string, mocks readFile to return it,
calls parsePlan tool via TestTransport, and verifies:
- Response contains valid=true and correct block count
- writeFile was called with path ending in uplan.json
- Written content has the correct structure with joined strings

<success>
- [ ] parsePlan tool appears in MCP tool list (callable via TestTransport)
- [ ] parsePlan with valid plan returns JSON with valid=true, blocks count, path, blockIds
- [ ] parsePlan saves uplan.json with correct structure (joined red/success strings)
- [ ] parsePlan with non-existent file returns isError true
- [ ] parsePlan with invalid plan returns isError true with validation error messages
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="03-planexecutor">
## TDDAB-3: PlanExecutor CVM Program

<intro>
Create the planexecutor — a predefined CVM program that reads uplan.json and
executes TDDAB blocks with 4 CC() calls per block: RED → GREEN → VERIFY → COMMIT,
plus a fix loop on VERIFY failure.

Based on POC: tasks/poc/universal-executor.ts (proven pattern).

This is a STATIC CVM program distributed with the package — not generated.
It reads the dynamic plan data from uplan.json at runtime via fs.readFile().

File to create:
- programs/planexecutor.ts — the CVM program

The executor reads uplan.json from ".cvm/uplan.json" (default CVM_DATA_DIR).
The parsePlan tool (block 02) saves there. The CVM sandbox must include .cvm/
for the executor to read — this is handled by sandbox configuration.

If uplan.json is not found (fs.readFile returns null), the executor prints an
error message and exits gracefully without crashing.

CVM language constraints apply (CRITICAL):
- var for consistency with POC patterns (CVM supports const/let too)
- String concatenation with + (NO template literals)
- No arrow functions, no async/await, no destructuring
- No ++/-- (use blockIndex = blockIndex + 1)
- fs.readFile() returns string|null
- JSON.parse() for parsing
- CC() returns string, console.log() for output
- Must start with /// reference no-default-lib and declare function CC

Programs directory: create programs/ at repo root for distributable CVM programs.

Test approach: Load planexecutor.ts into CVM via VMManager, dry-run through
CC() prompts to verify order and fix loop behavior.

Test file: packages/mcp-server/src/lib/planexecutor.spec.ts
Uses real VMManager (not mocked) with FileStorageAdapter + SandboxedFileSystem.
Creates a uplan.json test fixture, configures sandbox to include test dir,
loads planexecutor, starts execution, steps through CC prompts.
</intro>

<red>
- test: planexecutor.ts loads into CVM without compilation errors
- test: planexecutor reads uplan.json and produces MISSION CC as first prompt
- test: planexecutor produces RED/GREEN/VERIFY/COMMIT CC prompts per block in order
- test: VERIFY loop repeats when response is "failed"
- test: VERIFY loop exits when response is "passed"
- test: planexecutor with missing uplan.json completes without CC prompts (getNext returns completed)
- test: all blocks complete in sequence with correct progress tracking
</red>

### Implementation

programs/planexecutor.ts — based on tasks/poc/universal-executor.ts:

```typescript
/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;

function main() {
  var raw = fs.readFile(".cvm/uplan.json");
  if (raw === null) {
    console.log("ERROR: Cannot read .cvm/uplan.json — run parsePlan first");
    return;
  }
  var data = JSON.parse(raw);
  var mission = data.mission;
  var blocks = data.blocks;
  var sourceFile = data.sourceFile;

  var submitDone = " Respond with done when complete.";
  var submitTest = " Respond with passed if ALL criteria are checked, or failed if ANY is not met.";
  var toolsReminder = " Use Read, Edit, Write, Bash tools for file operations and commands.";

  console.log("=== TDDAB PlanExecutor ===");
  console.log("Plan: " + sourceFile);
  console.log("Blocks: " + blocks.length);

  CC("MISSION BRIEFING: " + mission + " This plan has " + blocks.length + " blocks to implement in sequence." + toolsReminder + submitDone);

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var blockNum = blockIndex + 1;
    var progress = blockNum + "/" + blocks.length;

    console.log("");
    console.log("=== Block " + progress + ": " + block.id + " - " + block.title + " ===");

    CC("RED PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "CONTEXT: " + block.intro + " " +
      "Write ONLY the failing tests listed below. Do NOT implement any production code yet. " +
      "TESTS TO WRITE: " + block.red + " " +
      block.planRef + toolsReminder + submitDone);

    console.log("RED done for " + block.id);

    CC("GREEN PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "Implement the minimum code to make all failing tests pass. " +
      "CONTEXT: " + block.intro + " " +
      block.planRef + toolsReminder + submitDone);

    console.log("GREEN done for " + block.id);

    var verifyPrompt = "VERIFY PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "Run all tests and typecheck. Then verify EACH criterion below. " +
      "Mark each one as you check it: " +
      "SUCCESS CRITERIA: " + block.success + " " +
      "Are ALL criteria checked [x]?" + toolsReminder + submitTest;

    var testResult = CC(verifyPrompt);
    console.log("VERIFY result for " + block.id + ": " + testResult);

    var fixAttempt = 0;
    while (testResult === "failed") {
      fixAttempt = fixAttempt + 1;
      console.log("Fix attempt " + fixAttempt + " for " + block.id);

      CC("FIX PHASE [" + progress + "] block " + block.id + " (attempt " + fixAttempt + "). " +
        "Tests or criteria failed. Debug the issue and fix it. " +
        "CRITERIA THAT MUST PASS: " + block.success + " " +
        block.planRef + toolsReminder + submitDone);

      testResult = CC("RE-VERIFY [" + progress + "] block " + block.id + " (after fix " + fixAttempt + "). " +
        "Run all tests and typecheck again. Check EACH criterion: " +
        "SUCCESS CRITERIA: " + block.success + " " +
        "Are ALL criteria now checked [x]?" + toolsReminder + submitTest);

      console.log("RE-VERIFY result for " + block.id + ": " + testResult);
    }

    CC("COMMIT PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "All tests pass and all criteria verified. " +
      "Git add and commit with message: feat: " + block.title + "." + submitDone);

    console.log("Block " + block.id + " COMPLETED (" + blockNum + "/" + blocks.length + ")");

    blockIndex = blockIndex + 1;
  }

  console.log("");
  console.log("=== ALL " + blocks.length + " BLOCKS COMPLETED ===");

  CC("FINAL REVIEW: All " + blocks.length + " blocks are done. " +
    "Run a final full test suite to confirm no regressions. " +
    "Report the final status." + toolsReminder + submitDone);

  console.log("TDDAB execution complete.");
}
```

Test: create uplan.json fixture with 2 blocks, load planexecutor via VMManager,
step through CC prompts verifying order. On block 2 VERIFY respond "failed" once
then "passed" to test fix loop.

<success>
- [ ] programs/planexecutor.ts exists and loads into CVM without compilation errors
- [ ] first CC prompt contains MISSION BRIEFING with mission text
- [ ] each block produces RED → GREEN → VERIFY → COMMIT CC prompts in order
- [ ] RED prompt contains block intro and red tests
- [ ] VERIFY prompt contains success criteria
- [ ] fix loop activates on "failed" response (FIX → RE-VERIFY cycle)
- [ ] fix loop exits on "passed" response and proceeds to COMMIT
- [ ] missing uplan.json completes without CC prompts (getNext returns completed)
- [ ] all blocks complete in sequence
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="04-e2e-integration">
## TDDAB-4: End-to-End Integration Test

<intro>
Verify the complete pipeline end-to-end: create a test TDDAB plan, parse it with
parseTddabPlan, write uplan.json, load planexecutor, dry-run through CC prompts,
verify all prompts appear in correct order including the retry loop.

Depends on all previous blocks (01-03).

Files to create:
- test/programs/tddab/sample-plan.md — test plan with 3 blocks
- packages/mcp-server/src/lib/tddab-e2e.spec.ts — E2E test

Test flow:
1. Create sample-plan.md with mission and 3 block tags (simple blocks)
2. Call parseTddabPlan with sample-plan.md content — verify 3 blocks, valid=true
3. Transform parsed plan into uplan.json format and write to temp sandbox dir
4. Load planexecutor.ts (programs/planexecutor.ts) into CVM via VMManager
5. Configure sandbox (CVM_SANDBOX_ROOT) to include the temp directory
6. Start execution, step through all CC prompts with canned responses
7. On first VERIFY for block 02: respond "failed" once, then "passed" on retry
8. Verify prompt sequence: MISSION, then per block RED/GREEN/VERIFY/COMMIT,
   with block 02 having an extra FIX+RE-VERIFY cycle
9. Verify console output shows all 3 blocks completed

The test uses real VMManager with FileStorageAdapter (not mocked) to validate
actual CVM compilation and execution. Uses temporary directory for sandbox + storage.
</intro>

<red>
- test: sample-plan.md parses correctly with 3 blocks via parseTddabPlan
- test: parsed plan generates correct uplan.json structure
- test: planexecutor loads and runs against uplan.json from sample-plan
- test: dry-run execution hits all expected CC prompts in correct order
- test: retry loop works (respond "failed" then "done" for fix then "passed")
- test: all 3 blocks complete in sequence
- test: console output includes completion messages for all blocks
</red>

### Implementation

sample-plan.md with 3 trivial blocks:

```markdown
# TDDAB Plan: Sample Test Plan
**Date:** 2026-05-23

<mission>
Test project for E2E validation. TypeScript project with Vitest.
Build: npx nx test sample. Files in src/.
</mission>

<block id="01-greeting">
## TDDAB-1: Add Greeting Function

<intro>
Create a greeting function that returns a formatted greeting string.
File: src/greeting.ts + src/greeting.spec.ts
</intro>

<red>
- test: greet("World") returns "Hello, World!"
- test: greet("") returns "Hello, !"
</red>

### Implementation
export function greet(name: string): string { return "Hello, " + name + "!"; }

<success>
- [ ] greet function exists and returns correct format
- [ ] all tests pass
</success>
</block>

<block id="02-farewell">
## TDDAB-2: Add Farewell Function

<intro>
Create a farewell function that returns a formatted goodbye string.
File: src/farewell.ts + src/farewell.spec.ts
</intro>

<red>
- test: farewell("World") returns "Goodbye, World!"
- test: farewell("") returns "Goodbye, !"
</red>

### Implementation
export function farewell(name: string): string { return "Goodbye, " + name + "!"; }

<success>
- [ ] farewell function exists and returns correct format
- [ ] all tests pass
</success>
</block>

<block id="03-summary">
## TDDAB-3: Add Summary Function

<intro>
Create a summary function that combines greeting and farewell.
File: src/summary.ts + src/summary.spec.ts
Depends on blocks 01 and 02.
</intro>

<red>
- test: summarize("World") returns "Hello, World! Goodbye, World!"
- test: summarize("") returns "Hello, ! Goodbye, !"
</red>

### Implementation
import { greet } from './greeting';
import { farewell } from './farewell';
export function summarize(name: string): string { return greet(name) + " " + farewell(name); }

<success>
- [ ] summarize function exists and combines greet + farewell
- [ ] all tests pass
</success>
</block>

## Execution Order
01-greeting → no dependencies
02-farewell → no dependencies
03-summary  → depends on 01, 02
```

E2E test in tddab-e2e.spec.ts:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseTddabPlan } from './tddab-parser.js';
import { VMManager } from '@cvm/vm';
import { FileStorageAdapter } from '@cvm/storage';
import { SandboxedFileSystem } from '@cvm/vm';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

describe('TDDAB E2E Pipeline', () => {
  let vmManager: VMManager;
  let tempDir: string;

  beforeAll(async () => {
    tempDir = join(tmpdir(), 'cvm-e2e-' + Date.now());
    mkdirSync(join(tempDir, '.cvm'), { recursive: true });
    process.env['CVM_SANDBOX_ROOT'] = tempDir;

    const storage = new FileStorageAdapter(join(tempDir, '.cvm'));
    vmManager = new VMManager(storage);
    await vmManager.initialize();
  });

  afterAll(async () => {
    await vmManager.dispose();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env['CVM_SANDBOX_ROOT'];
  });

  it('should execute full pipeline: parse → write uplan → load executor → run', async () => {
    // 1. Parse sample plan
    const planMd = readFileSync(
      resolve(process.cwd(), 'test/programs/tddab/sample-plan.md'), 'utf-8'
    );
    const parseResult = parseTddabPlan(planMd, 'sample-plan.md');
    expect(parseResult.valid).toBe(true);
    expect(parseResult.plan!.blocks).toHaveLength(3);

    // 2. Transform and write uplan.json
    const plan = parseResult.plan!;
    const uplanData = {
      mission: plan.mission,
      sourceFile: plan.sourceFile,
      blocks: plan.blocks.map(b => ({
        id: b.id, title: b.title, intro: b.intro,
        red: b.redTests.map(t => '- ' + t).join('\n'),
        success: b.success.map(s => '- [ ] ' + s).join('\n'),
        planRef: 'See sample-plan.md lines ' + b.startLine + '-' + b.endLine,
      })),
    };
    writeFileSync(join(tempDir, '.cvm', 'uplan.json'), JSON.stringify(uplanData));

    // 3. Load planexecutor
    const executorSource = readFileSync(
      resolve(process.cwd(), 'programs/planexecutor.ts'), 'utf-8'
    );
    await vmManager.loadProgram('planexecutor', executorSource);
    await vmManager.startExecution('planexecutor', 'e2e-test');

    // 4. Step through CC prompts
    const prompts: string[] = [];
    let retriedBlock2 = false;
    let next = await vmManager.getNext('e2e-test');

    while (next.type === 'waiting') {
      prompts.push(next.message!);
      let response = 'done';
      if (next.message!.includes('VERIFY') && next.message!.includes('02-farewell')
          && !retriedBlock2) {
        response = 'failed';
        retriedBlock2 = true;
      } else if (next.message!.includes('VERIFY') || next.message!.includes('RE-VERIFY')) {
        response = 'passed';
      }
      await vmManager.reportCCResult('e2e-test', response);
      next = await vmManager.getNext('e2e-test');
    }

    // 5. Verify prompt sequence
    expect(prompts[0]).toContain('MISSION');
    expect(prompts.filter(p => p.includes('RED PHASE'))).toHaveLength(3);
    expect(prompts.filter(p => p.includes('GREEN PHASE'))).toHaveLength(3);
    expect(prompts.filter(p => p.includes('COMMIT PHASE'))).toHaveLength(3);
    // Block 02 has extra FIX + RE-VERIFY
    expect(prompts.filter(p => p.includes('FIX PHASE'))).toHaveLength(1);
    expect(prompts.filter(p => p.includes('RE-VERIFY'))).toHaveLength(1);
  });
});
```

<success>
- [ ] sample-plan.md exists with 3 blocks in valid TDDAB format
- [ ] parseTddabPlan correctly parses sample-plan.md (3 blocks, valid=true)
- [ ] uplan.json generated from parsed plan has correct structure
- [ ] planexecutor loads into CVM and starts execution without errors
- [ ] dry-run hits all CC prompts in correct order (MISSION → per-block RED/GREEN/VERIFY/COMMIT)
- [ ] retry loop works: "failed" on block 02 triggers FIX → RE-VERIFY → "passed" advances
- [ ] all 3 blocks complete in sequence
- [ ] npx nx test mcp-server passes with all tests including E2E
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

## Execution Order
```
01-parser-module    → no dependencies (pure logic + unit tests)
02-mcp-parse-tool   → depends on 01 (wraps parser as MCP tool + saves uplan.json)
03-planexecutor     → depends on 01 (needs format understanding for uplan.json structure)
04-e2e-integration  → depends on all (validates full pipeline)
```

## BTLT Checkpoints
After each block: Build, TypeCheck, Lint, Test (zero failures).
