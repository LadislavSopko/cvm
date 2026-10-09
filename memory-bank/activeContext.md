§MBEL:5.0

[STATUS]
@state::LISTEN
@feature::07-agent-loop-robustness
@branch::feature/07-agent-loop-robustness
@date::2026-10-09

[RECENT]
>closed::06-drop-mongodb✓{j-close;merged→main;cvm-server@2.0.0BREAKING;fileStorageOnly;¬published-npm-yet}
  ↳verified::build--all✓{6projects}+test--all✓{7projects/1178tests}
>done::x-audit✓{tasks/audit-cvm-2026-07-02.md;overall3.5/5}

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
