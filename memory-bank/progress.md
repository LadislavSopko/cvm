§MBEL:5.0

[07-agent-loop-robustness]
@state::DEVELOP{j-cvm-exec-plan plan.md}
>done::LISTEN+ANALYZE+RESEARCH+PROPOSE+PLAN✓
>done::interview{testTiers textual;reask unbounded;extras release+move+close#11}
>done::liveProbe submitTask/getTask{cvm-dbg}
>done::plan.md{5blocks}+plan-rules.md{4steps}+j-review-plan✓{fixesApplied}
✓block01-crosscheck-submit-and-extract
✓block02-crosscheck-validate-reask
✓block03-prompt-test-scope
✓block04-vm-submit-returns-next-state
?develop::plan.md 05 then plan-rules.md 01→04
?finding::redKey 40-char collision→ask user{issue or fold in}
?j-close::full BTLT+npm publish{userOK}+close#11+push .ai-agent branch{userOK}

[COMPLETED]
>06-drop-mongodb✓{2026-07-02→closed2026-10-09;5/5blocks TDDAB;merged→main;cvm-server@2.0.0;tasks/06-drop-mongodb/}
>05-cvm-plan-skills✓{merged→main;cvm-server@1.2.0released}
>x-audit✓{2026-07-02}
