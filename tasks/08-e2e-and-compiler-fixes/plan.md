# TDDAB Plan: E2E and Compiler Fixes
**Date:** 2026-10-09

<mission>
PROJECT: CVM (Cognitive Virtual Machine), Nx monorepo at /home/laco/cvm, TypeScript 5.8, Node 18+, Vitest 3. CVM compiles a TypeScript subset (only main(), no user functions, no try/catch) to bytecode (package @cvm/parser, function compile(source) returning { success, bytecode, errors[{message,line,character}] }) and runs it in a stack VM (package @cvm/vm, new VM().execute(bytecode) returning a state with status 'complete'|'error'|'waiting_cc', output string array, returnValue, error).

WHY: the e2e program suite (test/programs/run-all-tests.sh driving test/integration/mcp-test-client.ts against apps/cvm-server/dist/main.cjs) reports 64/64 PASSED while 8 programs actually end in "Execution error". Root causes, all verified in code and live:
(B) the compiler swallows errors: packages/parser/src/lib/compiler.ts catches every exception thrown while compiling a main() statement and assumes it was already recorded by context.reportError, but 7 visitor sites throw new Error(...) without reportError, so the statement is silently dropped or a loop is half-emitted (JUMP_IF_FALSE left at -1 → runtime "Invalid jump target: -1") and compile() still returns success true;
(C) break inside for-of / for-in emits ITER_END and then jumps to the loop end, which is itself ITER_END → the iterator is popped twice → "ITER_END: No active iterator";
(D) slice: the compiler always pushes target, start, end (PUSH_UNDEFINED when end is absent) and emits STRING_SLICE, but the VM handler guesses arity from value types, so s.slice(n) fails and arrays are not supported at all ("STRING_SLICE requires a string");
(A) the e2e client exits 0 even when load, start or execution fail, and has no way to declare an intentional-error test.

KEY FILES:
- Compiler driver: /home/laco/cvm/packages/parser/src/lib/compiler.ts (context.reportError(node, message) pushes {message,line,character} then throws; main-statement loop with the swallowing catch; unpatched-jump debug log after state.emit(OpCode.HALT)).
- Visitors with bare throws: /home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts (Method call 'X' is not supported; Unsupported call expression), /home/laco/cvm/packages/parser/src/lib/compiler/statements/expression-statement.ts (Compound assignment to array elements not yet supported), /home/laco/cvm/packages/parser/src/lib/compiler/expressions/object-literal.ts (Computed property names are not supported; Unsupported property type in object literal), /home/laco/cvm/packages/parser/src/lib/compiler/statements/for-of-statement.ts and for-in-statement.ts (Unsupported for-of / for-in variable declaration). Visitors receive (node, state, context) where context = { compileStatement, compileExpression, reportError }.
- break: /home/laco/cvm/packages/parser/src/lib/compiler/statements/break-statement.ts; loop contexts of type 'foreach' are pushed by for-of and for-in.
- slice: compiler /home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts (methodName === 'slice'); VM handler /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts ([OpCode.STRING_SLICE]); helpers in @cvm/types: isCVMString, isCVMUndefined, isCVMArrayRef, createCVMArray; heap: state.heap.get(ref.id) → { type: 'array', data: CVMArray{ elements } }, state.heap.allocate('array', createCVMArray(elements)) → ref (see STRING_SPLIT in advanced.ts).
- E2E client: /home/laco/cvm/test/integration/mcp-test-client.ts (tsx script; spawns node ../../apps/cvm-server/dist/main.cjs; argv: program path then CC responses). Its outcome logic moves to /home/laco/cvm/packages/integration/src/e2e-outcome.ts so it is unit-testable in the Nx project "integration".
- Runner: /home/laco/cvm/test/programs/run-all-tests.sh (run_test "<path>" [responses...], counts PASSED/FAILED by the client exit code).

COMMANDS:
- Block-scoped tests: npx nx test parser ; npx nx test vm ; npx nx test integration ; npx nx test mcp-server
- Focused: npx nx test PACKAGE -- FILE.spec.ts
- Build: npx nx run-many --target=build --all ; Typecheck: npx nx run-many --target=typecheck --all ; Lint: not configured (n/a)
- Full suite (FINAL REVIEW only): npx nx run-many --target=test --all, plus bash test/programs/run-all-tests.sh from /home/laco/cvm (needs a fresh build of apps/cvm-server/dist).
- ESM: relative imports use the .js extension. No code comments unless needed.
</mission>

<block id="01-compiler-reports-unsupported">
## TDDAB-1: Compiler Reports Unsupported Constructs Instead of Swallowing Them

<intro>
Files: /home/laco/cvm/packages/parser/src/lib/compiler.ts, the 5 visitor files listed in the mission (7 throw sites), new spec /home/laco/cvm/packages/parser/src/lib/compiler-error-reporting.spec.ts. No dependencies.

Change: every visitor throw site calls context.reportError(node, message) with the SAME message text (reportError records line/column and throws, so control flow is unchanged). Safety net in compiler.ts: the main-statement catch records any error that is not yet in errors (by message) at the statement start position. After emitting HALT, if no error was recorded but an instruction among JUMP, JUMP_IF_FALSE, BREAK, CONTINUE still has arg -1, push { message: 'Internal compiler error: unpatched jump at instruction N', line: 0, character: 0 }. Statements after an erroneous one are still compiled (errors are collected, compile continues).
Measured beforehand: with the safety net applied, parser/vm/mcp-server/integration suites stay green; across the 64 e2e programs only file-persistence.ts (Math.min, Date.now) is affected.
</intro>

<red>
- test: compile reports Method call min is not supported with line and column for const x = Math.min(1, 2) instead of dropping the statement
- test: compile returns success false and an error when Date.now() is used inside a for loop body
- test: compile reports computed property names in an object literal as an error
- test: compile reports compound assignment to an array element as an error
- test: statements after an unsupported one are still compiled and reported errors list only the real problems
- test: a valid program with for, for-of, while, break and continue compiles with no errors and no instruction left with jump target -1
</red>

### Implementation

compiler.ts main-statement loop:
```ts
try {
  compileStatement(stmt);
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (!errors.some(er => er.message === msg)) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(stmt.getStart());
    errors.push({ message: msg, line: line + 1, character: character + 1 });
  }
}
```
After state.emit(OpCode.HALT) and getBytecode():
```ts
if (errors.length === 0) {
  const jumpOps = [OpCode.JUMP, OpCode.JUMP_IF_FALSE, OpCode.BREAK, OpCode.CONTINUE];
  const idx = bytecode.findIndex(i => jumpOps.includes(i.op) && i.arg === -1);
  if (idx >= 0) {
    errors.push({ message: `Internal compiler error: unpatched jump at instruction ${idx}`, line: 0, character: 0 });
  }
}
```
Visitor sites (same messages):
```ts
// call-expression.ts (context already destructured as { compileExpression, reportError })
reportError(node, `Method call '${methodName}' is not supported`);
reportError(node, 'Unsupported call expression');
// expression-statement.ts, object-literal.ts, for-of-statement.ts, for-in-statement.ts:
// add reportError to the destructured context and replace each throw new Error(msg) with reportError(<offending node>, msg)
```

compiler-error-reporting.spec.ts:
```ts
import { compile } from './compiler.js';
const wrap = (body: string) => `function main() {\n${body}\n}`;

it('reports Math.min', () => {
  const r = compile(wrap('  const x = Math.min(1, 2);\n  console.log(x);'));
  expect(r.success).toBe(false);
  expect(r.errors[0].message).toContain("Method call 'min' is not supported");
  expect(r.errors[0].line).toBe(2);
});
it('reports Date.now in a for body', () => {
  const r = compile(wrap('  for (let i = 0; i < 3; i++) {\n    const t = Date.now();\n  }'));
  expect(r.success).toBe(false);
  expect(r.errors.some(e => e.message.includes("'now' is not supported"))).toBe(true);
});
it('reports computed property names', () => { /* const o = { [k]: 1 }; → 'Computed property names are not supported' */ });
it('reports compound assignment to array element', () => { /* arr[0] += 1; → 'Compound assignment to array elements not yet supported' */ });
it('keeps compiling after an error', () => {
  const r = compile(wrap('  const x = Math.min(1, 2);\n  console.log("after");'));
  expect(r.errors).toHaveLength(1);
  expect(r.bytecode.some(i => i.op === OpCode.PUSH && i.arg === 'after')).toBe(true);
});
it('valid loops leave no -1 jumps', () => {
  // for, for-of with break, while with continue → r.success true, no jump op with arg -1
});
```

<success>
- [ ] No `throw new Error` left in packages/parser/src/lib/compiler/** visitors; all 7 sites use reportError with unchanged messages
- [ ] compiler.ts records unreported errors at the statement position and reports unpatched -1 jumps when no other error exists
- [ ] All 6 RED tests pass: npx nx test parser -- compiler-error-reporting.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="02-break-in-foreach">
## TDDAB-2: break Inside for-of and for-in Exits the Loop Cleanly

<intro>
Files: /home/laco/cvm/packages/parser/src/lib/compiler/statements/break-statement.ts and new spec /home/laco/cvm/packages/vm/src/lib/vm-break-foreach.spec.ts (compile with compile from '@cvm/parser', execute with new VM().execute(compiled.bytecode), like vm-for-loops.spec.ts). Independent of block 01.

Today break in a 'foreach' context emits ITER_END and then BREAK to the loop-end address, which is the loop's own ITER_END (for-of-statement.ts and for-in-statement.ts patch breakTargets to the address of ITER_END) → the iterator is popped twice → RuntimeError "ITER_END: No active iterator" (e2e: 03-control-flow/for-of-loops.ts; live probe with for-in). Fix: break never emits ITER_END; the BREAK jump lands on the loop's ITER_END, which cleans up exactly once. Existing compile-only specs (compiler-break-continue.spec.ts) stay valid (ITER_END is still present at loop end).
</intro>

<red>
- test: break inside for-of stops the loop and execution completes with the statements after the loop
- test: break inside for-in stops the loop and execution completes with the statements after the loop
- test: continue inside for-of skips one element and the loop finishes normally
- test: break in an inner for-of exits only the inner loop and the outer for-of keeps iterating
- test: two consecutive for-of loops that both break complete without iterator errors
- test: break in a for-of nested inside a while loop exits only the for-of
</red>

### Implementation

break-statement.ts:
```ts
const loopContext = state.findLoopContext();
if (loopContext) {
  const breakIndex = state.emit(OpCode.BREAK, -1);
  loopContext.breakTargets = loopContext.breakTargets || [];
  loopContext.breakTargets.push(breakIndex);
} else {
  context.reportError(node, 'break statement not in loop');
}
```

vm-break-foreach.spec.ts:
```ts
function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}
it('break in for-of', () => {
  const s = run('for (const n of [1, 2, 3, 4]) { if (n === 3) { break; } console.log("n" + n); } console.log("after");');
  expect(s.status).toBe('complete');
  expect(s.output).toEqual(['n1', 'n2', 'after']);
});
it('break in for-in', () => {
  const s = run('const o = { a: 1, b: 2, c: 3 }; for (const k in o) { if (k === "b") { break; } console.log(k); } console.log("after");');
  expect(s.status).toBe('complete');
  expect(s.output).toEqual(['a', 'after']);
});
it('continue in for-of', () => { /* skip 2 → ['1','3'] then 'done' */ });
it('inner break only', () => { /* outer [1,2] x inner ["a","b","c"] break at "b" → 1a,2a,end */ });
it('two loops breaking', () => { /* both break, then 'end', status complete */ });
it('for-of inside while', () => { /* while i<2 { for-of break } → loop count 2, status complete */ });
```

<success>
- [ ] break-statement.ts emits no ITER_END for any loop type
- [ ] All 6 RED tests pass: npx nx test vm -- vm-break-foreach.spec.ts
- [ ] Existing compiler-break-continue.spec.ts still passes: npx nx test parser
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="03-slice-string-and-array">
## TDDAB-3: slice Works for Strings With One Argument and for Arrays

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts ([OpCode.STRING_SLICE] handler), /home/laco/cvm/packages/vm/src/lib/vm-string-slice.spec.ts (update to the real compiler contract), new spec /home/laco/cvm/packages/vm/src/lib/vm-slice-compiled.spec.ts (compile + execute real source). Independent of blocks 01-02.

Compiler contract (unchanged): target, start, end are ALWAYS pushed (end = PUSH_UNDEFINED when absent; start = PUSH 0 when absent), then STRING_SLICE. New handler: stackIn 3; pop end, start, target; end absent when isCVMUndefined(end) or end === undefined; target string → target.slice(start[, end]); target array ref → new heap array with the sliced elements (original unchanged); anything else → RuntimeError 'slice requires a string or an array'. Non-numeric start → RuntimeError 'slice requires a numeric start index'. The existing vm-string-slice.spec.ts tests that push only 2 values are rewritten to push PUSH_UNDEFINED as third value (the form the compiler emits).
</intro>

<red>
- test: compiled s.slice(6) on a string returns the suffix from index 6
- test: compiled s.slice(-5) on a string returns the last five characters
- test: compiled s.slice(0, 5) on a string still returns the first five characters
- test: compiled arr.slice(1, 3) on an array returns a new array with the two middle elements and leaves the original unchanged
- test: compiled arr.slice(2) on an array returns the tail and arr.slice() returns a full copy
- test: slice on a number fails with slice requires a string or an array
</red>

### Implementation

advanced.ts:
```ts
[OpCode.STRING_SLICE]: {
  stackIn: 3,
  stackOut: 1,
  execute: (state, instruction) => {
    if (state.stack.length < 3) {
      return { type: 'StackUnderflow', message: 'STRING_SLICE: Stack underflow', pc: state.pc, opcode: instruction.op };
    }
    const endVal = state.stack.pop()!;
    const startVal = state.stack.pop()!;
    const target = state.stack.pop()!;

    if (typeof startVal !== 'number') {
      return { type: 'RuntimeError', message: 'slice requires a numeric start index', pc: state.pc, opcode: instruction.op };
    }
    const end = (endVal === undefined || isCVMUndefined(endVal)) ? undefined : (endVal as number);

    if (isCVMString(target)) {
      state.stack.push(end === undefined ? target.slice(startVal) : target.slice(startVal, end));
      return undefined;
    }
    if (isCVMArrayRef(target)) {
      const heapObj = state.heap.get(target.id);
      if (heapObj && heapObj.type === 'array') {
        const elements = (heapObj.data as CVMArray).elements;
        const sliced = end === undefined ? elements.slice(startVal) : elements.slice(startVal, end);
        state.stack.push(state.heap.allocate('array', createCVMArray(sliced)));
        return undefined;
      }
    }
    return { type: 'RuntimeError', message: 'slice requires a string or an array', pc: state.pc, opcode: instruction.op };
  }
},
```
Handlers in advanced.ts pop with state.stack.pop() (no safePop helper). Extend the existing `@cvm/types` import line of advanced.ts (today: isCVMString, isCVMArray, createCVMArray, CVMValue, cvmToString, isCVMNumber, isCVMObjectRef, CVMObjectRef, CVMObject) with isCVMUndefined, isCVMArrayRef, CVMArray.

vm-slice-compiled.spec.ts:
```ts
function run(body: string) {
  const compiled = compile(`function main() {\n${body}\n}`);
  expect(compiled.errors).toHaveLength(0);
  return new VM().execute(compiled.bytecode);
}
it('string slice(6)', () => { expect(run('return "hello world".slice(6);').returnValue).toBe('world'); });
it('string slice(-5)', () => { expect(run('const s = "hello world"; return s.slice(-5);').returnValue).toBe('world'); });
it('string slice(0,5)', () => { expect(run('const s = "hello world"; return s.slice(0, 5);').returnValue).toBe('hello'); });
it('array slice(1,3)', () => {
  const s = run('const a = [1, 2, 3, 4]; const p = a.slice(1, 3); console.log(p.length + ":" + p[0] + "," + p[1] + ":" + a.length);');
  expect(s.status).toBe('complete');
  expect(s.output).toEqual(['2:2,3:4']);
});
it('array slice(2) and slice()', () => { /* tail length 2, copy length 4 */ });
it('slice on number fails', () => {
  const s = run('const n = 5; return n.slice(1);');
  expect(s.status).toBe('error');
  expect(s.error).toContain('slice requires a string or an array');
});
```

<success>
- [ ] STRING_SLICE always consumes 3 stack values and supports strings and arrays as specified
- [ ] vm-string-slice.spec.ts uses the 3-value compiler contract and passes
- [ ] All 6 RED tests pass: npx nx test vm -- vm-slice-compiled.spec.ts vm-string-slice.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="04-e2e-client-truthful-outcome">
## TDDAB-4: E2E Client Exit Code Reflects the Real Outcome

<intro>
Files: new /home/laco/cvm/packages/integration/src/e2e-outcome.ts and /home/laco/cvm/packages/integration/src/e2e-outcome.spec.ts (Nx project "integration"); /home/laco/cvm/test/integration/mcp-test-client.ts imports from '../../packages/integration/src/e2e-outcome.js' (run with tsx, which resolves .js to .ts); /home/laco/cvm/test/programs/run-all-tests.sh. Independent of blocks 01-03.

Today the client prints "✓" for load/start results even when they are errors and exits 0 when getTask returns "Error: …", so run-all-tests.sh counts failing programs as PASSED. New pure functions decide the outcome; the client calls them and exits with the returned code.
- parseClientArgs(argv): first non-flag = program path; "--expect-error=<text>" (anywhere) sets expectError; every other value is a CC response, in order.
- decideOutcome({ loadError?, startError?, finalText, outputFound, expectError? }) → { exitCode: 0 | 1, reason }:
  loadError → 1 "load failed: …"; startError → 1 "start failed: …";
  finalText starts with "Error:" → if expectError and finalText includes it → 0 "expected error"; else 1 "execution error: …";
  expectError set but finalText is a completion → 1 "expected error not raised";
  otherwise 0: "completed" when outputFound, "completed (no output)" when not — a program that prints nothing is valid (e.g. 01-basics/return-types.ts; the output file is only written when output is non-empty, vm-manager.ts appendOutput).
- run-all-tests.sh: the two regex demos get --expect-error with a substring of their real error ("Invalid regular expression" and "Expected string argument for regex test").
</intro>

<red>
- test: parseClientArgs separates program path, CC responses and the expect-error flag in any position
- test: decideOutcome returns exit code 1 when the program failed to load
- test: decideOutcome returns exit code 1 when the execution ends with an Error text and no error is expected
- test: decideOutcome returns exit code 0 when the execution error contains the expected error text
- test: decideOutcome returns exit code 1 when an expected error is not raised
- test: decideOutcome returns exit code 0 when the execution completed without an output file
- test: decideOutcome returns exit code 0 for a completed execution with output
</red>

### Implementation

packages/integration/src/e2e-outcome.ts:
```ts
export interface ClientArgs { programPath: string; responses: string[]; expectError?: string; }
export interface OutcomeInput { loadError?: string; startError?: string; finalText: string; outputFound: boolean; expectError?: string; }
export interface Outcome { exitCode: 0 | 1; reason: string; }

export function parseClientArgs(argv: string[]): ClientArgs {
  let expectError: string | undefined;
  const rest: string[] = [];
  for (const a of argv) {
    if (a.startsWith('--expect-error=')) expectError = a.slice('--expect-error='.length);
    else rest.push(a);
  }
  return { programPath: rest[0], responses: rest.slice(1), expectError };
}

export function decideOutcome(i: OutcomeInput): Outcome {
  if (i.loadError) return { exitCode: 1, reason: `load failed: ${i.loadError}` };
  if (i.startError) return { exitCode: 1, reason: `start failed: ${i.startError}` };
  if (i.finalText.startsWith('Error:')) {
    if (i.expectError && i.finalText.includes(i.expectError)) return { exitCode: 0, reason: 'expected error' };
    return { exitCode: 1, reason: `execution error: ${i.finalText}` };
  }
  if (i.expectError) return { exitCode: 1, reason: `expected error not raised: ${i.expectError}` };
  return { exitCode: 0, reason: i.outputFound ? 'completed' : 'completed (no output)' };
}
```
mcp-test-client.ts: use parseClientArgs(process.argv.slice(2)); record loadError when the load result isError or its text starts with "Error:" (same for start) and stop; keep the getTask loop; set outputFound from the output file read; at the end print the reason and process.exit(decideOutcome(...).exitCode).
run-all-tests.sh:
```bash
run_test "../programs/10-regex/regex-literal-errors.ts" "--expect-error=Invalid regular expression"
run_test "../programs/10-regex/regex-pattern-matching-errors.ts" "--expect-error=Expected string argument for regex test"
```

<success>
- [ ] e2e-outcome.ts exports parseClientArgs and decideOutcome with the specified rules
- [ ] mcp-test-client.ts exits with decideOutcome's code; run-all-tests.sh passes --expect-error to the two regex demos
- [ ] All 7 RED tests pass: npx nx test integration -- e2e-outcome.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

## Execution Order
01-compiler-reports-unsupported   → no dependencies (parser)
02-break-in-foreach               → no dependencies (parser + vm execution)
03-slice-string-and-array         → no dependencies (vm)
04-e2e-client-truthful-outcome    → no dependencies (integration client)

Follow-up STEP plan: plan-steps.md (rewrite invalid e2e programs, release hygiene, full e2e run, 2.1.1).
