§MBEL:5.0

[STATUS]
@state::PLAN
@feature::07-agent-loop-robustness
@branch::feature/07-agent-loop-robustness
@date::2026-10-09

[RECENT]
>closed::06-drop-mongodb✓{j-close;merged→main;cvm-server@2.0.0BREAKING;fileStorageOnly;¬published-npm-yet}
  ↳verified::build--all✓{6projects}+test--all✓{7projects/1178tests}
>done::x-audit✓{tasks/audit-cvm-2026-07-02.md;overall3.5/5}

[FEATURE-07]
@plan::tasks/07-agent-loop-robustness/plan.md{tddab;5blocks;parsePlanValid;redKeys33/33}+plan-rules.md{step;4steps;.ai-agent rules+release2.1.0}
@blocks::01crosscheck-submit+extract{+move planexecutor→apps/cvm-server/programs}→02validate+reaskUnbounded→03promptTestScope→04vm reportCCResult returns state+getNext keeps returnValue→05mcp tool responses
@decisions::testTiers textual{focused/block/full}+submitTask per-state text+getTask reminder suffix+publish only with user OK
§lesson::reportCCResult DOES resume VM{vm-manager.ts:215};getNext comment"READ-ONLY"misleading
?next::user approves plan→j-develop|j-cvm-exec-plan

[OPEN-ISSUES]
!#11::planexecutor CROSS-CHECK says"Respond"¬"Submit"→agentsPrintJSONinChat→executionStalls
  ?fix1::prompt→submitJson{mirror submitTest wording}
  ?fix2::robustParse{stripCodeFence;parseFail→retry¬crash}
  ?fix3::toolResponses{submitTask→"call cvm_getTask NOW";getTask waiting→appendSubmitReminder}
  ?acceptance::tests planexecutor suite+mcp-server tool responses

[NEXT]
?publish::cvm-server@2.0.0→npm{userDecision}
?j-new-feature::fix-issue-11
?audit-followups::CI+lint+config-zod+execLimitsEnforce+realpathSandbox
