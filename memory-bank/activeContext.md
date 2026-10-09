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
  ↳note::.cvm/uplan-progress.json of 06 moved to .cvm/uplan-progress.06-drop-mongodb.bak

[PENDING-USER]
?approve plan→j-develop|j-cvm-exec-plan
?uncommitted user changes{.ai-agent pointer+.claude/.gitignore+.claude/settings.json hooks removed}→separate commit?{userDecision}

[NEXT]
?publish::cvm-server@2.0.0→npm{userDecision;may fold into 2.1.0}
?audit-followups::CI+lint+config-zod+execLimitsEnforce+realpathSandbox
