# B — Simplification

<block id="05-method-dispatch-table">
## TDDAB-5: Table-Driven Method Calls with a Fixed Argument Contract

<intro>
Files: /home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts, new /home/laco/cvm/packages/parser/src/lib/compiler/expressions/method-table.ts, new /home/laco/cvm/packages/parser/src/lib/compiler/expressions/method-table.spec.ts, /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts ([OpCode.STRING_SUBSTRING] only). Depends on block 01 (compile structure).

Today call-expression.ts has ~25 `else if (methodName === …)` branches with the same shape: compile the receiver, compile each argument or push a default, emit one opcode (lines ~104-366). Some optional arguments push nothing (substring end) so the VM handler must guess arity from value types (`advanced.ts` STRING_SUBSTRING: "Minimum 2, optionally 3"). There is also unreachable code at the `match` branch (`return reportError(...); return;`).
Change: a declarative table METHODS: Record<string, { op: OpCode; args: ArgDefault[]; required?: number }> where ArgDefault is `{ push: CVMValue }` or `'undefined'` (emit PUSH_UNDEFINED). Generic emitter: compile receiver; for i in args: compile node.arguments[i] if present, else emit the default; if fewer than `required` arguments → reportError(node, `${name}() requires …`). Every optional trailing argument now ALWAYS pushes a value, so each opcode has a fixed stack contract; STRING_SUBSTRING becomes stackIn 3 with an undefined end meaning "to the end" (same contract STRING_SLICE got in feature 08). Table entries (op, args): substring(STRING_SUBSTRING,[0,undef]), indexOf(STRING_INDEXOF,['']), split(STRING_SPLIT,['']), slice(STRING_SLICE,[0,undef]), join(ARRAY_JOIN,[',']), charAt(STRING_CHARAT,[0]), toUpperCase(STRING_TOUPPERCASE,[]), toLowerCase(STRING_TOLOWERCASE,[]), toString(TO_STRING,[]), includes(STRING_INCLUDES,['']), endsWith(STRING_ENDS_WITH,['']), startsWith(STRING_STARTS_WITH,['']), trim(STRING_TRIM,[]), trimStart(STRING_TRIM_START,[]), trimEnd(STRING_TRIM_END,[]), test(REGEX_TEST,['']), match(STRING_MATCH,[undef], required 1), replace(STRING_REPLACE_REGEX,['','']), replaceAll(STRING_REPLACE_ALL,['','']), lastIndexOf(STRING_LAST_INDEX_OF,['']), repeat(STRING_REPEAT,[0]), padStart(STRING_PAD_START,[0,' ']), padEnd(STRING_PAD_END,[0,' ']), push(ARRAY_PUSH,[undef]). Non-method calls (CC, console.log, fs.*, JSON.*, Object.keys) keep their explicit code. Behaviour of every existing method is unchanged (the 718 VM + 250 parser tests and the 64 e2e programs are the safety net).
</intro>

<red>
- test: every method name in the table emits receiver, one value per declared argument and then its opcode
- test: a missing optional argument emits its declared default
- test: s.substring(2) emits PUSH_UNDEFINED as end and returns the suffix at runtime
- test: s.substring(1, 3) still returns the middle characters
- test: match() without an argument is a compile error with match() requires a regex argument
- test: an unknown method is still a compile error Method call 'x' is not supported
</red>

### Implementation

method-table.ts:
```ts
import { OpCode } from '../../bytecode.js';
export type ArgDefault = { push: string | number } | 'undefined';
export interface MethodSpec { op: OpCode; args: ArgDefault[]; required?: number; requiredMessage?: string }
const u = 'undefined' as const;
export const METHODS: Record<string, MethodSpec> = {
  substring: { op: OpCode.STRING_SUBSTRING, args: [{ push: 0 }, u] },
  slice: { op: OpCode.STRING_SLICE, args: [{ push: 0 }, u] },
  indexOf: { op: OpCode.STRING_INDEXOF, args: [{ push: '' }] },
  match: { op: OpCode.STRING_MATCH, args: [u], required: 1, requiredMessage: 'match() requires a regex argument' },
  padStart: { op: OpCode.STRING_PAD_START, args: [{ push: 0 }, { push: ' ' }] },
  // … all entries listed in the intro
};
```
call-expression.ts generic branch:
```ts
const spec = METHODS[methodName];
if (!spec) return reportError(node, `Method call '${methodName}' is not supported`);
if (spec.required && node.arguments.length < spec.required) return reportError(node, spec.requiredMessage!);
compileExpression(node.expression.expression);
spec.args.forEach((def, i) => {
  if (node.arguments[i]) compileExpression(node.arguments[i]);
  else if (def === 'undefined') state.emit(OpCode.PUSH_UNDEFINED);
  else state.emit(OpCode.PUSH, def.push);
});
state.emit(spec.op);
```
advanced.ts STRING_SUBSTRING: `stackIn: 3`; pop end, start, str; end absent when isCVMUndefined(end).

<success>
- [ ] call-expression.ts has no per-method if/else chain; METHODS drives all receiver methods; the unreachable `return;` after reportError is gone
- [ ] STRING_SUBSTRING has stackIn 3 and no arity guessing
- [ ] All 6 RED tests pass: npx nx test parser -- method-table.spec.ts and npx nx test vm -- vm-string-substring.spec.ts (new, compiled substring cases)
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="06-array-aware-methods">
## TDDAB-6: includes / indexOf / lastIndexOf / toString Work on Arrays

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts (STRING_INDEXOF ~:301, TO_STRING ~:481, STRING_INCLUDES ~:501, STRING_LAST_INDEX_OF), /home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts (ARRAY_INDEX_OF ~:499 logic extracted), /home/laco/cvm/packages/vm/src/lib/audit-repro.spec.ts. Depends on block 05 (fixed argument contract).

Bug (audit B4, B5, B6): the compiler cannot know the receiver type, so `arr.includes(2)` emits STRING_INCLUDES ("requires a string"), `arr.indexOf("y")` emits STRING_INDEXOF ("requires string arguments"), `arr.toString()` returns "[object Object]". An ARRAY_INDEX_OF handler already exists (arrays.ts:499) but is never emitted. Change: dispatch on the runtime receiver inside the string handlers: if the receiver is an array reference, use array semantics — indexOf/lastIndexOf: strict-equality search over elements (same comparison as ARRAY_INDEX_OF; extract it as `arrayIndexOf(state, ref, value, fromEnd)` in arrays.ts and reuse it in both places); includes: indexOf >= 0; toString: elements joined with ',' using cvmToString (JS Array.prototype.toString). Strings keep their current behaviour.
</intro>

<red>
- test: audit repro arr.includes(2) returns true now passes as a normal it
- test: audit repro arr.indexOf("y") returns 1 now passes as a normal it
- test: audit repro arr.toString() returns the comma-joined elements now passes as a normal it
- test: arr.lastIndexOf finds the last matching element and returns -1 when absent
- test: arr.includes on a missing element returns false
- test: string includes indexOf and toString keep their current results
</red>

### Implementation
```ts
// arrays.ts
export function arrayIndexOf(state: VMState, ref: CVMArrayRef, value: CVMValue, fromEnd = false): number {
  const elements = (state.heap.get(ref.id)!.data as CVMArray).elements;
  const order = fromEnd ? [...elements.keys()].reverse() : [...elements.keys()];
  for (const i of order) if (strictEquals(elements[i], value)) return i;
  return -1;
}
// advanced.ts STRING_INCLUDES
if (isCVMArrayRef(target)) { state.stack.push(arrayIndexOf(state, target, search) >= 0); return undefined; }
// TO_STRING
if (isCVMArrayRef(target)) { state.stack.push(elementsOf(state, target).map(cvmToString).join(',')); return undefined; }
```
(`strictEquals` = the EQ_STRICT predicate from block 02, exported from comparison.ts.)

<success>
- [ ] The 3 array audit repros are `it` and pass; ARRAY_INDEX_OF reuses arrayIndexOf
- [ ] All 6 RED tests pass: npx nx test vm -- audit-repro.spec.ts vm-array-string-methods.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="07-single-slice-implementation">
## TDDAB-7: One Array-Slice Implementation

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts (ARRAY_SLICE ~:409), /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts (STRING_SLICE ~:355). Independent of 05/06.

Array slicing is implemented twice: ARRAY_SLICE (never emitted by the compiler) and the array branch of STRING_SLICE (added in feature 08 block 03). Change: extract `sliceArray(state, ref, start, end?) → CVMArrayRef` in arrays.ts; ARRAY_SLICE and STRING_SLICE both call it. Behaviour unchanged.
</intro>

<red>
- test: sliceArray returns a new heap array and leaves the source untouched
- test: sliceArray with negative start and absent end matches Array.prototype.slice
- test: STRING_SLICE on an array and ARRAY_SLICE give identical elements for the same arguments
</red>

### Implementation
```ts
export function sliceArray(state: VMState, ref: CVMArrayRef, start: number, end?: number): CVMArrayRef {
  const elements = (state.heap.get(ref.id)!.data as CVMArray).elements;
  return state.heap.allocate('array', createCVMArray(end === undefined ? elements.slice(start) : elements.slice(start, end)));
}
```

<success>
- [ ] Only sliceArray contains array-slice logic
- [ ] All 3 RED tests pass: npx nx test vm -- vm-slice-compiled.spec.ts arrays-new-methods.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="08-runtime-error-helper">
## TDDAB-8: runtimeError() Helper for VM Handlers

<intro>
Files: new /home/laco/cvm/packages/vm/src/lib/handlers/errors.ts, all /home/laco/cvm/packages/vm/src/lib/handlers/*.ts that build `{ type: 'RuntimeError', message, pc: state.pc, opcode: instruction.op }` literals (91 occurrences). Independent.

Mechanical refactor: `runtimeError(state, instruction, message): VMError` replaces every hand-written RuntimeError literal; messages stay byte-identical (existing tests assert them). No behaviour change.
</intro>

<red>
- test: runtimeError builds a RuntimeError with the message, the current pc and the instruction opcode
- test: no handler source file still contains a hand-written RuntimeError object literal
</red>

### Implementation
```ts
export function runtimeError(state: VMState, instruction: Instruction, message: string): VMError {
  return { type: 'RuntimeError', message, pc: state.pc, opcode: instruction.op };
}
```
The second test reads the handler sources with fs and asserts no match for /type:\s*'RuntimeError'/ outside errors.ts.

<success>
- [ ] 0 RuntimeError literals outside errors.ts; all messages unchanged
- [ ] Both RED tests pass: npx nx test vm -- errors.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="09-single-stack-check-and-trace">
## TDDAB-9: One Stack Check and One Trace Log per Instruction

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/stack-utils.ts (delete), /home/laco/cvm/packages/vm/src/lib/stack-utils.spec.ts (delete), the 7 handler files using safePop (arithmetic, comparison, logical, object-iterators, objects, regex, strings — 40 calls, LSAI), /home/laco/cvm/packages/vm/src/lib/vm.ts (~:93 and ~:102). Depends on block 08.

Stack depth is already guaranteed by `validateStack()` before every handler (vm.ts:64-73, uses handler.stackIn), so `safePop`/`isVMError` after it are dead defensive code: replace with `state.stack.pop()!`. Every handler's stackIn must equal the number of values it pops (check each touched handler). The VM logs "Executing instruction" twice per instruction (logger.trace + vmLogger.trace); keep one, guarded by `isLevelEnabled('trace')` so no object is built when trace is off.
</intro>

<red>
- test: a handler with stackIn N receives an underflow error from validateStack before its own code runs
- test: no handler imports safePop
- test: with trace disabled the instruction loop does not build per-instruction log objects
- test: with trace enabled exactly one Executing instruction entry is logged per instruction
</red>

### Implementation
```ts
// vm.ts loop
if (this.traceEnabled) this.vmLogger.trace({ pc: state.pc, opcode: OpCode[instruction.op], arg: instruction.arg, stackSize: state.stack.length }, 'Executing instruction');
// traceEnabled = this.vmLogger.isLevelEnabled('trace'), computed once per execute()
```

<success>
- [ ] stack-utils.ts removed; 0 safePop references (LSAI usages)
- [ ] One guarded trace call per instruction
- [ ] All 4 RED tests pass: npx nx test vm -- vm-hot-loop.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="10-vm-state-transition">
## TDDAB-10: One VM-State to Execution Mapping

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/vm-manager.ts (getNext ~:114-210, reportCCResult ~:216-290). Independent.

getNext (`:153-185`) and reportCCResult (`:260-285`) duplicate the same mapping VMState → execution.state / ExecutionResult (complete → COMPLETED + returnValue, error → ERROR, waiting_cc → AWAITING_COGNITIVE_RESULT + ccPrompt). The comment `:112` "This is READ-ONLY" is false (getNext executes the VM). Change: private `applyVMState(executionId, execution, state): ExecutionResult` used by both; fix the comment.
</intro>

<red>
- test: applyVMState maps complete to COMPLETED with the return value and drops the cached VM
- test: applyVMState maps error to ERROR with the message
- test: applyVMState maps waiting_cc to AWAITING_COGNITIVE_RESULT with the prompt
</red>

### Implementation
Tests go through the public API (getNext / reportCCResult with in-memory storage, as vm-manager-submit-result.spec.ts) and assert identical results for both paths.

<success>
- [ ] Both methods delegate to applyVMState; the READ-ONLY comment is corrected
- [ ] All 3 RED tests pass: npx nx test vm -- vm-manager-state.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="11-dead-code-removal">
## TDDAB-11: Remove Dead Opcodes, Aliases and Generated Files

<intro>
Files: /home/laco/cvm/packages/types/src/lib/types.ts (OpCode enum), VM handlers stack.ts (DUP, DUP2, SWAP), strings.ts (CONCAT, STRING_LEN), arrays.ts (ARRAY_LEN, ARRAY_MAP_PROP, ARRAY_FILTER_PROP, `arraysHandlers` alias), unified.ts (GET, SET → file deleted), control.ts (JUMP_IF, CALL), advanced.ts (STRING_REPLACE), vm.ts (JUMP_IF in the jump-target check), the specs that exercise only these handlers, /home/laco/cvm/packages/parser/src/lib/compiler-state.ts (getCurrentContext, JumpContext.iterVariable and its writes in for-of/for-in), /home/laco/cvm/apps/cvm-server/src/config.ts (commented api port block), repository files static/, graph.html, counter.ts, benchmark/, test/programs/archive/. Depends on blocks 06 and 07 (ARRAY_SLICE / ARRAY_INDEX_OF stay: they are reused).

LSAI evidence (audit): the 13 opcodes DUP, DUP2, SWAP, CONCAT, ARRAY_LEN, ARRAY_MAP_PROP, ARRAY_FILTER_PROP, STRING_LEN, STRING_REPLACE, JUMP_IF, CALL, GET, SET are referenced only by types.ts, their VM handler and VM specs — never by packages/parser/src. `arraysHandlers` is used only by arrays-new-methods.spec.ts. Removing OpCode members renumbers the implicit enum, and stored programs (`.cvm/programs`) keep numeric opcodes. Decision: add `BYTECODE_VERSION` (number, exported from @cvm/types) and `Program.bytecodeVersion?`; `loadProgram` stores the current version; when VMManager reads a program whose bytecodeVersion differs (or is missing), it recompiles `program.source` (always stored) and saves it back before executing. Executions in progress stay valid: the removed opcodes were never emitted, so the recompiled instruction SEQUENCE is identical and stored `pc` values keep pointing to the same instructions.
</intro>

<red>
- test: the OpCode enum no longer contains the 13 removed members
- test: the VM handler map has a handler for every remaining OpCode and none for removed names
- test: a stored program without the current bytecodeVersion is recompiled from its source and saved back before execution
- test: the repository no longer contains static, graph.html, counter.ts, benchmark or test/programs/archive
- test: compiler-state exports no getCurrentContext and JumpContext has no iterVariable
</red>

### Implementation
Repository test lives in packages/integration/src/repo-hygiene.spec.ts (fs.existsSync on the paths). Enum test iterates `Object.keys(OpCode)`. Program-recompile test uses VMManager with in-memory storage holding a Program whose bytecode uses the OLD numbering and asserts execution runs from the source.

<success>
- [ ] 13 opcodes, their handlers and handler-only specs removed; alias and compiler-state members removed; generated/stray files removed
- [ ] Stored programs are safe across the renumbering (recompiled from source)
- [ ] All 5 RED tests pass: npx nx test types; npx nx test vm; npx nx test integration -- repo-hygiene.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="12-single-config">
## TDDAB-12: One Configuration Object Passed Down

<intro>
Files: /home/laco/cvm/apps/cvm-server/src/config.ts, /home/laco/cvm/apps/cvm-server/src/main.ts (~:59), /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (constructor ~:52, parsePlan dataDir ~:704), /home/laco/cvm/packages/vm/src/lib/file-system.ts (constructor ~:28), /home/laco/cvm/packages/storage/src/lib/storage-factory.ts. Independent of 05-11.

Runtime env vars are read in 5 places (config.ts, storage-factory.ts:17,20, mcp-server.ts:704, file-system.ts:31-32, logger.ts:13-14). Change: apps/cvm-server/src/config.ts is the ONLY runtime reader; Config gains `sandboxPaths: string[]` and `dataDir: string`; main.ts passes it to `new CVMMcpServer(version, { dataDir, sandboxPaths, maxInstructions })`; CVMMcpServer builds `new VMManager(new FileStorageAdapter(dataDir), new SandboxedFileSystem(sandboxPaths))` and uses `dataDir` for uplan.json. SandboxedFileSystem(paths?: string[]) and StorageFactory.create(config?) keep their env fallback ONLY when no explicit value is given (library/test compatibility); the logger keeps reading CVM_LOG_LEVEL/CVM_LOG_FILE (module-level singleton in @cvm/types — documented exception).
</intro>

<red>
- test: loadConfig reads CVM_DATA_DIR and CVM_SANDBOX_PATHS into dataDir and sandboxPaths with defaults .cvm and the working directory
- test: CVMMcpServer with explicit dataDir writes uplan.json there regardless of CVM_DATA_DIR
- test: SandboxedFileSystem with explicit paths ignores CVM_SANDBOX_PATHS
- test: main passes the loaded config to CVMMcpServer
</red>

### Implementation
```ts
export interface CVMServerOptions { dataDir?: string; sandboxPaths?: string[]; maxInstructions?: number }
constructor(version = '0.0.1', options: CVMServerOptions = {}) {
  this.dataDir = options.dataDir ?? process.env['CVM_DATA_DIR'] ?? '.cvm';
  this.vmManager = new VMManager(new FileStorageAdapter(this.dataDir), new SandboxedFileSystem(options.sandboxPaths), { maxInstructions: options.maxInstructions });
}
```

<success>
- [ ] Only config.ts (and the documented logger exception / explicit-value fallbacks) read runtime env vars
- [ ] All 4 RED tests pass: npx nx test cvm-server; npx nx test mcp-server -- mcp-server-options.spec.ts; npx nx test vm -- file-system.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="13-instruction-budget">
## TDDAB-13: Instruction Budget Between Two CC() Calls

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/vm.ts (constructor + execute loop ~:91), /home/laco/cvm/packages/vm/src/lib/vm-manager.ts (`new VM()` at ~:106, ~:130, ~:235 → pass options), /home/laco/cvm/apps/cvm-server/src/config.ts, /home/laco/cvm/apps/cvm-server/.env.example (the only file documenting CVM_MAX_*; no README mentions them), /home/laco/cvm/packages/vm/src/lib/audit-repro.spec.ts. Depends on block 12 (config passed down).

Bug (audit B9): CVM_MAX_EXECUTION_TIME / CVM_MAX_STACK_SIZE / CVM_MAX_OUTPUT_SIZE are computed and never used. Decision (user): protect ONLY against infinite loops without CC(). vm.execute() is synchronous inside the MCP server process, so a loop without CC() would block every MCP request. Since execute() runs from the current pc to the next CC (resume() calls execute()), counting instructions per execute() call is exactly "instructions between two CC()". New option maxInstructions (default 10 000 000; env CVM_MAX_INSTRUCTIONS; 0 = unlimited). Over budget → status 'error', message `Instruction budget exceeded: more than N instructions without reaching CC() (possible infinite loop)`. Remove maxExecutionTime / maxStackSize / maxOutputSize from Config and from apps/cvm-server/.env.example; document CVM_MAX_INSTRUCTIONS in apps/cvm-server/.env.example and in the environment section of apps/cvm-server/README.md (~:75-88). Audit repro B9 (stack limit) is replaced by the budget test (the stack limit no longer exists by decision).
</intro>

<red>
- test: a loop without CC that exceeds maxInstructions stops with status error and the budget message
- test: a loop with a CC inside each iteration runs past maxInstructions in total because the budget resets at every CC
- test: maxInstructions 0 disables the budget
- test: loadConfig reads CVM_MAX_INSTRUCTIONS with default 10000000 and Config has no maxStackSize maxOutputSize maxExecutionTime
- test: VMManager passes maxInstructions to every VM it creates
</red>

### Implementation
```ts
export interface VMOptions { maxInstructions?: number }
constructor(private readonly options: VMOptions = {}) {}
// execute():
const budget = this.options.maxInstructions ?? 10_000_000;
let executed = 0;
while (state.status === 'running' && state.pc < bytecode.length) {
  if (budget > 0 && ++executed > budget) {
    state.status = 'error';
    state.error = `Instruction budget exceeded: more than ${budget} instructions without reaching CC() (possible infinite loop)`;
    break;
  }
  // … existing loop body
}
```
The CC-reset test runs a program `let i = 0; while (i < 50) { CC("x"); i = i + 1; }` with maxInstructions 100 through VMManager getNext/reportCCResult until completed.

<success>
- [ ] Budget enforced per execute() call; CC resets it; 0 disables it; old CVM_MAX_* removed from code and docs
- [ ] All 5 RED tests pass: npx nx test vm -- vm-instruction-budget.spec.ts; npx nx test cvm-server
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>
