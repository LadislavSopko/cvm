§MBEL:5.0

[STATUS]
@state::PLAN{awaitingUserApproval}
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
@file::tasks/07-agent-loop-robustness/plan.md{tddab;5blocks;parsePlanValid;redKeys33/33}
  01-crosscheck-submit-and-extract{+git mv planexecutor;5tests}
  02-crosscheck-validate-reask{7tests}
  03-prompt-test-scope{scopeFocused/scopeBlock;5tests}
  04-vm-submit-returns-next-state{packages/vm;6tests}
  05-tool-response-guidance{packages/mcp-server;10tests;dep04}
@file::tasks/07-agent-loop-robustness/plan-rules.md{step;4steps}
  01-planner-test-tiers→02-review-plan-flags-full-suite→03-develop-close-align-tiers{+submodule pointer commit}→04-release-2-1-0
>j-review-plan::fixes applied{block04 split into vm04+mcp05;typecheck guards;deterministic error program}

[PENDING-USER]
?approve plan→j-develop|j-cvm-exec-plan
?uncommitted user changes{.ai-agent pointer+.claude/.gitignore+.claude/settings.json hooks removed}→separate commit?{userDecision}

[NEXT]
?publish::cvm-server@2.0.0→npm{userDecision;may fold into 2.1.0}
?audit-followups::CI+lint+config-zod+execLimitsEnforce+realpathSandbox
