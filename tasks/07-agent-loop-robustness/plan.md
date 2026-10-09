# TDDAB Plan: Agent Loop Robustness (issue #11 + tool responses + test scope)
**Date:** 2026-10-09

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx monorepo at /home/laco/cvm, TypeScript 5.8, Node 18+, Vitest 3.
CVM inverts control: a CVM program (TypeScript subset compiled to bytecode) runs in a VM and pauses at every CC("prompt") call; an AI agent pulls the prompt with the MCP tool getTask, does the work, and delivers the answer with the MCP tool submitTask. submitTask (VMManager.reportCCResult) pushes the answer and RESUMES the VM right away until the next CC, completion or error, and persists that state; getTask (VMManager.getNext) then returns the stored prompt or the final status.

WHY THIS PLAN: agents (notably local models such as Qwen in OpenCode) stall the loop:
(1) the planexecutor CROSS-CHECK prompt says "Respond ONLY with the completed JSON", so agents print the JSON in chat instead of calling submitTask (GitHub issue #11);
(2) the CROSS-CHECK answer parsing silently PASSES on any non-JSON answer: in CVM, JSON.parse returns null on invalid input (packages/vm/src/lib/handlers/strings.ts JSON_PARSE) and a for-in over null iterates zero times (packages/vm/src/lib/handlers/object-iterators.ts), so crossCheckPassed stays true; missing keys and null values also pass;
(3) submitTask answers only "Execution resumed" and getTask returns the bare CC text, so nothing tells the agent to keep the loop going;
(4) prompts never say which tests to run, so agents run the full test suite in every phase of every block, which becomes absurdly slow on big projects.

KEY FILES:
- Planexecutor CVM program (shipped builtin, exposed as @planexecutor): today at /home/laco/cvm/test/programs/tddab/planexecutor.ts; block 01 moves it to /home/laco/cvm/apps/cvm-server/programs/planexecutor.ts.
- Build copy of the program into the published package: /home/laco/cvm/apps/cvm-server/vite.config.ts (viteStaticCopy target with dest 'programs').
- Builtin resolution at runtime: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (BUILTIN_PROGRAMS maps '@planexecutor' to 'planexecutor.ts', resolved at runtime as join(serverDir, 'programs', 'planexecutor.ts') next to the server bundle; unchanged).
- MCP tools getTask and submitTask: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (server.tool('getTask', ...) and server.tool('submitTask', ...)).
- Planexecutor tests: /home/laco/cvm/packages/mcp-server/src/lib/planexecutor.spec.ts (drives the real program through VMManager: write .cvm/uplan.json with makeUplan(), loadProgram, startExecution, then loop getNext / reportCCResult and assert on the collected prompts). Also /home/laco/cvm/packages/mcp-server/src/lib/tddab-e2e.spec.ts uses EXECUTOR_PATH.
- MCP tool tests: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.spec.ts (VMManager mocked with vi.mock, tools invoked via TestTransport.callTool, assertions on result.content[0].text).
- Sample plans test/programs/tddab/sample-plan.md and sample-step-plan.md are test fixtures and STAY in test/programs/tddab/.

PLANEXECUTOR STRUCTURE (single main() function): reads .cvm/uplan.json {type, mission, blocks[{id,title,intro,red,redKeys,success,planRef}]}; per block: for type "step" EXECUTE then VERIFY loop (FIX + RE-VERIFY until passed) then UPDATE MEMORY BANK then COMMIT; for type "tddab" RED PHASE, GREEN PHASE, VERIFY PHASE loop (FIX PHASE + RE-VERIFY until passed), CROSS-CHECK (JSON template built from block.redKeys, each value null), cross-check FIX/RE-VERIFY loop if any value is false, UPDATE MEMORY BANK, COMMIT PHASE; after all blocks a FINAL REVIEW prompt. Prompt suffix constants at the top of main(): submitDone (" Submit ONLY one word: done."), submitTest (" Do all checking in your tool calls. Submit ONLY one word: passed or failed."), toolsReminder. Verdicts are parsed with toLowerCase().startsWith("passed").

CVM LANGUAGE CONSTRAINTS (critical for planexecutor edits):
- ONLY main() exists; user-defined helper functions are NOT supported (they silently return undefined). All logic must be inline in main().
- Use var, while loops, if/else, string concatenation. Supported string methods include indexOf, lastIndexOf, substring, toLowerCase, startsWith. Keep method chains short (one method per expression); the VM is fragile on long chains.
- JSON.parse returns null (does not throw) on invalid JSON. Computed property access obj[key] works on parsed objects.

COMMANDS:
- Focused tests: npx nx test mcp-server -- planexecutor.spec.ts   (or -- mcp-server.spec.ts)
- Block-scoped tests: npx nx test mcp-server ; npx nx test vm ; npx nx test cvm-server
- Build: npx nx run-many --target=build --all
- Typecheck: npx nx run-many --target=typecheck --all
- Lint: not configured in this repo (n/a, skip)
- Full suite (FINAL REVIEW only): npx nx run-many --target=test --all
- ESM: every relative import uses the .js extension.
- Code style: no code comments unless needed; match surrounding code.
- TEST DRIVER SAFETY: every test loop that drives the planexecutor (while next.type === 'waiting') MUST stop with an error after 200 prompts (throw new Error('runaway loop')), because CROSS-CHECK re-asks without limit by design; a wrong test answer must fail the test, never hang it.
</mission>

<block id="01-crosscheck-submit-and-extract">
## TDDAB-1: Relocate Planexecutor and Make CROSS-CHECK Submit + Extract JSON

<intro>
Preliminary move (merged here, not a separate block): git mv /home/laco/cvm/test/programs/tddab/planexecutor.ts /home/laco/cvm/apps/cvm-server/programs/planexecutor.ts; in /home/laco/cvm/apps/cvm-server/vite.config.ts change the viteStaticCopy src from join(__dirname, '../../test/programs/tddab/planexecutor.ts') to join(__dirname, 'programs/planexecutor.ts') (dest stays 'programs'); in /home/laco/cvm/packages/mcp-server/src/lib/planexecutor.spec.ts and /home/laco/cvm/packages/mcp-server/src/lib/tddab-e2e.spec.ts set EXECUTOR_PATH to resolve(WORKSPACE_ROOT, 'apps/cvm-server/programs/planexecutor.ts'). Sample plans stay in test/programs/tddab/.

Then fix issue #11 in the moved planexecutor: the CROSS-CHECK prompt must end with an explicit submit instruction (new constant submitJson) instead of "Respond ONLY with the completed JSON. NOTHING else.", and the answer is parsed by slicing from the first "{" to the last "}" before JSON.parse, so code fences and prose around the JSON are tolerated. Completeness validation and re-asking are NOT part of this block (block 02). No dependencies.
</intro>

<red>
- test: planexecutor is loaded from apps/cvm-server/programs/planexecutor.ts and test/programs/tddab/planexecutor.ts no longer exists
- test: CROSS-CHECK prompt contains the cvm_submitTask submit instruction and does not contain Respond ONLY with the completed JSON
- test: CROSS-CHECK answer wrapped in a json code fence with all values true proceeds to UPDATE MEMORY BANK without a FIX PHASE
- test: CROSS-CHECK answer with prose before and after the JSON object proceeds to UPDATE MEMORY BANK without a FIX PHASE
- test: CROSS-CHECK fenced answer containing a false value triggers the cross-check FIX PHASE
</red>

### Implementation

apps/cvm-server/programs/planexecutor.ts (top of main, next to submitDone/submitTest):
```ts
var submitJson = " Do all checking in your tool calls. Submit ONLY the completed JSON as your cvm_submitTask result, never as a chat message.";
```

CROSS-CHECK section (replaces the current CC + JSON.parse lines):
```ts
var crossCheckResponse = CC("CROSS-CHECK [" + progress + "] block " + block.id + ". " +
  "Use code navigation tools to verify EACH test exists in actual test file(s). " +
  "REQUIRED TESTS: " + block.red + " " +
  "Complete this JSON — set each value to true (test exists) or false (missing): " +
  jsonTemplate + toolsReminder + submitJson);

var jsStart = crossCheckResponse.indexOf("{");
var jsEnd = crossCheckResponse.lastIndexOf("}");
var checkResults = null;
if (jsStart >= 0 && jsEnd > jsStart) {
  checkResults = JSON.parse(crossCheckResponse.substring(jsStart, jsEnd + 1));
}

var crossCheckPassed = true;
for (var crKey in checkResults) {
  if (checkResults[crKey] === false) {
    crossCheckPassed = false;
  }
}
```

packages/mcp-server/src/lib/planexecutor.spec.ts — new tests reuse makeUplan/createVMManager and the getNext/reportCCResult loop:
```ts
it('loads planexecutor from apps/cvm-server/programs', () => {
  expect(existsSync(resolve(WORKSPACE_ROOT, 'apps/cvm-server/programs/planexecutor.ts'))).toBe(true);
  expect(existsSync(resolve(WORKSPACE_ROOT, 'test/programs/tddab/planexecutor.ts'))).toBe(false);
});

// shared driver used by the cross-check tests
async function runBlock(execId: string, crossCheckAnswers: string[]): Promise<string[]> {
  // block: { id: '01-cc', red: '- test one\n- test two' } -> redKeys test_one, test_two
  // answers: VERIFY/RE-VERIFY -> 'passed'; CROSS-CHECK* -> next item of crossCheckAnswers
  //          (last item repeated when exhausted); everything else -> 'done'
  // guard: more than 200 prompts -> throw new Error('runaway loop')
  // returns all prompts in order
}

it('CROSS-CHECK prompt asks to submit via cvm_submitTask', async () => {
  const prompts = await runBlock('cc-wording', ['{"test_one": true, "test_two": true}']);
  const cc = prompts.find(p => p.includes('CROSS-CHECK'))!;
  expect(cc).toContain('cvm_submitTask');
  expect(cc).toContain('never as a chat message');
  expect(cc).not.toContain('Respond ONLY with the completed JSON');
});

it('accepts a fenced JSON answer', async () => {
  const prompts = await runBlock('cc-fence', ['```json\n{"test_one": true, "test_two": true}\n```']);
  expect(prompts.some(p => p.includes('cross-check fix'))).toBe(false);
  expect(prompts.some(p => p.includes('UPDATE MEMORY BANK'))).toBe(true);
});

it('accepts JSON surrounded by prose', async () => {
  const prompts = await runBlock('cc-prose', ['Here is the result: {"test_one": true, "test_two": true} all good']);
  expect(prompts.some(p => p.includes('cross-check fix'))).toBe(false);
});

it('detects a false value inside a fenced answer', async () => {
  const prompts = await runBlock('cc-false', ['```json\n{"test_one": true, "test_two": false}\n```']);
  expect(prompts.some(p => p.includes('FIX PHASE') && p.includes('cross-check fix'))).toBe(true);
});
```

<success>
- [ ] apps/cvm-server/programs/planexecutor.ts exists and test/programs/tddab/planexecutor.ts is gone (git mv)
- [ ] apps/cvm-server/vite.config.ts copies programs/planexecutor.ts into dist/programs; after build apps/cvm-server/dist/programs/planexecutor.ts exists
- [ ] planexecutor.spec.ts and tddab-e2e.spec.ts use the new EXECUTOR_PATH
- [ ] CROSS-CHECK prompt ends with toolsReminder + submitJson; the string "Respond ONLY with the completed JSON" no longer exists in the planexecutor
- [ ] JSON is extracted with indexOf("{") / lastIndexOf("}") / substring before JSON.parse
- [ ] All 5 RED tests pass: npx nx test mcp-server -- planexecutor.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="02-crosscheck-validate-reask">
## TDDAB-2: Validate CROSS-CHECK Answer and Re-ask Until Valid

<intro>
File: /home/laco/cvm/apps/cvm-server/programs/planexecutor.ts (moved there by block 01) and its tests in /home/laco/cvm/packages/mcp-server/src/lib/planexecutor.spec.ts. Depends on block 01 (submitJson constant and JSON extraction exist).

Today, after extraction, an answer with no JSON object, a missing key, or a value left null still counts as passed (silent false positive). Required behaviour, decided with the user: an answer is VALID only if a JSON object is found AND every key in block.redKeys has the value true or false. An invalid answer is NEVER treated as passed or failed: the planexecutor re-asks with a "CROSS-CHECK RETRY" prompt that states what was wrong, repeats the JSON template and the submit instruction, and keeps re-asking WITHOUT any retry limit until a valid answer arrives. Only then are the values evaluated: any false goes to the existing cross-check FIX PHASE / RE-VERIFY path; extra keys not in redKeys are ignored. The pass evaluation iterates block.redKeys (not the answer's keys).

Existing test that this block would HANG: /home/laco/cvm/packages/mcp-server/src/lib/tddab-e2e.spec.ts (around lines 112-130) answers every CROSS-CHECK with the fixed string '{"t1": true, "t2": true}', whose keys do not match the real redKeys of test/programs/tddab/sample-plan.md (today it passes only because of the silent-pass bug). In this block the e2e driver builds the answer from the template inside the prompt: take the text from the first "{" to the last "}" of the CROSS-CHECK prompt and replace every ": null" with ": true"; add the 200-prompt runaway guard to that loop; keep its existing assertions (3 CROSS-CHECK prompts total) and add one asserting that no prompt contains CROSS-CHECK RETRY.
</intro>

<red>
- test: non-JSON answer to CROSS-CHECK is followed by a CROSS-CHECK RETRY prompt and never directly by UPDATE MEMORY BANK
- test: answer missing a required key triggers a CROSS-CHECK RETRY prompt that names the missing key
- test: answer with a required key left null triggers a CROSS-CHECK RETRY prompt that names that key
- test: re-ask has no limit: three invalid answers produce three CROSS-CHECK RETRY prompts and the fourth valid all-true answer proceeds to UPDATE MEMORY BANK
- test: CROSS-CHECK RETRY prompt contains the JSON template with all required keys and the cvm_submitTask submit instruction
- test: valid answer received on retry with a false value triggers the cross-check FIX PHASE
- test: extra keys not in the required list are ignored when all required keys are true
- test: tddab e2e pipeline answers CROSS-CHECK from the prompt template and completes with no CROSS-CHECK RETRY prompt
</red>

### Implementation

Replaces the extraction + for-in evaluation from block 01 (all inline in main(), no helper functions):
```ts
var crossCheckResponse = CC(/* CROSS-CHECK prompt from block 01, unchanged */);

var checkResults = null;
var crossCheckValid = false;
while (!crossCheckValid) {
  var jsStart = crossCheckResponse.indexOf("{");
  var jsEnd = crossCheckResponse.lastIndexOf("}");
  checkResults = null;
  if (jsStart >= 0 && jsEnd > jsStart) {
    checkResults = JSON.parse(crossCheckResponse.substring(jsStart, jsEnd + 1));
  }

  var ccProblem = "";
  if (checkResults === null) {
    ccProblem = "no valid JSON object found in your answer";
  } else {
    var vk = 0;
    while (vk < redKeys.length) {
      var ccValue = checkResults[redKeys[vk]];
      if (ccValue !== true && ccValue !== false) {
        ccProblem = ccProblem + " " + redKeys[vk];
      }
      vk = vk + 1;
    }
    if (ccProblem !== "") {
      ccProblem = "these keys are missing or not true/false:" + ccProblem;
    }
  }

  if (ccProblem === "") {
    crossCheckValid = true;
  } else {
    console.log("CROSS-CHECK invalid for " + block.id + ": " + ccProblem);
    crossCheckResponse = CC("CROSS-CHECK RETRY [" + progress + "] block " + block.id + ". " +
      "Your previous answer was not accepted: " + ccProblem + ". " +
      "Every key must be set to true (test exists) or false (missing). " +
      "Complete this JSON: " + jsonTemplate + submitJson);
  }
}

var crossCheckPassed = true;
var pk = 0;
while (pk < redKeys.length) {
  if (checkResults[redKeys[pk]] === false) {
    crossCheckPassed = false;
  }
  pk = pk + 1;
}
```

Tests in planexecutor.spec.ts reuse the runBlock(execId, crossCheckAnswers) driver from block 01 (block red '- test one\n- test two' gives redKeys test_one, test_two; every prompt containing CROSS-CHECK consumes the next answer):
```ts
it('re-asks on non-JSON answer', async () => {
  const prompts = await runBlock('ccv-text', ['all tests exist', '{"test_one": true, "test_two": true}']);
  const i = prompts.findIndex(p => p.startsWith('CROSS-CHECK ['));
  expect(prompts[i + 1]).toContain('CROSS-CHECK RETRY');
});

it('names a missing key', async () => {
  const prompts = await runBlock('ccv-missing', ['{"test_one": true}', '{"test_one": true, "test_two": true}']);
  expect(prompts.find(p => p.includes('CROSS-CHECK RETRY'))).toContain('test_two');
});

it('names a null key', async () => {
  const prompts = await runBlock('ccv-null', ['{"test_one": true, "test_two": null}', '{"test_one": true, "test_two": true}']);
  expect(prompts.find(p => p.includes('CROSS-CHECK RETRY'))).toContain('test_two');
});

it('re-asks without limit', async () => {
  const prompts = await runBlock('ccv-loop', ['x', 'y', 'z', '{"test_one": true, "test_two": true}']);
  expect(prompts.filter(p => p.includes('CROSS-CHECK RETRY'))).toHaveLength(3);
  expect(prompts.some(p => p.includes('UPDATE MEMORY BANK'))).toBe(true);
});

it('retry prompt repeats template and submit instruction', async () => {
  const prompts = await runBlock('ccv-tpl', ['nope', '{"test_one": true, "test_two": true}']);
  const retry = prompts.find(p => p.includes('CROSS-CHECK RETRY'))!;
  expect(retry).toContain('"test_one": null');
  expect(retry).toContain('"test_two": null');
  expect(retry).toContain('cvm_submitTask');
});

it('false value on retry goes to FIX PHASE', async () => {
  const prompts = await runBlock('ccv-false', ['nope', '{"test_one": true, "test_two": false}']);
  expect(prompts.some(p => p.includes('FIX PHASE') && p.includes('cross-check fix'))).toBe(true);
});

it('ignores extra keys', async () => {
  const prompts = await runBlock('ccv-extra', ['{"test_one": true, "test_two": true, "bonus": false}']);
  expect(prompts.some(p => p.includes('CROSS-CHECK RETRY'))).toBe(false);
  expect(prompts.some(p => p.includes('cross-check fix'))).toBe(false);
});
```

packages/mcp-server/src/lib/tddab-e2e.spec.ts (existing full-pipeline test loop):
```ts
if (prompts.length > 200) throw new Error('runaway loop');
if (next.message!.includes('CROSS-CHECK')) {
  const msg = next.message!;
  const tpl = msg.substring(msg.indexOf('{'), msg.lastIndexOf('}') + 1);
  response = tpl.split(': null').join(': true');
}
// after the loop, next to the existing assertions:
expect(prompts.filter(p => p.includes('CROSS-CHECK RETRY'))).toHaveLength(0);
```

<success>
- [ ] The CROSS-CHECK answer is accepted only when a JSON object is found and every redKeys entry is true or false
- [ ] Invalid answers produce a CROSS-CHECK RETRY prompt naming the problem, repeating jsonTemplate and submitJson, in a loop with no retry cap
- [ ] crossCheckPassed is computed by iterating redKeys; extra keys are ignored
- [ ] No helper functions added; logic is inline in main()
- [ ] tddab-e2e.spec.ts builds the CROSS-CHECK answer from the prompt template, has the runaway guard, and asserts no CROSS-CHECK RETRY
- [ ] All 8 RED tests pass and all block-01 tests still pass: npx nx test mcp-server -- planexecutor.spec.ts tddab-e2e.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="03-prompt-test-scope">
## TDDAB-3: Tiered Test Scope in Planexecutor Prompts

<intro>
File: /home/laco/cvm/apps/cvm-server/programs/planexecutor.ts and tests in /home/laco/cvm/packages/mcp-server/src/lib/planexecutor.spec.ts. Depends on block 01 (file location).

Agents run the whole test suite in every phase of every block; on big projects this becomes absurdly slow. Decided tiering, expressed as plain text in the prompts:
- while developing (step EXECUTE, RED PHASE, GREEN PHASE, every FIX PHASE / step FIX): run ONLY the tests being written or touched (single test file or name filter);
- end of block (step VERIFY, VERIFY PHASE, every RE-VERIFY): run the tests of the project(s)/package(s) the block touches;
- end of plan (FINAL REVIEW): the full test suite, once.
Two new constants scopeFocused and scopeBlock are appended to the corresponding prompts, placed before the submit suffix. Their wording deliberately says "whole suite" (never "full test suite") so that FINAL REVIEW stays the only prompt containing "full test suite". The plan's own success criteria are not overridden.
</intro>

<red>
- test: RED PHASE and GREEN PHASE prompts contain the focused test-scope instruction
- test: every FIX PHASE prompt, including the cross-check fix, contains the focused test-scope instruction
- test: VERIFY PHASE and every RE-VERIFY prompt contain the block test-scope instruction
- test: FINAL REVIEW is the only prompt that contains full test suite
- test: step plan EXECUTE and FIX prompts contain the focused scope and step VERIFY and RE-VERIFY prompts contain the block scope
</red>

### Implementation

Constants at the top of main():
```ts
var scopeFocused = " TEST SCOPE: run ONLY the tests you are writing or touching now (single test file or test-name filter), not the whole suite.";
var scopeBlock = " TEST SCOPE: run the tests of the project(s)/package(s) this block touches, not the whole suite; the full suite runs once at FINAL REVIEW.";
```

Wiring (each prompt keeps its existing text; the scope goes right before the existing submit constant):
```ts
// step
CC(missionCtx + "EXECUTE [...] ..." + block.planRef + toolsReminder + scopeFocused + submitDone);
CC("VERIFY [...] ..." + toolsReminder + scopeBlock + submitTest);
CC("FIX [...] ..." + block.planRef + toolsReminder + scopeFocused + submitDone);
CC("RE-VERIFY [...] ..." + toolsReminder + scopeBlock + submitTest);
// tddab
CC(missionCtx + "RED PHASE [...] ..." + block.planRef + toolsReminder + scopeFocused + submitDone);
CC("GREEN PHASE [...] ..." + toolsReminder + scopeFocused + submitDone);
var verifyPrompt = "VERIFY PHASE [...] ..." + toolsReminder + scopeBlock + submitTest;
CC("FIX PHASE [...] ..." + toolsReminder + scopeFocused + submitDone);          // verify-loop fix and both cross-check fixes
CC("RE-VERIFY [...] ..." + toolsReminder + scopeBlock + submitTest);           // all three RE-VERIFY prompts
// FINAL REVIEW unchanged: "Run a final full test suite to confirm no regressions."
```

Tests (planexecutor.spec.ts), driving one tddab block with one VERIFY failure and one cross-check false so FIX/RE-VERIFY variants appear, plus one step block (drivers keep the 200-prompt runaway guard):
```ts
const FOCUSED = 'run ONLY the tests you are writing or touching now';
const BLOCK = 'run the tests of the project(s)/package(s) this block touches';

it('focused scope on RED and GREEN', () => {
  expect(prompts.find(p => p.includes('RED PHASE'))).toContain(FOCUSED);
  expect(prompts.find(p => p.includes('GREEN PHASE'))).toContain(FOCUSED);
});
it('focused scope on every FIX PHASE', () => {
  const fixes = prompts.filter(p => p.startsWith('FIX PHASE'));
  expect(fixes.length).toBeGreaterThanOrEqual(2);
  fixes.forEach(p => expect(p).toContain(FOCUSED));
});
it('block scope on VERIFY and RE-VERIFY', () => {
  prompts.filter(p => p.startsWith('VERIFY PHASE') || p.startsWith('RE-VERIFY'))
    .forEach(p => expect(p).toContain(BLOCK));
});
it('only FINAL REVIEW asks for the full test suite', () => {
  const full = prompts.filter(p => p.includes('full test suite'));
  expect(full).toHaveLength(1);
  expect(full[0]).toContain('FINAL REVIEW');
});
it('step plan scopes', () => { /* type 'step', VERIFY fails once: EXECUTE/FIX -> FOCUSED, VERIFY/RE-VERIFY -> BLOCK */ });
```

<success>
- [ ] scopeFocused and scopeBlock constants exist with the exact wording above
- [ ] Every development prompt (EXECUTE, RED, GREEN, all FIX) carries scopeFocused; every verification prompt (VERIFY, all RE-VERIFY) carries scopeBlock
- [ ] FINAL REVIEW is the only prompt containing "full test suite"
- [ ] All 5 RED tests pass together with blocks 01-02 tests: npx nx test mcp-server -- planexecutor.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="04-vm-submit-returns-next-state">
## TDDAB-4: reportCCResult Returns the Next State and Completion Keeps the Return Value

<intro>
File: /home/laco/cvm/packages/vm/src/lib/vm-manager.ts; new test file /home/laco/cvm/packages/vm/src/lib/vm-manager-submit-result.spec.ts (copy the vi.mock('@cvm/storage') in-memory adapter setup from /home/laco/cvm/packages/vm/src/lib/vm-manager-submit-guard.spec.ts). Independent of blocks 01-03.

Facts verified in code: VMManager.reportCCResult(executionId, result): Promise of void already RESUMES the VM (vm.resume) until the next CC, completion or error, and persists the resulting state (AWAITING_COGNITIVE_RESULT + ccPrompt, COMPLETED + returnValue, or ERROR + error). getNext for an execution already in AWAITING_COGNITIVE_RESULT only re-reads execution.ccPrompt. Bug: when the program completes inside reportCCResult, a later getNext goes through the "not ready" COMPLETED branch, which returns type completed WITHOUT result, so the program's return value is lost (seen live: main() returned "end", getTask answered only "Execution completed").

Change: reportCCResult returns the existing ExecutionResult describing the state it reached (so the MCP layer can tell the agent what comes next), and the COMPLETED branch of getNext includes result: execution.returnValue. The ExecutionResult interface is unchanged. The only production caller is packages/mcp-server/src/lib/mcp-server.ts (submitTask), which ignores the return value until block 05, so this block is deployable alone.
</intro>

<red>
- test: reportCCResult returns type waiting with the next CC prompt when the program hits another CC
- test: reportCCResult returns type completed with the program return value when the program finishes
- test: reportCCResult returns type completed without result when main returns nothing
- test: reportCCResult returns type error with the error message when the program fails after the submit
- test: getNext after completion inside reportCCResult returns the program return value as result
- test: getNext on an already completed execution without return value returns type completed and undefined result
</red>

### Implementation

packages/vm/src/lib/vm-manager.ts:
```ts
async reportCCResult(executionId: string, result: string): Promise<ExecutionResult> {
  // ... unchanged guards, vm.resume(...), output append, serialize ...
  let next: ExecutionResult;
  if (newState.status === 'complete') {
    execution.state = 'COMPLETED';
    if (newState.returnValue !== undefined) {
      execution.returnValue = newState.returnValue;
    }
    this.vms.delete(executionId);
    next = { type: 'completed', message: 'Execution completed', result: newState.returnValue };
  } else if (newState.status === 'error') {
    execution.state = 'ERROR';
    execution.error = newState.error;
    this.vms.delete(executionId);
    next = { type: 'error', error: newState.error };
  } else if (newState.status === 'waiting_cc') {
    execution.state = 'AWAITING_COGNITIVE_RESULT';
    execution.ccPrompt = newState.ccPrompt;
    next = { type: 'waiting', message: newState.ccPrompt || 'Waiting for input' };
  } else {
    execution.state = 'RUNNING';
    next = { type: 'waiting' };
  }
  await this.storage.saveExecution(execution);
  return next;
}
```
getNext, "not ready" COMPLETED branch:
```ts
if (execution.state === 'COMPLETED') {
  return {
    type: 'completed',
    message: 'Execution completed',
    result: execution.returnValue
  };
}
```

packages/vm/src/lib/vm-manager-submit-result.spec.ts:
```ts
it('returns the next CC prompt', async () => {
  await vm.loadProgram('p1', 'function main() { var a = CC("first"); var b = CC("second " + a); return b; }');
  await vm.startExecution('p1', 'e1');
  await vm.getNext('e1');
  const next = await vm.reportCCResult('e1', 'x');
  expect(next).toEqual({ type: 'waiting', message: 'second x' });
});

it('returns completion with the return value', async () => {
  // same program, two submits
  const done = await vm.reportCCResult('e1', 'end');
  expect(done.type).toBe('completed');
  expect(done.result).toBe('end');
});

it('completion without return value', async () => {
  await vm.loadProgram('p2', 'function main() { CC("only"); }');
  // start, getNext, submit
  expect(done).toEqual({ type: 'completed', message: 'Execution completed', result: undefined });
});

it('returns error when the program fails after the submit', async () => {
  // program: function main() { var r = CC("q"); var n = +r; var o = JSON.parse(n); return o; }
  // submit "5" -> RuntimeError "JSON_PARSE requires a string" (verified live on cvm-dbg 2026-10-09)
  expect(res.type).toBe('error');
  expect(res.error).toContain('JSON_PARSE requires a string');
});

it('getNext keeps the return value after completion inside reportCCResult', async () => {
  // after done above:
  const again = await vm.getNext('e1');
  expect(again).toEqual({ type: 'completed', message: 'Execution completed', result: 'end' });
});

it('getNext on completed execution without return value', async () => {
  const again = await vm.getNext('e2');
  expect(again.type).toBe('completed');
  expect(again.result).toBeUndefined();
});
```

<success>
- [ ] reportCCResult signature is Promise of ExecutionResult and returns waiting / completed (with result) / error matching the persisted state
- [ ] getNext COMPLETED branch returns result: execution.returnValue
- [ ] ExecutionResult interface unchanged; mcp-server still compiles without changes
- [ ] All 6 RED tests pass: npx nx test vm -- vm-manager-submit-result.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="05-tool-response-guidance">
## TDDAB-5: Loop Guidance in submitTask and getTask Responses

<intro>
File: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts and tests in /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.spec.ts (VMManager is mocked with vi.mock('@cvm/vm'); tools are invoked through TestTransport.callTool, whose return type is CallToolResult or an error object, so assertions use the guard 'content' in result like the existing tests). Depends on block 04 (VMManager.reportCCResult returns ExecutionResult).

Today submitTask always answers "Execution resumed" (even after the last CC) and getTask returns the bare CC text, so agents end their turn or answer in chat. Wording decided with the user (short, always naming the tool):
- submitTask, next state waiting (or an undefined return from a mocked VMManager): "OK. Call getTask for the next task."
- submitTask, next state completed: "OK. Execution completed." or, with a return value, "OK. Execution completed with result: " + JSON.stringify(result)
- submitTask, next state error: isError true, text "Error: " + error
- getTask, waiting state: the CC text (or "Waiting for input") followed by "\n\n--- When done, call submitTask with your result as requested."
getTask completed/error responses and the submitTask exception path are unchanged. The existing tests asserting 'resumed' and the bare CC text are updated to the new contract.
</intro>

<red>
- test: submitTask returns OK. Call getTask for the next task. when the next state is waiting
- test: submitTask returns OK. Call getTask for the next task. when VMManager returns nothing
- test: submitTask returns OK. Execution completed. when the program finished without a result
- test: submitTask returns OK. Execution completed with result: and the JSON result when the program returned a value
- test: submitTask returns isError with Error: and the message when the next state is error
- test: submitTask still calls VMManager.reportCCResult with executionId and result
- test: submitTask exception path returns isError with the message and without OK text
- test: getTask waiting returns the CC message followed by the submitTask reminder
- test: getTask waiting with empty message returns Waiting for input followed by the submitTask reminder
- test: getTask completed and error responses contain no submitTask reminder
</red>

### Implementation

packages/mcp-server/src/lib/mcp-server.ts (module level, next to BUILTIN_PROGRAMS):
```ts
const SUBMIT_ACK = 'OK. Call getTask for the next task.';
const SUBMIT_REMINDER = '\n\n--- When done, call submitTask with your result as requested.';
```
getTask waiting branch:
```ts
} else if (result.type === 'waiting') {
  return {
    content: [{ type: 'text', text: (result.message || 'Waiting for input') + SUBMIT_REMINDER }]
  };
}
```
submitTask success path:
```ts
const next = await this.vmManager.reportCCResult(execId, result);
if (next && next.type === 'completed') {
  const text = next.result !== undefined
    ? `OK. Execution completed with result: ${JSON.stringify(next.result)}`
    : 'OK. Execution completed.';
  return { content: [{ type: 'text', text }] };
}
if (next && next.type === 'error') {
  return { content: [{ type: 'text', text: `Error: ${next.error}` }], isError: true };
}
return { content: [{ type: 'text', text: SUBMIT_ACK }] };
```

packages/mcp-server/src/lib/mcp-server.spec.ts:
```ts
const REMINDER = '\n\n--- When done, call submitTask with your result as requested.';

it('submitTask waiting -> getTask hint', async () => {
  mockVMManager.reportCCResult.mockResolvedValueOnce({ type: 'waiting', message: 'next?' });
  const result = await testTransport.callTool('submitTask', { executionId: 'exec-1', result: 'Goodbye!' });
  expect('content' in result && result.content[0].text).toBe('OK. Call getTask for the next task.');
  expect(mockVMManager.reportCCResult).toHaveBeenCalledWith('exec-1', 'Goodbye!');
});

it('submitTask undefined -> getTask hint', async () => {
  mockVMManager.reportCCResult.mockResolvedValueOnce(undefined);
  // same expectation
});

it('submitTask completed without result', async () => {
  mockVMManager.reportCCResult.mockResolvedValueOnce({ type: 'completed', message: 'Execution completed' });
  // text === 'OK. Execution completed.'
});

it('submitTask completed with result', async () => {
  mockVMManager.reportCCResult.mockResolvedValueOnce({ type: 'completed', message: 'Execution completed', result: 'end' });
  // text === 'OK. Execution completed with result: "end"'
});

it('submitTask next state error', async () => {
  mockVMManager.reportCCResult.mockResolvedValueOnce({ type: 'error', error: 'boom' });
  // isError true, text === 'Error: boom'
});

it('submitTask exception has no OK text', async () => {
  mockVMManager.reportCCResult.mockRejectedValueOnce(new Error('Execution not found'));
  // 'content' in result: isError true, text contains 'Execution not found', not 'OK.'
});

it('getTask waiting appends reminder', async () => {
  mockVMManager.getNext.mockResolvedValueOnce({ type: 'waiting', message: 'What should I say next?' });
  // text === 'What should I say next?' + REMINDER
});

it('getTask waiting fallback appends reminder', async () => {
  mockVMManager.getNext.mockResolvedValueOnce({ type: 'waiting', message: '' });
  // text === 'Waiting for input' + REMINDER
});

it('getTask completed / error have no reminder', async () => {
  // completed -> contains 'completed', not 'call submitTask'; error -> contains 'Error: Stack overflow', not 'call submitTask'
});
```

<success>
- [ ] submitTask text depends on the returned state exactly as specified; "Execution resumed" no longer appears in packages/mcp-server/src
- [ ] getTask waiting text = CC message (or "Waiting for input") + "\n\n--- When done, call submitTask with your result as requested."
- [ ] getTask completed/error and the submitTask exception path are unchanged
- [ ] All 10 RED tests pass and the updated existing tests pass: npx nx test mcp-server -- mcp-server.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="06-redkey-full-length">
## TDDAB-6: RED Keys Use the Full Test Text and Duplicates Fail Validation

<intro>
Files: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (function toRedKey near the top, and the parsePlan tool handler which builds redKeys in BOTH the single-file path and the multi-file path), tests in /home/laco/cvm/packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts (harness: write a plan into testDir, transport.callTool('parsePlan', { filePath }), read uplan.json from dataDir), the local toRedKey copies in /home/laco/cvm/packages/mcp-server/src/lib/planexecutor.spec.ts and /home/laco/cvm/packages/mcp-server/src/lib/tddab-e2e.spec.ts (two copies), and the redKeys description in /home/laco/cvm/docs/PLAN_FORMAT.md section 6. Independent of blocks 01-05.

Bug found while executing this plan: toRedKey truncates the normalized test text to 40 characters, so two different tests that start with the same 40 characters (e.g. "reportCCResult returns type completed with the program return value" and "reportCCResult returns type completed without result") get the SAME key; the CROSS-CHECK JSON template then contains duplicate keys and one existing test can mask a missing one.
Decision (user): keys are NOT truncated. toRedKey = strip non-alphanumeric (keep spaces), trim, collapse spaces to "_", lowercase. If two RED tests of the same tddab block still normalize to the same key (identical text), parsePlan fails validation with isError true and the message: Block "BLOCK_ID" has duplicate red tests: KEY. Action blocks (step plans, "- action:" lines) are not checked for duplicates.
</intro>

<red>
- test: parsePlan writes the full normalized test text as redKey without truncating at 40 characters
- test: two red tests sharing the same first 40 characters get two different redKeys
- test: parsePlan fails validation naming the block when two red tests of one block normalize to the same key
- test: duplicate red tests inside a sub-file of a multi-file plan also fail validation
- test: repeated action lines in a step plan block are still accepted
</red>

### Implementation

packages/mcp-server/src/lib/mcp-server.ts:
```ts
function toRedKey(test: string): string {
  return test.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ +/g, '_').toLowerCase();
}

function findDuplicateRedKey(redTests: string[]): string | undefined {
  const seen = new Set<string>();
  for (const t of redTests) {
    const key = toRedKey(t);
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return undefined;
}
```
Single-file path, after result.valid check, before building uplanData:
```ts
for (const b of plan.blocks) {
  const dup = b.isAction ? undefined : findDuplicateRedKey(b.redTests);
  if (dup) {
    return {
      content: [{ type: 'text', text: `Plan validation failed:\nBlock "${b.id}" has duplicate red tests: ${dup}` }],
      isError: true
    };
  }
}
```
Multi-file path, inside the per-block loop, next to the duplicate block id check:
```ts
const dup = block.isAction ? undefined : findDuplicateRedKey(block.redTests);
if (dup) {
  return {
    content: [{ type: 'text', text: `Plan validation failed in ${subFile}:\nBlock "${block.id}" has duplicate red tests: ${dup}` }],
    isError: true
  };
}
```
Test helpers: in planexecutor.spec.ts and tddab-e2e.spec.ts remove `.substring(0, 40).trim()` from the local toRedKey copies so they match production.
docs/PLAN_FORMAT.md section 6: replace "take first 40 chars, " with nothing and add "Two red tests of one block that normalize to the same key are a validation error."

packages/mcp-server/src/lib/mcp-server-parseplan.spec.ts:
```ts
const longA = 'reportCCResult returns type completed with the program return value';
const longB = 'reportCCResult returns type completed without result when main returns nothing';
// plan with one block whose red has "- test: " + longA and "- test: " + longB
it('keeps the full key', async () => {
  // parsePlan, read uplan.json
  expect(uplan.blocks[0].redKeys[0]).toBe('reportccresult_returns_type_completed_with_the_program_return_value');
});
it('distinct keys for same 40-char prefix', async () => {
  expect(new Set(uplan.blocks[0].redKeys).size).toBe(2);
});
it('duplicate red tests fail', async () => {
  // block 01-dup with "- test: same thing" twice
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('Block "01-dup" has duplicate red tests: same_thing');
});
it('duplicate red tests in a sub-file fail', async () => { /* index.md + 01-dup.md, same assertion with "in 01-dup.md" */ });
it('repeated action lines are accepted', async () => {
  // step block with "- action: run build" twice -> valid true
});
```

<success>
- [ ] toRedKey no longer truncates; full normalized text is the key
- [ ] Duplicate red keys inside a tddab block fail parsePlan (single-file and multi-file) with the specified message; action blocks are not checked
- [ ] Local toRedKey copies in planexecutor.spec.ts and tddab-e2e.spec.ts match production; docs/PLAN_FORMAT.md updated
- [ ] All 5 RED tests pass: npx nx test mcp-server -- mcp-server-parseplan.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

## Execution Order
01-crosscheck-submit-and-extract → no dependencies (includes the planexecutor move)
02-crosscheck-validate-reask     → depends on 01
03-prompt-test-scope             → depends on 01 (can run parallel with 02, same file → run sequentially)
04-vm-submit-returns-next-state  → no dependencies (packages/vm)
05-tool-response-guidance        → depends on 04 (packages/mcp-server)
06-redkey-full-length            → no dependencies (packages/mcp-server parsePlan; found during execution)

Follow-up STEP plan: plan-rules.md (.ai-agent rules + release 2.1.0), executed after this plan.
