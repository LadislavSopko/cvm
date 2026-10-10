§MBEL:5.0

[STATUS]
@state::TEST{plan.md 4/4+plan-steps.md 3/3;ready for j-close;open findings:undefined-compare bug,step title}
@feature::08-e2e-and-compiler-fixes
@branch::feature/08-e2e-and-compiler-fixes
@date::2026-10-09
@submodule::.ai-agent→branch feature/06-tddab-review{pushed;user keeps it;¬change}

[RECENT]
>closed::07-agent-loop-robustness✓{j-close 2026-10-09;merged→main 7d14e4c;pushed;cvm-server 2.1.0 built in apps/cvm-server/dist}
  ↳fixes::#11 CROSS-CHECK submit+validate/re-ask;submitTask per-state text;getTask reminder;reportCCResult returns state;return value kept;tiered test scope;redKey full length;planexecutor→apps/cvm-server/programs
  ↳rules::.ai-agent tddab-planner/j-review-plan/j-develop/j-close tiers{2.22.2→2.22.4}
  ↳history::memory-bank/history.md §2026-10-09

[E2E]
>ran::test/programs/run-all-tests.sh{after rebuild}→runner says 64/64 PASSED
!runnerFalsePass::mcp-test-client exits 0 on"Execution error"→8/64 programs actually end in error but count as PASSED
@errors{pre-existing,identical in all 6 previous runs→0 regressions}::
  03-control-flow/block-scoping{TryStatement unsupported→compile fail}
  03-control-flow/for-of-loops{ITER_END: No active iterator}
  05-strings/string-methods-extended+09/all-features+09/string-array-methods-all{STRING_SLICE requires a string}
  06-file-system/file-persistence{Invalid jump target: -1}
  10-regex/regex-literal-errors+regex-pattern-matching-errors{expected error tests}
@decided{2026-10-09}::fix in NEW feature 08{after j-close 07};rewrite file-persistence+block-scoping tests
[FEATURE-08-PLAN]
@plan::tasks/08-e2e-and-compiler-fixes/plan.md{tddab;4blocks;25redKeys;valid}+plan-steps.md{step;3}
@blocks::01compiler-reports-unsupported{7 throw→reportError+catch safety net+unpatched-jump error}→02break-in-foreach{no ITER_END in break}→03slice-string-and-array{handler pops 3;string|array}→04e2e-client-truthful-outcome{packages/integration/src/e2e-outcome.ts+--expect-error}
@steps::01rewrite block-scoping+file-persistence→02hygiene{git rm main.cjs+tsbuildinfo;bin w/o ./}→03full e2e run+2.1.1
@extraFindings::7 swallow sites(not 1);break also broken in for-in;arr.slice never worked;stale apps/cvm-server/main.cjs tracked
@review::j-review-plan(LSAI outline)→3 fixes{04 no-output=pass(return-types.ts prints nothing);step01 file-persistence 4 CC responses+'{}' state=fresh;step02 git rm all tracked tsbuildinfo(4)}
@experiment::catch safety net→parser241+vm706+mcp136+integration37 green
?next::user approves→j-cvm-exec-plan plan.md then plan-steps.md

[EXEC-08]
@run::run-08-20261009{cvm-server 2.1.0 live: full redKeys,submit reminder,TEST SCOPE in prompts}
>block01✓{RED5fail+1guard→GREEN;VERIFY4/4;CROSSCHECK6/6}
  ↳7 visitor throws→return reportError{same msgs};compiler.ts:119 catch records unreported at stmt pos;:146 unpatched -1 jump→error if none else
  ↳note::'return reportError' needed for TS narrowing(destructured never fn);5 pre-existing reportError calls also got return{equivalent}
  ↳new parser/src/lib/compiler-error-reporting.spec.ts{6}
  ↳gate::build6+typecheck7+test parser247/vm706/mcp136✓
  ↳commit::debc0e4
>block02✓{RED5fail+1guard;GREEN=remove ITER_END emit in break-statement.ts;VERIFY4/4;CROSSCHECK6/6}
  ↳RED showed nested case even popped OUTER iterator(ITER_NEXT: No active iterator)
  ↳new vm/src/lib/vm-break-foreach.spec.ts{6};gate::build6+typecheck7+parser247+vm712✓
  ↳commit::c145b10
>block03✓{RED;GREEN;VERIFY4/4;CROSSCHECK6/6}
  ↳advanced.ts:355 STRING_SLICE stackIn3:pop end,start,target;undefined end=absent;string→slice;arrayRef→new heap array;else 'slice requires a string or an array';non-number start→'slice requires a numeric start index'
  ↳vm-string-slice.spec rewritten to 3-value compiler contract{PUSH_UNDEFINED};new vm-slice-compiled.spec.ts{6}
  ↳gate::build6+typecheck7+vm718✓
  ↳commit::204d9dc
>block04✓{RED;GREEN;VERIFY failed(typecheck)→FIX→RE-VERIFY4/4;CROSSCHECK7/7}
  ↳new packages/integration/src/e2e-outcome.ts{parseClientArgs,decideOutcome}+spec{7};client exits with outcome code,load/start errors detected,no output=ok;run-all-tests regex demos --expect-error
  ↳live::block-scoping exit1(load failed),regex-literal-errors exit0(expected error),return-types exit0(completed no output)
  !finding::integration typecheck was FAILING pre-existing{TS4111 types/logger.ts:13-14,vm/handlers/regex.ts:145-146,235-236,360-361} hidden by nx cache→fixed w/ bracket access;+TS6307 tsconfig.spec include src/**/*.ts
  §lesson::verify typecheck with --skip-nx-cache;cached 'Successfully' can hide real failures
  ↳commit::fc95990
>FINAL REVIEW plan.md✓::nx no-cache build6+typecheck7+tests 1237✓;e2e truthful 62/64{fails only block-scoping+file-persistence→step plan}
@run::run-08-steps-20261009{plan-steps.md}
>step01-rewrite-invalid-e2e-programs✓{EXECUTE+VERIFY3/3}
  ↳block-scoping.ts::no try/catch;documents function-level scope;client exit0
  ↳file-persistence.ts::if/else instead of Math.min;step instead of Date.now;state w/o numeric filesProcessed→fresh{typeof};run_test 4 CC responses;2 consecutive runs exit0
  ↳commit::30c116c{msg fixed by hand:title empty}
>step02-release-hygiene✓{EXECUTE+VERIFY4/4}
  ↳git rm --cached apps/cvm-server/main.cjs+4 tsbuildinfo;.gitignore 'apps/cvm-server/main.cjs','**/tsconfig.tsbuildinfo';bin→'bin/cvm-server.cjs';npm pack dry-run clean{no bin warning}
  ↳note::e2e runs leave untracked test/integration/{final-results.json,test-data.json,test-output.txt}→not committed
  ↳commit::03f59c2
>step03-truthful-e2e-run-and-release✓{EXECUTE+VERIFY4/4}
  ↳cvm-server 2.1.1+CHANGELOG{Fixed:compiler errors,break foreach,slice,e2e client,packaging}
  ↳FULL::nx no-cache build6+typecheck7+tests1237✓;e2e run-all-tests 64/64 TRULY passed{regex demos via --expect-error};npm latest still 2.1.0
[REMEDIATION-PLAN-2026-10-10]
@study::tasks/08-e2e-and-compiler-fixes/study-remediation.md
@plan::tasks/08-e2e-and-compiler-fixes/remediation/index.md{multi-file A/B/C;17 blocks;73 redKeys;parsePlan valid}
@decisions::limits=instruction budget between CC only;delete=real 2-step nonce;eslint;Node22;toolchain+SDK v2→separate feature;undefined=structural strict eq(no singleton)
@retracted::audit B3(let = 5 valid JS)→11 bugs proven
!lsai::warm defining file before name lookups;.lsai/mjsf.json mongodb project removed(0c588de)
@exec::run-08-remediation{planexecutor 2.1.0}
>R01-syntax-diagnostics✓{RED5fail+2guard;GREEN;VERIFY failed→FIX→RE-VERIFY4/4;CROSSCHECK7/7}
  ↳compiler.ts:syntaxErrors(ts.transpileModule)+programErrors(main,params,forbidden calls);parser.ts+spec deleted;index no export
  ↳FIX::TS now rejects /[unclosed/ at compile→regex-integration.spec single-invalid test expects compile error;multi test+e2e regex-literal-errors.ts use /(unclosed/(runtime error kept)
  ↳gate::build6+typecheck7(no cache)+parser248/vm725/mcp140/integration44✓
  ↳commit::5ecbf01
>R02-undefined-strict-equality✓{RED4fail+1guard;GREEN;VERIFY3/3;CROSSCHECK5/5}
  ↳comparison.ts:10 export strictEquals{undefined structural,refs by id};EQ_STRICT/NEQ_STRICT use it;no singleton(YAGNI)
  ↳gate::build6+typecheck7+vm728✓
  ↳commit::1e41828
>R03-step-plan-titles✓{RED;GREEN;VERIFY;CROSSCHECK3/3}
  ↳tddab-parser.ts:138 title regex accepts '## TDDAB-N:' and '## Step N:';audit-repro step-title it.fails→it,control test removed;spec describe('block titles')+2
  ↳gate::build6+typecheck7+mcp141✓
  ↳commit::da0d9d9
>R04-delete-confirmation-nonce✓{RED;GREEN;VERIFY failed→FIX→RE-VERIFY3/3;CROSSCHECK5/5}
  ↳delete-confirmation.ts DeleteConfirmations{issue→randomUUID,TTL 300s;consume single-use kind+id+expiry;now injectable};delete_execution/delete_program use it;error 'Invalid or expired confirmation token';response adds expiresInSeconds
  ↳FIX::import from 'crypto' not 'node:crypto'(vite externals list only has bare names)
  ↳specs updated::execution/program-management error text;old 'delete-prog1-' format assertion→expiresInSeconds 300
  ↳gate::build6+typecheck7+mcp145✓
  ↳commit::6de9351
>R05-method-dispatch-table✓{RED;GREEN;VERIFY4/4;CROSSCHECK6/6}
  ↳method-table.ts METHODS(24 receiver methods:op+args defaults+required);call-expression.ts generic emitter(Object.hasOwn lookup);every optional arg always pushes→fixed stack contract
  ↳advanced.ts STRING_SUBSTRING stackIn3,undefined end=to end(no arity guessing);vm-string-methods hand-built bytecode adds PUSH_UNDEFINED
  ↳removed unreachable return; after reportError(match,fs.writeFile,Object.keys)
  ↳gate::build6+typecheck7+parser253+vm730✓
  ↳commit::7941b1b
>R06-array-aware-methods✓{RED;GREEN;VERIFY3/3;CROSSCHECK6/6}
  ↳arrays.ts:24 arrayElements(state,ref)+:29 arrayIndexOf(elements,value,fromEnd) via strictEquals;ARRAY_INDEX_OF reuses them
  ↳advanced.ts STRING_INDEXOF/STRING_INCLUDES/STRING_LAST_INDEX_OF/TO_STRING dispatch on runtime array receiver;strings unchanged
  ↳gate::build6+typecheck7+vm733✓
  ↳commit::85b0dd9
>R07-single-slice-implementation✓{RED;GREEN;VERIFY3/3;CROSSCHECK3/3}
  ↳arrays.ts:29 sliceArray(state,ref,start,end?) only array-slice logic;ARRAY_SLICE(:448) and STRING_SLICE(advanced.ts:364) call it;advanced.ts unused CVMArray import removed
  ↳gate::build6+typecheck7+vm736✓
  ↳commit::345df80
>R08-runtime-error-helper✓{RED;GREEN;VERIFY3/3;CROSSCHECK2/2}
  ↳handlers/errors.ts runtimeError(state,instruction,message);91 literals replaced in 9 handler files(-550 lines);messages byte-identical(diff-checked);CALL handler now takes instruction
  ↳errors.spec.ts guards against new RuntimeError literals
  ↳gate::build6+typecheck7+vm738✓
  ↳commit::0d36344
>R09-single-stack-check-and-trace✓{RED;GREEN;VERIFY failed→FIX→RE-VERIFY4/4;CROSSCHECK4/4}
  ↳stack-utils.ts+spec deleted;40 safePop→state.stack.pop()! in 7 handler files;stackIn==pops checked per handler
  ↳vm.ts:91 traceEnabled=isLevelEnabled('trace') once per execute;one guarded vmLogger.trace per instruction(root logger.trace removed)
  ↳FIX::5 *-stack-safety.spec.ts(31 direct-call underflow tests of removed code) deleted→vm-hot-loop it.each 31 opcodes underflow via VM path
  ↳test note::@cvm/types logger is a Proxy(not spyable);vm-hot-loop uses vi.mock('@cvm/types') fake logger
  ↳gate::build6+typecheck7+vm739✓
  ↳commit::bb3acd2
>R10-vm-state-transition✓{RED;GREEN;VERIFY3/3;CROSSCHECK3/3}
  ↳vm-manager.ts:206 private applyVMState(id,execution,state){output append,serialize,map complete/error/waiting_cc/else RUNNING,save};getNext(:143)+reportCCResult(:203) delegate;READ-ONLY comment fixed
  ↳gate::build6+typecheck7+vm742✓
  ↳commit::8df9c40
>R11-dead-code-removal✓{RED;GREEN;VERIFY4/4;CROSSCHECK4/5→FIX(none:user decision)→RE-VERIFY4/4}
  ↳removed 13 opcodes(DUP,DUP2,SWAP,CONCAT,ARRAY_LEN,ARRAY_MAP_PROP,ARRAY_FILTER_PROP,STRING_LEN,STRING_REPLACE,JUMP_IF,CALL,GET,SET)+handlers+unified.ts+handler-only specs;arraysHandlers alias;compiler-state getCurrentContext+iterVariable;config.ts commented api block;static/ graph.html counter.ts benchmark/ test/programs/archive/
  ↳mixed specs adapted:ARRAY_LEN→LENGTH,CONCAT→ADD,JUMP_IF/CALL tests dropped
  ↳§planDeviation::BYTECODE_VERSION/recompile NOT done — OpCode is string enum,stored programs keep op names;user decision 2026-10-10 "nessuna recompile, vecchi programmi e tutto vecchio va deletato"→.cvm cleaned(kept planexecutor program+run-08-remediation+uplan files);test 'stored bytecode runs by opcode name' instead
  ↳gate::build6+typecheck7+types61+vm675+parser253+integration46+cvm-server4✓
  ↳commit::f08a1a0
>R12-single-config✓{RED;GREEN;VERIFY failed(spec type narrowing)→FIX→RE-VERIFY3/3;CROSSCHECK4/4}
  ↳config.ts Config.dataDir(default .cvm)+sandboxPaths(CVM_SANDBOX_PATHS|CVM_SANDBOX_ROOT|cwd);storage.dataDir removed
  ↳main.ts→new CVMMcpServer(version,{dataDir,sandboxPaths});CVMServerOptions;server builds VMManager(FileStorageAdapter(dataDir),SandboxedFileSystem(sandboxPaths));parsePlan uses this.dataDir
  ↳SandboxedFileSystem(explicitPaths?) env fallback only without paths;mcp-server package.json+lock add @cvm/storage;6 spec mocks of @cvm/vm add SandboxedFileSystem
  ↳!behaviour::server default sandbox=cwd(before:deny-all when env unset)
  ↳gate::build6+typecheck7+cvm-server6+mcp146+vm676+storage28✓
  ↳commit::e8b5d3f
>R13-instruction-budget✓{RED;GREEN;VERIFY3/3;CROSSCHECK5/5}
  ↳vm.ts VMOptions{maxInstructions},DEFAULT_MAX_INSTRUCTIONS 10M;budget per execute()(=between two CC);0=unlimited;error 'Instruction budget exceeded: more than N instructions without reaching CC() (possible infinite loop)'
  ↳VMManager(storage,fs,vmOptions)→all new VM(this.vmOptions);CVMServerOptions.maxInstructions;main passes config.maxInstructions;Config.execution(maxStack/Output/Time) removed
  ↳.env.example+apps/cvm-server/README document CVM_MAX_INSTRUCTIONS;audit repro B9(stack limit) removed by decision
  ↳gate::build6+typecheck7+vm679+mcp146+cvm-server7✓
  ↳commit::abeb8fd
>R14-register-tools✓{RED;GREEN;VERIFY4/4;CROSSCHECK5/5}
  ↳mcp-server.ts 15 tools via registerTool{description,inputSchema};withErrors(:86) single catch;resolveExecutionId(:99,missing=NO_CURRENT_ERROR|NO_CURRENT_HINT for getTask);loadFile catch only maps ENOENT/EACCES then rethrows
  ↳test-transport listTools();mcp-server-tools.spec 5 tests;names/schemas/texts unchanged(existing specs untouched)
  ↳gate::build6+typecheck7+mcp151✓
  ↳commit::8147df7
>R15-eslint✓{RED;GREEN;VERIFY3/3;CROSSCHECK3/3}
  ↳eslint.config.mjs(js+tseslint recommended;no-unused-vars ^_;no-explicit-any warn(158);no-unreachable;ignores dist,node_modules,.nx,html,coverage,tasks,test/programs,apps/cvm-server/programs;*.cjs commonjs override);nx.json @nx/eslint/plugin targetName lint;devDeps eslint,typescript-eslint,@nx/eslint 21.3.11,@eslint/js
  ↳fixed errors:unused params dropped/_prefixed,unused catch→catch{},prefer-const,empty catch→.catch(()=>undefined)
  ↳!logger.ts require→ESM `import { pino }`+fs/path;needed types vite external ['pino','fs','path'] and app vite external 'pino' (else pino browser build logs to STDOUT = breaks MCP stdio);smoke:stdout 0 bytes
  ↳!incident::my `pkill -f dist/main.cjs` killed the cvm-dbg MCP server → user must restart it
  ↳gate::build6+typecheck7+lint7+tests all 7 projects✓
  ↳commit::b9204da
>R16-node-22✓{RED;GREEN;VERIFY4/4;CROSSCHECK3/3}
  ↳.nvmrc=22;engines node >=22 root+apps/cvm-server(lock synced);README+apps/cvm-server/README state Node 22
  ↳gate under Node 22.14.0(source ~/.nvm/nvm.sh && nvm use 22 per shell)::build6+typecheck7+lint7+all tests✓
  ↳user nvm default alias NOT changed→user may run `nvm alias default 22`
  ↳commit::4f62bbc
>R17-ci-workflow✓{RED;GREEN;VERIFY4/4;CROSSCHECK4/4}
  ↳.github/workflows/ci.yml(push+PR;checkout submodules:false;setup-node .nvmrc cache npm;sed Nexus→registry.npmjs.org before npm ci;build;typecheck --skip-nx-cache;lint;test --skip-nx-cache;run-all-tests.sh)
  ↳e2e-outcome.ts defaultSandboxPath(cwd);mcp-test-client uses it(no /home/laco)
  ↳!fix::apps/cvm-server build target lacked dependsOn ^build→clean checkout build failed(@cvm/mcp-server dist missing);added
  ↳local CI proof(clean copy,Node22.14,rewritten lock)::npm ci+build6+typecheck7+lint7+test7+e2e64/64✓
>CICD-prepared(user request 2026-10-10;user configures tonight)
  ↳user flow::CI ONLY on PR main→production(ci.yml if head is main of this repo);user merges by hand;push production→CD release.yml(build+publish only,no gate rerun)
  ↳release.yml:env production+id-token write;npm i -g npm@^11.5.1;npm publish --provenance(no token/OTP;skip existing;'-'→next);actions pinned by SHA
  ↳only-me locks::no write collaborators;ruleset production(PR+verify,no push/force/delete);fork PR never gets verify;env production branch-only(+optional reviewer);npm trusted publisher(repo+release.yml+env);disallow tokens
  ↳checklist::tasks/08-e2e-and-compiler-fixes/cicd-setup.md;!creating production publishes 2.1.1

[AUDIT-2026-10-09]
@file::tasks/audit-cvm-2026-10-09.md{KISS/DRY/YAGNI/modernity;overall 2.7/5}
@proven::12 it.fails repros{parser:syntax errors accepted x3;vm:arr.includes/indexOf/toString,===undefined x2,CVM_MAX_* ignored;mcp:step title empty,forged delete token x2}
@topFixes::syntax diagnostics+drop parser.ts pass;table-driven method dispatch(+runtime receiver type);runtimeError helper;delete 15 dead opcodes/handlers;CI+lint;single config
§selfCorrection::feature08 block03 duplicated existing ARRAY_SLICE(arrays.ts:409) inside STRING_SLICE
✓sdk::@modelcontextprotocol/sdk 1.17.2→1.32.1{commit 02a7a0e;all server.tool() deprecated→registerTool;test-transport TextToolResult;tests1251+e2e64✓}
?sdk-v2::split pkgs+spec 2026-07-28,needs Node>=20(local 18.20.8)→user decision
!newBug::CVM `x === undefined` ALWAYS false{even let u;};typeof x works→'undefined'{probe 2026-10-09}→?ask user:fix in 08|issue
✓minor::step plan title empty→fixed R03

[FEATURE-08-ANALYSIS]{verified in code;ready for j-new-feature 08}
A!runnerFalsePass::test/integration/mcp-test-client.ts:79-84 Error:→done=true exit0;"✓ Program loaded" even on load error;no expected-error marker
  ?fix::exit1 on load/start/exec error;--expect-error "<substr>";run-all-tests.sh passes it for 10-regex/regex-literal-errors+regex-pattern-matching-errors
B!!compilerSwallow::compiler.ts:111-120 catch assumes reportError done;call-expression.ts:366 throw'Unsupported call expression' w/o reportError→stmt dropped|loop half-emitted(JUMP_IF_FALSE -1);success:true;unpatched jumps only debug-logged(:133-142)
  ?fix::catch→push CompilationError{line/col} if not reported;unpatched -1 jump→compile error
  @impact::scan 64 e2e programs→only 2 swallowed errors,both file-persistence(Math.min,Date.now)
C!breakInForeach::break-statement.ts:17-18 emits ITER_END then BREAK→target is loop-end ITER_END{for-of-statement.ts:82-86,for-in-statement.ts:69-76}→double ITER_END→"No active iterator";specs only check compile
  ?fix::break emits no ITER_END;tests EXECUTE break/continue in for-of,for-in,nested
D!sliceOneArg::compiler always pushes 3{PUSH_UNDEFINED end,call-expression.ts:160-170};handler advanced.ts:355-390 guesses arity by types→slice(n) fails;vm-string-slice.spec uses 2-push form only
  ?fix::handler always pops 3,undefined end=absent;update VM specs to compiler contract;e2e slice(n)
E·tests::block-scoping{try/catch unsupported}→rewrite to CVM function-scope semantics;file-persistence{Math.min,Date.now}→rewrite without them
@method::TDDAB block per bug with RED reproducing real error

[NEXT]
✓publish::cvm-server@2.1.0 on npmjs{dist-tags latest=2.1.0,next=2.1.0;user published by hand}
✓mcpLive::cvm MCP = 2.1.0{after nexus npm-proxy+npm-group Invalidate cache + npx cache cleared;2026-10-09}
  ↳probe::getTask→CC text+"--- When done, call submitTask…"✓;submitTask→"OK. Call getTask for the next task."✓;last submit→'OK. Execution completed with result: "end"'✓;getTask after→'Execution completed with result: "end"'✓{return value kept}
  §lesson::~/.npmrc registry=nexus.0ics.ai npm-group→after publish invalidate nexus npm-proxy cache{or lower Maximum metadata age}
✓issue#11::closed 2026-10-09 with summary comment
?j-new-feature::08 e2e-and-compiler-fixes{analysis in FEATURE-08-ANALYSIS}
?audit-followups::CI+lint+config-zod+execLimitsEnforce+realpathSandbox
