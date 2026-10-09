§MBEL:5.0

[STATUS]
@state::DEVELOP{j-cvm-exec-plan plan.md}
@feature::07-agent-loop-robustness
@branch::feature/07-agent-loop-robustness{pushed;lastCommit 4a55e77}
@date::2026-10-09
@submodule::.ai-agent→branch feature/06-tddab-review{createdByUser;rules edits go there;¬push}

[FOCUS]
@goal::agentLoopNeverStalls+testsNotSlow{issue#11+more}
@requirements::
  1.#11 CROSS-CHECK must say Submit{¬Respond}+robust JSON
  2.submitTask must tell caller what next{¬bare"Execution resumed"}
  3.testTiers::focused{RED/GREEN/FIX}→block{VERIFY/RE-VERIFY=BTLT tests}→full{planEnd+j-close}
@extras::move planexecutor→apps/cvm-server/programs+release2.1.0+close#11{atJ-close}

[FINDINGS]
!crossCheckSilentPass::JSON.parse invalid→null{strings.ts JSON_PARSE}+for-in null→0iter{object-iterators.ts}→crossCheckPassed=true{fence/prose/missingKey/null all pass}
!reportCCResult RESUMES VM{vm-manager.ts:215-282}→persists next state{AWAITING+ccPrompt|COMPLETED|ERROR};getNext AWAITING only rereads ccPrompt
✗bug::completionInsideSubmit→getNext COMPLETED branch drops returnValue{live probe:main returned"end";getTask said"Execution completed"}
@probe{cvm-dbg v2.0.0}::submitTask→always"Execution resumed"{evenAfterLastCC};getTask→bare CC text
§correction::I first claimed"submitTask does not execute"→WRONG{caught by j-review-plan cross-check};userReDecided

[DECISIONS]
@testTiers::textual rule only{¬new j-settings keys};single source tddab-planner BTLT section
@crossCheck::slice first"{"→last"}"+JSON.parse+every redKey true|false;invalid→CROSS-CHECK RETRY loop unbounded{¬cap};then false→existing FIX path
@submitTask::perState{waiting→"OK. Call getTask for the next task."|completed→"OK. Execution completed."/"…with result: X"|error→isError"Error: …"}
@getTask::waiting→CC text+"\n\n--- When done, call submitTask with your result as requested."
@returnValueBug::included{block04}
@publish::npm only if perfectly tested+explicit user OK
@dogfood::development runs on TDDAB being fixed;published cvm-server still has silent-pass→do CROSS-CHECK honestly+submit via tool

[PLAN]
@file::tasks/07-agent-loop-robustness/plan.md{tddab;5blocks;parsePlanValid;redKeys34/34}
  01-crosscheck-submit-and-extract{+git mv planexecutor;5tests}
  02-crosscheck-validate-reask{8tests;+fix tddab-e2e hang:answer from prompt template}
  03-prompt-test-scope{scopeFocused/scopeBlock;5tests}
  04-vm-submit-returns-next-state{packages/vm;6tests}
  05-tool-response-guidance{packages/mcp-server;10tests;dep04}
@file::tasks/07-agent-loop-robustness/plan-rules.md{step;4steps}
  01-planner-test-tiers→02-review-plan-flags-full-suite→03-develop-close-align-tiers{+submodule pointer commit}→04-release-2-1-0
>j-review-plan#1::fixes applied{block04 split into vm04+mcp05;typecheck guards;deterministic error program}
>j-review-plan#2::fixes applied{tddab-e2e would HANG after02→answer from template;200-prompt runaway guard all drivers;mission: submitTask resumes VM+BUILTIN path+nx test vm}
§lesson::LSAI auto-opened only JS workspace→symbol queries hit main.cjs/.nx cache;open TS workspace{lsai_workspace_open language=TypeScript}→cvm-typescript-2

[EXEC]
@run::run-07-20261009{mcp__cvm published v1.2.0;planexecutor builtin OLD→#11 bug seen live at CROSS-CHECK:"Respond ONLY…"→submitted JSON via tool}
>block01✓{RED+GREEN+VERIFY7/7+CROSSCHECK5/5}
  ↳git mv planexecutor→apps/cvm-server/programs/;vite copy src updated;EXECUTOR_PATH updated{planexecutor.spec+tddab-e2e.spec}
  ↳submitJson const+CROSS-CHECK ends toolsReminder+submitJson;JSON extracted indexOf{/lastIndexOf}/substring
  ↳planexecutor.spec::runBlock driver{200-prompt guard}+5 tests
  ↳gate::build6✓+typecheck7✓+test mcp-server113✓+cvm-server4✓{block-scoped}
  ↳commit::495c37f
>block02✓{RED+GREEN+VERIFY7/7+CROSSCHECK8/8}
  ↳planexecutor:191-235::while(!crossCheckValid){extract→JSON.parse→each redKey true|false else ccProblem→CC"CROSS-CHECK RETRY"+jsonTemplate+submitJson};crossCheckPassed iterates redKeys{extra keys ignored}
  ↳planexecutor.spec::7 tests{non-JSON/missing/null/unbounded/template/false-on-retry/extra keys}
  ↳tddab-e2e.spec::answer built from prompt template{": null"→": true"}+runaway guard+assert 0 RETRY{was passing only via silent-pass bug}
  ↳gate::build6✓+typecheck7✓+test mcp-server120✓+cvm-server4✓
  ↳commit::dc79bf3
>block03✓{RED+GREEN+VERIFY5/5+CROSSCHECK5/5}
  ↳planexecutor:20-21::scopeFocused+scopeBlock consts;13 prompts wired{dev→focused:EXECUTE/RED/GREEN/all FIX;verify→block:VERIFY/all RE-VERIFY};MB/COMMIT/CROSS-CHECK untouched;FINAL REVIEW only"full test suite"
  ↳planexecutor.spec::5 tests{tddabPrompts via runVerdict+stepPrompts driver};runaway guard added to runVerdict too
  ↳gate::build6✓+typecheck7✓+test mcp-server125✓+cvm-server4✓
  ↳commit::d066e49
>block04✓{RED+GREEN+VERIFY5/5+CROSSCHECK6/6}
  ↳vm-manager.ts:216::reportCCResult→Promise<ExecutionResult>{completed+result|error|waiting+ccPrompt|RUNNING→waiting};getNext COMPLETED:196 adds result:execution.returnValue{return-value bug fixed}
  ↳new vm-manager-submit-result.spec.ts{6 tests;in-memory storage mock}
  ↳gate::build6✓+typecheck7✓+test vm706✓+mcp-server125✓+cvm-server4✓
  ✗newFinding::redKey collision{parsePlan truncates test text to 40 chars→two RED lines"reportCCResult returns type completed wi…"→SAME key→JSON template has duplicate key;cross-check cannot distinguish them}→?issue/fix{toRedKey in tddab-parser+planexecutor.spec}
  ↳commit::550f81a
>block05✓{RED+GREEN+VERIFY5/5+CROSSCHECK10/10}
  ↳mcp-server.ts:29-30::SUBMIT_ACK+SUBMIT_REMINDER;getTask waiting:212 appends reminder;submitTask:255-273 per state{completed→"OK. Execution completed."/"…with result: X";error→isError"Error: …";waiting|undefined→SUBMIT_ACK}
  ↳mcp-server.spec::getTask 4 tests+submitTask 7 tests{old'resumed'/bare-text tests rewritten}
  ↳gate::build6✓+typecheck7✓+test mcp-server131✓+cvm-server4✓
  ↳redKey collision seen again{block05:2 pairs collide}→confirmed systematic
  ↳commit::bd709ad
>FINAL REVIEW plan.md{01-05}✓::build6+typecheck7+FULL suite 7 projects 1207 tests✓
>block06✓{added during exec;user decision:no truncation;RED+GREEN+VERIFY5/5+CROSSCHECK5/5}
  ↳mcp-server.ts:21::toRedKey full length;findDuplicateRedKey+validation error'Block "X" has duplicate red tests: key'{single:606,multi:675;actions skipped}
  ↳test helpers toRedKey aligned{planexecutor.spec+tddab-e2e x2};PLAN_FORMAT.md §6 updated
  ↳mcp-server-parseplan.spec::redKeys describe 5 tests
  ↳gate::build6✓+typecheck7✓+test mcp-server136✓+cvm-server4✓
  ↳commit::c89c6e5
>FINAL REVIEW plan.md{01-06}✓::build6+typecheck7+FULL suite 7 projects 1212 tests✓
@run::run-07-rules-20261009{plan-rules.md step;progress of plan.md moved to .cvm/uplan-progress.07-plan.bak}
>step01-planner-test-tiers✓{EXECUTE+VERIFY4/4}
  ↳.ai-agent tddab-planner.md:34 "#### Test scope tiers (speed rule)"{FOCUSED/BLOCK/FULL+ban full-suite in success w/ examples};checklist item:318;canonical BTLT line untouched
  ↳.ai-agent commit fccfec6{VERSION 2.22.1→2.22.2 via bash scripts/bump-version.sh(not executable→use bash);test/run-test.sh PASSED}
  §rule::.ai-agent CLAUDE.md→bump-version before each commit+run test/run-test.sh after
  ↳parent commit::ec36fdc{MB only}
>step02-review-plan-flags-full-suite✓{EXECUTE+VERIFY3/3}
  ↳.ai-agent j-review-plan.md §D::check block success uses BLOCK-scoped test cmds;full-suite in block=issue+fix;refs tddab-planner tiers
  ↳.ai-agent commit 4c4d642{VERSION 2.22.3;run-test PASSED}
  ↳parent commit::43b64b6{MB only}
>step03-develop-close-align-tiers✓{EXECUTE+VERIFY4/4}
  ↳.ai-agent j-develop.md::run tests FOCUSED while developing{:101,:105};per-step gate BLOCK{:121};completion FULL{:133};internal check per-step→block-scoped
  ↳.ai-agent j-close.md:82::FULL suite all projects as pre-merge barrier
  ↳.ai-agent commit 2386017{VERSION 2.22.4;run-test PASSED};parent b8fca02 records .ai-agent pointer{includes user's branch switch}
  ↳note::.cvm/uplan-progress.json of 06 moved to .cvm/uplan-progress.06-drop-mongodb.bak

[PENDING-USER]
?approve plan→j-develop|j-cvm-exec-plan
?uncommitted user changes{.ai-agent pointer+.claude/.gitignore+.claude/settings.json hooks removed}→separate commit?{userDecision}

[NEXT]
?publish::cvm-server@2.0.0→npm{userDecision;may fold into 2.1.0}
?audit-followups::CI+lint+config-zod+execLimitsEnforce+realpathSandbox
