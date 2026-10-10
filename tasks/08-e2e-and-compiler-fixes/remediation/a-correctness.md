# A — Correctness

<block id="01-syntax-diagnostics">
## TDDAB-1: compile() Rejects Syntax Errors and Drops the Second AST Pass

<intro>
Files: /home/laco/cvm/packages/parser/src/lib/compiler.ts, delete /home/laco/cvm/packages/parser/src/lib/parser.ts and /home/laco/cvm/packages/parser/src/lib/parser.spec.ts, /home/laco/cvm/packages/parser/src/index.ts (remove `export * from './lib/parser.js'`), /home/laco/cvm/packages/parser/src/lib/audit-repro.spec.ts, new /home/laco/cvm/packages/parser/src/lib/compiler-program-checks.spec.ts. No dependencies.

Bug (audit B1, B2): compile() never reads TypeScript parse diagnostics, so `const x = ;` and `console.log("a"` compile with success true. parser.ts (parseProgram) is a second full AST walk whose only useful outputs are 3 checks (main exists, main has no parameters, forbidden globals setTimeout/fetch/require/import); its placeholder bytecode and hasMain are discarded. LSAI: parseProgram, ParseResult and CompileError have no consumers outside parser.ts/compiler.ts/parser.spec.ts.
Change: at the start of compile(), call ts.transpileModule(source, { reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022 } }) (public API, ~3 ms measured); every diagnostic becomes { message: flattenDiagnosticMessageText, line, character } (1-based) and compile returns success false with empty bytecode. Then perform the 3 checks inside compile() on the SourceFile it already creates (error line/character from the offending node; "Program must have a main() function" uses line 0). Note: `let = 5;` is valid sloppy JS (audit B3 retracted) and must keep compiling.
</intro>

<red>
- test: audit repro rejects a declaration with a missing initializer expression now passes as a normal it
- test: audit repro rejects an unclosed call expression now passes as a normal it
- test: a syntax error is reported with its 1-based line and the TypeScript message text
- test: a program without a main function fails with Program must have a main() function
- test: a main function with parameters fails with main() must not have parameters
- test: a call to setTimeout fails with Unsupported function: setTimeout and the line of the call
- test: let = 5 inside main still compiles because it is valid sloppy-mode JavaScript
</red>

### Implementation

compiler.ts (top of compile, replacing the parseProgram block):
```ts
const transpiled = ts.transpileModule(source, {
  reportDiagnostics: true,
  compilerOptions: { target: ts.ScriptTarget.ES2022 }
});
const syntaxErrors = (transpiled.diagnostics ?? []).map(d => {
  const pos = d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start) : { line: -1, character: -1 };
  return { message: ts.flattenDiagnosticMessageText(d.messageText, ' '), line: pos.line + 1, character: pos.character + 1 };
});
if (syntaxErrors.length > 0) {
  return { success: false, bytecode: [], errors: syntaxErrors };
}
```
Program checks on the existing `sourceFile` (before compiling statements):
```ts
const FORBIDDEN_CALLS = ['setTimeout', 'fetch', 'require', 'import'];
let mainFn: ts.FunctionDeclaration | undefined;
const visit = (node: ts.Node): void => {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'main') mainFn = node;
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && FORBIDDEN_CALLS.includes(node.expression.text)) {
    pushError(node, `Unsupported function: ${node.expression.text}`);
  }
  ts.forEachChild(node, visit);
};
visit(sourceFile);
if (!mainFn) errors.push({ message: 'Program must have a main() function', line: 0, character: 0 });
else if (mainFn.parameters.length > 0) pushError(mainFn, 'main() must not have parameters');
if (errors.length > 0) return { success: false, bytecode: [], errors };
```
(`pushError(node, msg)` = the position logic of reportError without the throw.)

compiler-program-checks.spec.ts:
```ts
it('syntax error has line and message', () => {
  const r = compile('function main() {\n  const x = ;\n}');
  expect(r.success).toBe(false);
  expect(r.errors[0]).toMatchObject({ line: 2, message: 'Expression expected.' });
});
it('no main', () => { expect(compile('const a = 1;').errors[0].message).toBe('Program must have a main() function'); });
it('main with params', () => { expect(compile('function main(x) { }').errors[0].message).toBe('main() must not have parameters'); });
it('setTimeout', () => {
  const r = compile('function main() {\n  setTimeout("x", 1);\n}');
  expect(r.errors[0]).toMatchObject({ message: 'Unsupported function: setTimeout', line: 2 });
});
it('let = 5 compiles', () => { expect(compile('function main() { let = 5; }').success).toBe(true); });
```

<success>
- [ ] parser.ts and parser.spec.ts deleted; index.ts no longer exports them; the parser.spec cases are covered by compiler-program-checks.spec.ts
- [ ] compile() returns TypeScript syntax diagnostics as errors with 1-based line/character
- [ ] The 2 parser audit repros are `it` and pass; all 7 RED tests pass: npx nx test parser -- compiler-program-checks.spec.ts audit-repro.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="02-undefined-strict-equality">
## TDDAB-2: Strict Equality Treats Two undefined Values as Equal

<intro>
Files: /home/laco/cvm/packages/vm/src/lib/handlers/comparison.ts ([OpCode.EQ_STRICT] ~:146, [OpCode.NEQ_STRICT] ~:163), /home/laco/cvm/packages/vm/src/lib/audit-repro.spec.ts, new /home/laco/cvm/packages/vm/src/lib/vm-undefined-equality.spec.ts. No dependencies.

Bug (audit B7, B8): `let u; u === undefined` and `o.missing === undefined` are false. Cause: undefined is represented by `createCVMUndefined()` (`cvm-value.ts:146`), which returns a NEW `{ type: 'undefined' }` object each time, and EQ_STRICT compares with `left === right` (`comparison.ts:158`). Loose EQ already treats two CVMUndefined as equal (`comparison.ts:29-33`). Decision: compare undefined STRUCTURALLY in EQ_STRICT / NEQ_STRICT with isCVMUndefined (a singleton would not survive state serialization/deserialization anyway). `undefined === null` must stay false.
</intro>

<red>
- test: audit repro an uninitialized let compares equal to undefined now passes as a normal it
- test: audit repro a missing property compares equal to undefined now passes as a normal it
- test: undefined !== undefined is false
- test: undefined === null is false and undefined !== null is true
- test: a value assigned from a missing property compares equal to another missing property
</red>

### Implementation

```ts
[OpCode.EQ_STRICT]: { stackIn: 2, stackOut: 1, execute: (state, instruction) =>
  executeBinaryComparison(state, instruction, (left, right) => {
    if (isCVMUndefined(left) || isCVMUndefined(right)) return isCVMUndefined(left) && isCVMUndefined(right);
    if (isCVMArrayRef(left) && isCVMArrayRef(right)) return left.id === right.id;
    if (isCVMObjectRef(left) && isCVMObjectRef(right)) return left.id === right.id;
    return left === right;
  }) },
// NEQ_STRICT: the exact negation of the EQ_STRICT predicate
```
Tests compile real source (`compile` from '@cvm/parser', `new VM().execute`) and assert `returnValue`; remove the control test only if one documents the wrong `===` result (the `typeof` control test stays: it still documents correct behaviour).

<success>
- [ ] EQ_STRICT and NEQ_STRICT treat two CVMUndefined as equal and undefined vs null as different
- [ ] The 2 undefined audit repros are `it` and pass; all 5 RED tests pass: npx nx test vm -- vm-undefined-equality.spec.ts audit-repro.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="03-step-plan-titles">
## TDDAB-3: Step-Plan Block Titles Are Parsed

<intro>
Files: /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.ts (~:138), /home/laco/cvm/packages/mcp-server/src/lib/audit-repro.spec.ts, /home/laco/cvm/packages/mcp-server/src/lib/tddab-parser.spec.ts. No dependencies.

Bug (audit B10): the title regex is `^##\s+TDDAB-\d+:\s+(.+)`, but step plans use `## Step N: Title` (prescribed by step-planner.md), so their title is '' and the planexecutor prompts read `step X: .` and propose the commit message `chore: .`. Change: accept both headings with `/^##\s+(?:TDDAB-|Step\s+)\d+:\s+(.+)/`.
</intro>

<red>
- test: audit repro a Step N heading becomes the block title now passes as a normal it and the empty-title control test is removed
- test: a TDDAB-N heading still becomes the block title
- test: a heading without a number keeps an empty title
</red>

### Implementation
```ts
const titleMatch = line.match(/^##\s+(?:TDDAB-|Step\s+)\d+:\s+(.+)/);
```

<success>
- [ ] Step and TDDAB headings both yield titles; the empty-title control test is gone
- [ ] All 3 RED tests pass: npx nx test mcp-server -- audit-repro.spec.ts tddab-parser.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>

<block id="04-delete-confirmation-nonce">
## TDDAB-4: Real Two-Step Confirmation for delete_execution and delete_program

<intro>
Files: /home/laco/cvm/packages/mcp-server/src/lib/mcp-server.ts (tools delete_execution ~:436, delete_program ~:515), new /home/laco/cvm/packages/mcp-server/src/lib/delete-confirmation.ts, new /home/laco/cvm/packages/mcp-server/src/lib/delete-confirmation.spec.ts, /home/laco/cvm/packages/mcp-server/src/lib/audit-repro.spec.ts. No dependencies.

Bug (audit B11): the first call returns `delete-<id>-<timestamp>` but the server never stores it; the second call accepts ANY token starting with `delete-<id>-`, so a forged token deletes. Decision (user): keep a REAL two-step confirmation. New class DeleteConfirmations (in-memory, per server instance): issue(kind, id) returns a random token (crypto.randomUUID) valid 5 minutes; consume(kind, id, token) returns true only if the token was issued for exactly that kind+id, is not expired, and was not used before (single use: it is deleted on success). Tool behaviour: no confirmToken → JSON { confirmationRequired: true, message, token, expiresInSeconds: 300 }; valid token → delete; anything else → isError 'Invalid or expired confirmation token'.
</intro>

<red>
- test: audit repros delete_execution and delete_program reject a token that was never issued now pass as normal it
- test: an issued token deletes the execution exactly once and a second use is rejected
- test: a token issued for one execution id is rejected for another id
- test: a token issued for delete_execution is rejected by delete_program for the same id
- test: a token older than 5 minutes is rejected
</red>

### Implementation

delete-confirmation.ts:
```ts
import { randomUUID } from 'node:crypto';
export type DeleteKind = 'execution' | 'program';
const TTL_MS = 5 * 60 * 1000;
export class DeleteConfirmations {
  private readonly pending = new Map<string, { kind: DeleteKind; id: string; expiresAt: number }>();
  constructor(private readonly now: () => number = Date.now) {}
  issue(kind: DeleteKind, id: string): string {
    const token = randomUUID();
    this.pending.set(token, { kind, id, expiresAt: this.now() + TTL_MS });
    return token;
  }
  consume(kind: DeleteKind, id: string, token: string): boolean {
    const entry = this.pending.get(token);
    if (!entry) return false;
    this.pending.delete(token);
    return entry.kind === kind && entry.id === id && entry.expiresAt > this.now();
  }
}
```
delete-confirmation.spec.ts tests the class directly (inject `now`); the mcp-server audit repros cover the tool path (forged token → deleteExecution / deleteProgram not called).

<success>
- [ ] Both delete tools use DeleteConfirmations; forged, reused, cross-id, cross-kind and expired tokens are rejected
- [ ] The 2 delete audit repros are `it` and pass; all 5 RED tests pass: npx nx test mcp-server -- delete-confirmation.spec.ts audit-repro.spec.ts
- [ ] Green-gate BTLT passes — build + tests + lint + typecheck (configured commands, skip n/a)
</success>
</block>
