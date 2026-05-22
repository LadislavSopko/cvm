# TDDAB Plan: Universal TDDAB Executor
**Date:** 2026-05-18

<mission>
PROJECT: CVM (Cognitive Virtual Machine) — an algorithmic TODO manager for Claude.
CVM compiles TypeScript-subset programs into bytecode and executes them in a stack-based VM.
CC() calls pause execution and create prompts for Claude. Claude responds, VM continues.
CVM is a prompt orchestrator — it never executes code, never runs tests, never touches files.

TECH STACK: TypeScript 5.8.2, Node.js 18.16+, Nx 21.2.0 monorepo, Vitest 3.0.0.
All imports require .js extension (moduleResolution: nodenext).
Packages: parser, types, storage, mongodb, vm, mcp-server. App: cvm-server.
MCP server in packages/mcp-server/src/lib/mcp-server.ts — tools registered via
this.server.tool(name, zodSchema, handler) in setupTools() method.

CVM LANGUAGE SUBSET: var/const/let, while, for, for-of, for-in, if/else, switch,
arrays, objects, string concat with +, CC(), console.log(), JSON.stringify(),
property access. NO: arrow functions, async/await, destructuring, template literals.

WHAT WE'RE BUILDING: A pipeline that transforms TDDAB plans into CVM programs.
Three components:
1. Structured TDDAB plan format — markdown with 5 lightweight XML tags
   (<mission>, <block>, <intro>, <red>, <success>)
2. MCP tool `parsePlan` — parses plan.md into JSON array of blocks with line refs
3. MCP tool `generateExecutor` — produces universal tddab-executor.ts CVM program
   with nested while loops orchestrating RED→GREEN→VERIFY→COMMIT cycles

The executor is language-agnostic. CVM tells Claude what to do via CC() prompts.
Claude uses its own tools (Read, Edit, Bash, etc.) to execute.

BUILD/TEST: npx nx test mcp-server, npx nx run-many --target=build --all
EXISTING TOOL PATTERN: see load, loadFile, start, getTask, submitTask in mcp-server.ts
</mission>

---

<block id="01-plan-format">
## TDDAB-1: Define Structured TDDAB Plan Format

<intro>
Define the markdown+XML tag format for TDDAB plans that the parser will consume.
Create a format spec document and a sample plan file for testing.
No code dependencies — this is pure documentation + example files.

Files to create:
- `docs/tddab-plan-format.md` — format specification
- `test/programs/tddab/sample-plan.md` — sample plan with 2+ blocks
</intro>

<red>
- test: sample-plan.md has valid `<mission>` tag with non-empty content
- test: sample-plan.md has at least 2 `<block>` tags with unique ids
- test: each block contains `<intro>`, `<red>`, `<success>` tags
- test: format spec documents all 5 tags with examples and rules
</red>

### Implementation

Format specification in `docs/tddab-plan-format.md` documenting:

| Tag | Where | Purpose |
|-----|-------|---------|
| `<mission>` | Once, top of plan | Overall goal — becomes first CC() prompt |
| `<block id="NN-name">` | Wraps each TDDAB | Block boundary with unique id |
| `<intro>` | Inside block | Context: what, why, dependencies, files |
| `<red>` | Inside block | Test definitions as `- test:` bullet list |
| `<success>` | Inside block | Single exit criterion for verify loop |

Tag rules:
- `<mission>` — exactly once, before first block
- `<block id="">` — id format `NN-kebab-case`, must be unique
- `<intro>` — must be self-sufficient (zero prior context needed)
- `<red>` — each line starts with `- test:`, one testable behavior per line
- `<success>` — one clear sentence, not a checklist
- Tags can span multiple lines, no nesting tags inside tags
- Standard markdown between tags preserved for human reading

Sample plan in `test/programs/tddab/sample-plan.md` with 2 blocks demonstrating the format.

<success>
- [ ] docs/tddab-plan-format.md exists with all 5 tags documented
- [ ] test/programs/tddab/sample-plan.md has valid <mission> tag
- [ ] sample-plan.md has 2+ <block> tags with unique ids
- [ ] each block in sample has <intro>, <red>, <success> tags
- [ ] <success> tags use checklist format (- [ ] items)
- [ ] files committed
</success>
</block>

---

<block id="02-parser-unit">
## TDDAB-2: TDDAB Plan Parser — Core Logic

<intro>
Create a standalone parser module that reads a TDDAB plan markdown string and
extracts blocks into a structured JSON array. Pure logic — no MCP integration,
no file I/O. Depends on format defined in block 01.

Files to create:
- `packages/mcp-server/src/lib/tddab-parser.ts` — parser module
- `packages/mcp-server/src/lib/tddab-parser.test.ts` — unit tests

Types to export:
```typescript
export interface TddabBlock {
  id: string;
  title: string;
  intro: string;
  redTests: string[];
  success: string;
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

Parser strategy: line-by-line scan tracking line numbers. Regex for
`<block id="...">` open and `</block>` close. Extract `<intro>`, `<red>`,
`<success>`, `<mission>` inner content. Title from `## TDDAB-N:` heading.
Return TddabPlan with precise startLine/endLine per block.
</intro>

<red>
- test: parseTddabPlan() extracts mission from `<mission>` tag
- test: parseTddabPlan() extracts all blocks with correct ids
- test: each block has intro, redTests array, success criteria
- test: startLine/endLine are accurate for each block
- test: throws on missing `<mission>` tag
- test: throws on duplicate block ids
- test: handles multi-line `<red>` with bullet points
</red>

### Implementation

Line-by-line state machine:
1. Scan for `<mission>` — extract content until `</mission>`
2. Scan for `<block id="...">` — record startLine, extract id
3. Inside block: extract `<intro>`, `<red>`, `<success>` content
4. On `</block>` — record endLine, push block to array
5. Title: find `## TDDAB-` heading inside block range
6. `<red>` parsing: split by newlines, filter lines matching `- test:`, strip prefix
7. Validate: mission exists, no duplicate ids, all blocks have required tags

Test with sample-plan.md from block 01 + edge cases (empty blocks, missing tags).

<success>
- [ ] parseTddabPlan() extracts mission text correctly
- [ ] parseTddabPlan() returns all blocks with correct ids
- [ ] each parsed block has intro, redTests array, success string
- [ ] startLine/endLine are accurate per block
- [ ] throws on missing <mission> tag
- [ ] throws on duplicate block ids
- [ ] handles multi-line <red> with bullet points
- [ ] npx nx test mcp-server passes
- [ ] npx nx run mcp-server:typecheck passes
</success>
</block>

---

<block id="03-mcp-tool">
## TDDAB-3: MCP Tool `parsePlan`

<intro>
Register the parser as a new MCP tool in the CVM server. Follows existing tool
pattern in `packages/mcp-server/src/lib/mcp-server.ts` setupTools() method.
Reads file from disk, calls parseTddabPlan(), returns JSON. Depends on block 02.

Files to modify:
- `packages/mcp-server/src/lib/mcp-server.ts` — add tool registration

Import to add:
```typescript
import { parseTddabPlan } from './tddab-parser.js';
```
</intro>

<red>
- test: parsePlan tool is registered and callable via MCP
- test: parsePlan with valid plan file returns correct JSON structure
- test: parsePlan with non-existent file returns isError: true
- test: parsePlan with invalid plan (no mission) returns isError: true
</red>

### Implementation

Add to `setupTools()` in mcp-server.ts:
```typescript
this.server.tool(
  'parsePlan',
  {
    filePath: z.string()
  },
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

<success>
- [ ] parsePlan tool appears in MCP tool list
- [ ] parsePlan with valid plan file returns JSON with mission + blocks array
- [ ] parsePlan with non-existent file returns isError: true
- [ ] parsePlan with invalid plan (no mission) returns isError: true
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

---

<block id="04-executor-template">
## TDDAB-4: CVM Program `tddab-executor.ts`

<intro>
Create the universal CVM program template that executes any TDDAB plan.
Follows proper TDDAB phases: RED → GREEN → VERIFY → COMMIT.
4 CC() per block with separate RED phase for test-first discipline.
Pattern proven in regexp-evolution-program-v3.ts, adapted for TDDAB purity.
Standalone CVM program — no dependency on parser/MCP tools.
Depends on understanding the format from block 01.

Files to create:
- `test/programs/tddab/tddab-executor.ts` — the universal executor template

CVM language constraints:
- `testResult === "failed"` not `!testResult` (explicit comparisons)
- String concat with `+`, no template literals
- Array access via `blocks[blockIndex]`, property access with `.`
- `blockIndex = blockIndex + 1` not `blockIndex++`
</intro>

<red>
- test: executor loads and compiles without errors in CVM
- test: executor produces 4 CC() per block: RED → GREEN → TEST → COMMIT
- test: RED CC() fires first with test definitions
- test: GREEN CC() fires second with implementation instruction
- test: test/fix loop repeats when response is "failed"
- test: test/fix loop exits when response is "passed"
- test: fix CC() fires between failed test and re-test
- test: blockIndex advances after each completed block
- test: executor completes after all blocks processed
</red>

### Implementation

4 CC() per block — proper TDDAB phases:
1. `CC(RED)` → Claude writes FAILING tests only, responds `"done"`
2. `CC(GREEN)` → Claude implements code to make tests pass, responds `"done"`
3. `CC(TEST)` → Claude runs tests, responds `"passed"` or `"failed"`
   - While `"failed"`: `CC(fix)` then `CC(test)` again
4. `CC(COMMIT)` → Claude commits+pushes, responds `"done"`

```typescript
function main() {
  var blocks = [
    { id: "01-example", intro: "...", red: "...", success: "...", planRef: "..." }
  ];

  CC("MISSION: [mission text]. You have " + blocks.length + " blocks. Respond done to start.");

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];

    CC("RED phase for block " + block.id + ": " + block.intro + " Write ONLY the failing tests. RED TESTS: " + block.red + " " + block.planRef + " Do NOT implement yet. Respond done.");

    CC("GREEN phase for block " + block.id + ". Implement code to make the failing tests pass. Respond done.");

    var testResult = CC("VERIFY block " + block.id + ". Run all tests. SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");

    while (testResult === "failed") {
      CC("Tests failed for block " + block.id + ". Debug with Protocol D and fix. Respond done.");
      testResult = CC("Re-run tests for block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond passed or failed.");
    }

    CC("COMMIT block " + block.id + ". All tests pass. Commit and push. Respond done.");

    console.log("Block " + block.id + " completed");
    blockIndex = blockIndex + 1;
  }

  console.log("All " + blocks.length + " blocks completed!");
}
```

Key design:
- 4 CC() per block: RED → GREEN → VERIFY → COMMIT (proper TDDAB)
- RED is separate — forces test-first, no premature implementation
- Response protocol: `"done"` for actions, `"passed"`/`"failed"` for tests
- Fix CC() is SEPARATE from test CC() (Claude fixes then re-tests)
- Block array is inline — generated automatically by generateExecutor
- Prompts are minimal — Claude knows its tools, no need to over-specify
- CVM never executes anything — pure prompt orchestrator

<success>
- [ ] executor loads into CVM without compilation errors
- [ ] CC() prompts fire in order: MISSION → RED → GREEN → VERIFY → COMMIT per block
- [ ] RED CC() fires before GREEN CC() for each block
- [ ] verify loop repeats on "failed" response
- [ ] verify loop exits on "passed" response
- [ ] fix CC() fires between failed and re-test
- [ ] all blocks complete in sequence
- [ ] dry-run with 2+ blocks completes successfully
</success>
</block>

---

<block id="05-generate-tool">
## TDDAB-5: MCP Tool `generateExecutor`

<intro>
Create an MCP tool that takes a TDDAB plan file path, parses it, and generates
the complete tddab-executor.ts source code with the block array populated.
This is the bridge: plan.md → parsePlan → generateExecutor → ready-to-run CVM program.
Depends on blocks 02 (parser) and 04 (executor template).

Files to create:
- `packages/mcp-server/src/lib/tddab-generator.ts` — generator module
- `packages/mcp-server/src/lib/tddab-generator.test.ts` — unit tests

File to modify:
- `packages/mcp-server/src/lib/mcp-server.ts` — register tool

Function to export:
```typescript
export function generateExecutorSource(plan: TddabPlan): string
```

Takes TddabPlan object from parser, returns valid CVM TypeScript source string
with block array populated, mission prompt filled in, nested while loops,
CC() prompts with block-specific context (intro, red tests, success criteria,
file path + line references).
</intro>

<red>
- test: generateExecutorSource() produces valid CVM TypeScript string
- test: generated source includes all block ids from plan
- test: generated source has mission prompt from plan.mission
- test: generated source compiles without errors when loaded into CVM
- test: MCP tool generateExecutor returns source string from file path
</red>

### Implementation

Generator logic in `tddab-generator.ts`:
1. Build block array literal from plan.blocks — escape strings properly
2. Build mission CC() prompt from plan.mission
3. Emit nested while loop structure (outer blocks, inner verify)
4. Include line references: `"See " + block.sourceFile + " lines " + block.startLine + "-" + block.endLine`
5. Return complete `function main() { ... }` source

MCP tool in mcp-server.ts:
```typescript
this.server.tool('generateExecutor', { filePath: z.string() }, async ({ filePath }) => {
  try {
    const markdown = await readFile(resolve(filePath), 'utf-8');
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

<success>
- [ ] generateExecutorSource() returns valid CVM TypeScript string
- [ ] generated source includes all block ids from input plan
- [ ] generated source contains mission prompt from plan
- [ ] generated source has 4 CC() per block (RED, GREEN, VERIFY, COMMIT)
- [ ] generated source compiles when loaded into CVM
- [ ] MCP tool generateExecutor callable with file path
- [ ] npx nx test mcp-server passes
- [ ] npx nx run-many --target=build --all succeeds
</success>
</block>

---

<block id="06-e2e-integration">
## TDDAB-6: End-to-End Integration Test

<intro>
Verify the complete pipeline end-to-end: write a test TDDAB plan with 3 blocks,
parse it, generate executor, load into CVM, run with dry-run responses, verify
all CC() prompts appear in correct order including retry loop.
Depends on all previous blocks (01-05).

Files to create:
- `test/programs/tddab/test-plan.md` — test plan with 3 simple blocks
- `test/programs/tddab/e2e-tddab-test.ts` — E2E test script

Test flow:
1. Create test-plan.md with `<mission>` + 3 `<block>` tags
2. Call parsePlan tool → verify JSON structure
3. Call generateExecutor tool → verify source string
4. Load generated source into CVM with mcp__cvm__load
5. Start execution, step through all CC() prompts with dry-run responses
6. On first VERIFY prompt for block 2: respond "RETRY" once, then "PASS" on second
7. Verify prompt sequence: MISSION → BLOCK-1 → VERIFY-1 → COMMIT-1 → BLOCK-2 → VERIFY-2(retry) → VERIFY-2 → COMMIT-2 → BLOCK-3 → VERIFY-3 → COMMIT-3 → COMPLETE
</intro>

<red>
- test: full pipeline produces executable CVM program from plan.md
- test: dry-run execution hits all expected CC() prompts in order
- test: retry loop works (RETRY → re-prompt → PASS → advance)
- test: all 3 blocks complete successfully
- test: final completion message includes block count
</red>

### Implementation

test-plan.md with 3 trivial blocks (e.g., "add greeting", "add farewell", "add summary").
E2E test uses MCP test client to:
1. Call parsePlan → assert 3 blocks + mission
2. Call generateExecutor → assert source contains all 3 block ids
3. Load + start + step through CC() prompts with canned responses
4. Assert prompt order matches expected sequence
5. Assert console output shows all 3 blocks completed

<success>
- [ ] test-plan.md with 3 blocks parses correctly via parsePlan
- [ ] generateExecutor produces runnable CVM source from test-plan.md
- [ ] generated program loads into CVM without errors
- [ ] dry-run execution hits all CC() prompts in correct order
- [ ] retry loop works (respond "failed" once → fix → "passed" → advance)
- [ ] all 3 blocks complete in sequence
- [ ] console output shows all 3 blocks completed
- [ ] npx nx test mcp-server passes (all existing + new tests)
</success>
</block>

---

## Execution Order
```
01-plan-format       → no dependencies (pure docs + sample)
02-parser-unit       → depends on 01 (needs format definition)
03-mcp-tool          → depends on 02 (wraps parser as MCP tool)
04-executor-template → depends on 01 (needs format understanding, no code deps)
05-generate-tool     → depends on 02 + 04 (parser + template pattern)
06-e2e-integration   → depends on all (validates full pipeline)
```

## BTLT Checkpoints
After each block: Build → TypeCheck → Lint → Test (zero failures)
