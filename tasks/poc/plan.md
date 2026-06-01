# TDDAB Plan: TDDAB-to-CVM Pipeline
**Date:** 2026-05-22

<mission>
PROJECT: CVM (Cognitive Virtual Machine) - an algorithmic TODO manager for Claude.
CVM compiles TypeScript-subset programs into bytecode and executes them in a stack-based VM.
CC() calls pause execution and create prompts for Claude. Claude responds, VM continues.
CVM is a prompt orchestrator - it never executes code, never runs tests, never touches files.

TECH STACK: TypeScript 5.8.2, Node.js 18.16+, Nx 21.2.0 monorepo, Vitest 3.0.0.
All imports require .js extension (moduleResolution: nodenext).
Packages: parser, types, storage, mongodb, vm, mcp-server. App: cvm-server.
MCP server in packages/mcp-server/src/lib/mcp-server.ts - tools registered via
this.server.tool(name, zodSchema, handler) in setupTools() method of CVMMcpServer class.
Imports use: import { z } from 'zod'; import { readFile } from 'fs/promises'; import { resolve } from 'path';

CVM LANGUAGE SUBSET: var/const/let, while, for, for-of, for-in, if/else, switch,
arrays, objects, string concat with +, CC(), console.log(), JSON.stringify(),
property access. NO: arrow functions, async/await, destructuring, template literals, ++/--.

TESTING: npx nx test mcp-server (runs Vitest). Tests use vi.mock for VMManager.
Test transport: packages/mcp-server/src/lib/test-transport.ts.
Tests are in packages/mcp-server/src/lib/*.spec.ts files.

BUILD/VERIFY: npx nx test mcp-server, npx nx run-many --target=build --all.

WHAT WE ARE BUILDING: A pipeline that transforms TDDAB plan markdown files into CVM programs.
Components:
1. Parser module (tddab-parser.ts) - reads plan markdown, extracts blocks into JSON
2. MCP tool parsePlan - wraps parser as MCP tool, takes filePath, returns JSON
3. Generator module (tddab-generator.ts) - takes TddabPlan, produces CVM executor source
4. MCP tool generateExecutor - wraps generator as MCP tool
5. Executor template (tddab-executor.ts) - CVM program with RED/GREEN/VERIFY/COMMIT per block
6. E2E integration test - full pipeline validation

WORKING PROTOTYPE: tasks/poc/validate-plan.ts contains a proven parser+generator
implementation. Use it as reference for parsing logic and executor output format.

EXISTING TOOL PATTERN: see load, loadFile, start, getTask, submitTask in mcp-server.ts.
Each tool: this.server.tool(name, { param: z.type() }, async handler).
Error pattern: try/catch returning { content: [...], isError: true }.

FILE STRUCTURE:
- packages/mcp-server/src/lib/mcp-server.ts - MCP server with tool registrations
- packages/mcp-server/src/lib/mcp-server.spec.ts - server tests (vi.mock pattern)
- packages/mcp-server/src/lib/test-transport.ts - test transport for MCP testing
- test/programs/ - CVM program examples organized by category
- docs/ - project documentation
- tasks/poc/validate-plan.ts - working prototype of parser+generator
</mission>

<block id="01-plan-format">
## TDDAB-1: Define Structured TDDAB Plan Format

<intro>
Define the markdown+XML tag format for TDDAB plans that the parser will consume.
Create a format specification document and a sample plan file for testing.
No code dependencies - this is pure documentation plus example files.

Files to create:
- docs/tddab-plan-format.md - format specification documenting all 5 tags
- test/programs/tddab/sample-plan.md - sample plan with 2 blocks for parser testing
</intro>

<red>
- test: docs/tddab-plan-format.md exists and documents all 5 tags (mission, block, intro, red, success)
- test: test/programs/tddab/sample-plan.md contains a valid mission tag with non-empty content
- test: sample-plan.md contains at least 2 block tags with unique NN-kebab-case ids
- test: each block in sample-plan.md contains intro, red, and success tags
- test: red tags contain lines starting with "- test:" prefix
- test: success tags contain checklist items in "- [ ]" format
</red>

### Implementation

Create docs/tddab-plan-format.md documenting the 5 tags:

| Tag | Where | Purpose |
|-----|-------|---------|
| `<mission>` | Once, top of plan | Full project context for clean-context execution |
| `<block id="NN-name">` | Wraps each TDDAB | Block boundary with unique id |
| `<intro>` | Inside block | Context: what, why, dependencies, files |
| `<red>` | Inside block | Test definitions as `- test:` bullet list |
| `<success>` | Inside block | Checklist of verifiable outcomes as `- [ ]` items |

Tag rules:
- mission: exactly once, before first block
- block id: format NN-kebab-case, must be unique
- intro: must be self-sufficient for zero-context execution
- red: each line starts with "- test:", one testable behavior per line
- success: checklist format with "- [ ]" items, all must pass
- Tags span multiple lines, no nesting inside tags
- Standard markdown between tags preserved for human reading

Create test/programs/tddab/sample-plan.md with 2 blocks demonstrating the format.
Blocks should be simple (e.g., "add greeting function", "add farewell function").

<success>
- [ ] docs/tddab-plan-format.md exists with all 5 tags documented with examples
- [ ] test/programs/tddab/sample-plan.md has valid mission tag with non-empty content
- [ ] sample-plan.md has 2 block tags with unique ids in NN-kebab-case format
- [ ] each block in sample has intro, red, and success tags
- [ ] red tags use "- test:" prefix format
- [ ] success tags use "- [ ]" checklist format
</success>
</block>

<block id="02-parser-unit">
## TDDAB-2: TDDAB Plan Parser Core Logic

<intro>
Create a standalone parser module that reads a TDDAB plan markdown string and
extracts blocks into a structured JSON array. Pure logic - no MCP integration,
no file I/O. Line-by-line state machine approach.

Depends on block 01 (needs sample-plan.md for testing).

Files to create:
- packages/mcp-server/src/lib/tddab-parser.ts - parser module
- packages/mcp-server/src/lib/tddab-parser.test.ts - unit tests

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

export function parseTddabPlan(markdown: string, sourceFile: string): TddabPlan
```

Parser strategy: line-by-line scan tracking line numbers. Regex for block open/close.
Extract mission, intro, red, success inner content. Title from ## TDDAB-N: heading.
Throw on missing mission, duplicate ids, missing required tags.
Reference implementation: tasks/poc/validate-plan.ts parseTddabPlan function.
</intro>

<red>
- test: parseTddabPlan extracts mission text from mission tag
- test: parseTddabPlan extracts all blocks with correct ids
- test: each parsed block has intro, redTests array, and success array
- test: startLine and endLine are accurate for each block (1-indexed)
- test: throws on missing mission tag
- test: throws on duplicate block ids
- test: handles multi-line red with multiple "- test:" bullet points
</red>

### Implementation

Line-by-line state machine in tddab-parser.ts:
1. Scan for mission tag - extract content until closing tag
2. Scan for block id="..." - record startLine, extract id
3. Inside block: extract intro, red, success content
4. On closing block tag - record endLine, push block to array
5. Title: find ## TDDAB- heading inside block range
6. Red parsing: filter lines matching "- test:" prefix, strip prefix
7. Success parsing: filter lines matching "- [ ]" prefix, strip prefix
8. Validate: mission exists, no duplicate ids, all blocks have required tags
9. Throw descriptive errors on validation failures

Test file imports parseTddabPlan and TddabPlan from tddab-parser.js.
Tests cover: happy path with sample plan, missing mission, duplicate ids,
empty blocks, multi-line content extraction.

<success>
- [ ] parseTddabPlan extracts mission text correctly
- [ ] parseTddabPlan returns all blocks with correct ids
- [ ] each parsed block has intro, redTests array, success array
- [ ] startLine and endLine are accurate per block
- [ ] throws on missing mission tag
- [ ] throws on duplicate block ids
- [ ] handles multi-line red with bullet points
- [ ] npx nx test mcp-server passes
</success>
</block>

<block id="03-mcp-parse-tool">
## TDDAB-3: MCP Tool parsePlan

<intro>
Register the parser as a new MCP tool in the CVM server. Follows existing tool
pattern in packages/mcp-server/src/lib/mcp-server.ts setupTools() method.
Reads file from disk, calls parseTddabPlan, returns JSON.

Depends on block 02 (parser module).

Files to modify:
- packages/mcp-server/src/lib/mcp-server.ts - add tool registration and import

Import to add at top of mcp-server.ts:
```typescript
import { parseTddabPlan } from './tddab-parser.js';
```

Tool registration goes inside setupTools() method, following the pattern of
existing tools (load, loadFile, start, etc.). Uses z.string() for filePath param.
Error handling: try/catch with isError: true on failure.
</intro>

<red>
- test: parsePlan tool is registered and callable via MCP test transport
- test: parsePlan with valid plan file returns JSON with mission and blocks array
- test: parsePlan with non-existent file returns isError true
- test: parsePlan with invalid plan content (no mission) returns isError true
</red>

### Implementation

Add to setupTools() in mcp-server.ts after the restart tool:

```typescript
this.server.tool(
  'parsePlan',
  { filePath: z.string() },
  async ({ filePath }) => {
    try {
      const resolvedPath = resolve(filePath);
      const markdown = await readFile(resolvedPath, 'utf-8');
      const plan = parseTddabPlan(markdown, filePath);
      return {
        content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }]
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

Test using TestTransport and vi.mock pattern from mcp-server.spec.ts.

<success>
- [ ] parsePlan tool appears in MCP tool list
- [ ] parsePlan with valid plan file returns JSON with mission and blocks
- [ ] parsePlan with non-existent file returns isError true
- [ ] parsePlan with invalid plan (no mission) returns isError true
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="04-executor-template">
## TDDAB-4: CVM Executor Template Program

<intro>
Create the universal CVM program template that executes any TDDAB plan.
4 CC() calls per block: RED, GREEN, VERIFY, COMMIT. Fix loop on VERIFY failure.
Standalone CVM program - no dependency on parser or MCP tools.

Depends on understanding the format from block 01.

Files to create:
- test/programs/tddab/tddab-executor.ts - the universal executor template

CVM language constraints (CRITICAL):
- var/const/let declarations only
- String concatenation with + operator, NO template literals
- Array access via blocks[blockIndex], property access with dot notation
- blockIndex = blockIndex + 1, NOT blockIndex++
- Explicit comparisons: testResult === "failed", NOT !testResult
- NO arrow functions, NO async/await, NO destructuring
- CC() returns string, console.log() for output
- Must start with /// reference no-default-lib and declare function CC

The executor is a hardcoded example with 2 sample blocks.
The generator (block 05) will produce this same structure dynamically.
</intro>

<red>
- test: executor file loads and compiles without errors in CVM
- test: executor produces CC() calls in order: MISSION, then RED/GREEN/VERIFY/COMMIT per block
- test: RED CC fires first for each block with test definitions
- test: GREEN CC fires second for each block
- test: VERIFY loop repeats when response is "failed"
- test: VERIFY loop exits when response is "passed"
</red>

### Implementation

Create test/programs/tddab/tddab-executor.ts with hardcoded 2-block example:

```typescript
/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;

function main() {
  var blocks = [
    { id: "01-example", intro: "First block intro", red: "- test one\n- test two", success: "- [ ] criterion one\n- [ ] criterion two", planRef: "See plan.md lines 1-20" },
    { id: "02-example", intro: "Second block intro", red: "- test three", success: "- [ ] criterion three", planRef: "See plan.md lines 21-40" }
  ];

  CC("MISSION: Sample mission. You have " + blocks.length + " blocks to implement. Respond done to start.");

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];

    CC("RED phase for block " + block.id + ": " + block.intro + " Write ONLY the failing tests. RED TESTS: " + block.red + " " + block.planRef + " Do NOT implement yet. Respond done.");

    CC("GREEN phase for block " + block.id + ". Implement code to make the failing tests pass. Respond done.");

    var testResult = CC("VERIFY block " + block.id + ". Run all tests. SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");

    while (testResult === "failed") {
      CC("Tests failed for block " + block.id + ". Debug and fix. Respond done.");
      testResult = CC("Re-run tests for block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");
    }

    CC("COMMIT block " + block.id + ". All tests pass. Commit and push. Respond done.");

    console.log("Block " + block.id + " completed");
    blockIndex = blockIndex + 1;
  }

  console.log("All " + blocks.length + " blocks completed!");
}
```

Verify by loading into CVM via mcp__cvm__load or manual compile test.

<success>
- [ ] executor file exists at test/programs/tddab/tddab-executor.ts
- [ ] executor loads into CVM without compilation errors
- [ ] CC prompts fire in order: MISSION then RED/GREEN/VERIFY/COMMIT per block
- [ ] RED CC fires before GREEN for each block
- [ ] verify loop repeats on "failed" response
- [ ] verify loop exits on "passed" response
- [ ] all blocks complete in sequence
</success>
</block>

<block id="05-generator-module">
## TDDAB-5: Executor Generator and MCP Tool generateExecutor

<intro>
Create a generator module that takes a TddabPlan object and produces the complete
tddab-executor.ts CVM program source string. Register it as MCP tool generateExecutor.
This is the bridge: plan.md -> parsePlan -> generateExecutor -> ready-to-run CVM program.

Depends on blocks 02 (parser types) and 04 (executor template pattern).

Files to create:
- packages/mcp-server/src/lib/tddab-generator.ts - generator module
- packages/mcp-server/src/lib/tddab-generator.test.ts - unit tests

File to modify:
- packages/mcp-server/src/lib/mcp-server.ts - register generateExecutor tool

Function to export from tddab-generator.ts:
```typescript
import { TddabPlan } from './tddab-parser.js';
export function generateExecutorSource(plan: TddabPlan): string
```

The generator must:
- Build block array literal from plan.blocks with proper string escaping
- Build mission CC prompt from plan.mission
- Emit the while loop structure matching block 04 template
- Include line references as planRef per block
- Return complete valid CVM TypeScript source

Reference implementation: generateExecutorSource function in tasks/poc/validate-plan.ts.
</intro>

<red>
- test: generateExecutorSource produces valid CVM TypeScript string with function main
- test: generated source includes all block ids from the input plan
- test: generated source contains the mission text in the first CC call
- test: generated source has 4 CC calls per block (RED, GREEN, VERIFY, COMMIT)
- test: MCP tool generateExecutor returns source string when given a valid file path
</red>

### Implementation

Generator logic in tddab-generator.ts:
1. escapeString helper: escape backslashes, quotes, newlines
2. Build block array entries from plan.blocks - each with id, title, intro, red, success, planRef
3. Emit function main() with blocks array, mission CC, while loop, verify inner loop
4. Return complete source string starting with /// reference and declare function CC

MCP tool in mcp-server.ts setupTools():
```typescript
import { generateExecutorSource } from './tddab-generator.js';

this.server.tool('generateExecutor', { filePath: z.string() }, async ({ filePath }) => {
  try {
    const resolvedPath = resolve(filePath);
    const markdown = await readFile(resolvedPath, 'utf-8');
    const plan = parseTddabPlan(markdown, filePath);
    const source = generateExecutorSource(plan);
    return { content: [{ type: 'text', text: source }] };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }],
      isError: true
    };
  }
});
```

Tests verify generated source structure, block id inclusion, CC prompt count.

<success>
- [ ] generateExecutorSource returns valid CVM TypeScript string
- [ ] generated source includes all block ids from input plan
- [ ] generated source contains mission prompt from plan
- [ ] generated source has 4 CC calls per block (RED, GREEN, VERIFY, COMMIT)
- [ ] MCP tool generateExecutor callable with file path
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

<block id="06-e2e-integration">
## TDDAB-6: End-to-End Integration Test

<intro>
Verify the complete pipeline end-to-end: create a test TDDAB plan with 3 blocks,
parse it, generate executor, load into CVM, dry-run through CC prompts, verify
all prompts appear in correct order including the retry loop.

Depends on all previous blocks (01-05).

Files to create:
- test/programs/tddab/test-plan.md - test plan with 3 simple blocks
- packages/mcp-server/src/lib/tddab-e2e.test.ts - E2E test

Test flow:
1. Create test-plan.md with mission and 3 block tags
2. Read file and call parseTddabPlan - verify 3 blocks returned
3. Call generateExecutorSource with parsed plan - verify source string
4. Load generated source into CVM via VMManager.loadProgram
5. Start execution, step through all CC prompts with dry-run responses
6. On first VERIFY for block 2: respond "failed" once, then "passed" on retry
7. Verify prompt sequence: MISSION, then per block RED/GREEN/VERIFY/COMMIT,
   with block 2 having an extra fix+re-verify cycle
8. Verify console output shows all 3 blocks completed

The test uses real VMManager (not mocked) to validate actual CVM compilation
and execution of the generated program.
</intro>

<red>
- test: full pipeline produces executable CVM program from test-plan.md
- test: dry-run execution hits all expected CC prompts in correct order
- test: retry loop works (respond "failed" then fix then "passed" advances)
- test: all 3 blocks complete successfully in sequence
- test: final console output includes block count
</red>

### Implementation

test-plan.md with 3 trivial blocks (e.g., "add greeting", "add farewell", "add summary").
Each block has intro, 2-3 red tests, 2-3 success criteria.

E2E test in tddab-e2e.test.ts:
1. Read test-plan.md, call parseTddabPlan, assert 3 blocks and mission
2. Call generateExecutorSource, assert source contains all 3 block ids
3. Create real VMManager, load generated source as program
4. Start execution, loop getNext/reportCCResult with canned responses
5. Track all CC prompts received in an array
6. For block 2 VERIFY: respond "failed" first time, "done" for fix, "passed" for retry
7. Assert prompt array matches expected sequence
8. Assert console output captured shows completion messages

<success>
- [ ] test-plan.md parses correctly with 3 blocks via parseTddabPlan
- [ ] generateExecutorSource produces valid CVM source from test-plan.md
- [ ] generated program loads into CVM without errors
- [ ] dry-run execution hits all CC prompts in correct order
- [ ] retry loop works (failed then fix then passed advances)
- [ ] all 3 blocks complete in sequence
- [ ] npx nx test mcp-server passes with all tests including E2E
</success>
</block>

## Execution Order
```
01-plan-format       -> no dependencies (pure docs + sample)
02-parser-unit       -> depends on 01 (needs format definition + sample-plan.md)
03-mcp-parse-tool    -> depends on 02 (wraps parser as MCP tool)
04-executor-template -> depends on 01 (needs format understanding, no code deps)
05-generator-module  -> depends on 02 + 04 (parser types + template pattern)
06-e2e-integration   -> depends on all (validates full pipeline)
```

## BTLT Checkpoints
After each block: Build, TypeCheck, Lint, Test (zero failures).
