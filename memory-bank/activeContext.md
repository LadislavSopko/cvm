§MBEL:5.0

[FOCUS]
@state::PLAN
@feature::03-submitTask-guard
@branch::feature/03-submitTask-guard
@date::2026-06-01

[ISSUE]
@githubIssue::#9{planexecutor phase state machine desyncs under batched getTask/submitTask}
@rootCause::reportCCResult{vm-manager.ts:215}→¬checksState→acceptsSubmitInAnyState
@desync::client batches submitTask→VM advances without valid AWAITING_COGNITIVE_RESULT state
@fix::twoFronts{server+client}

[SERVER-SIDE]
@guard::reportCCResult→throwIf{execution.state¬'AWAITING_COGNITIVE_RESULT'}
@errorChain::throw→mcpServer catch{mcp-server.ts:257}→isError:true→client
@plan::tasks/03-submitTask-guard/plan.md{1block TDDAB→reviewed✓+fixedRUNNINGstate}
@testFile::packages/vm/src/lib/vm-manager-submit-guard.spec.ts{new}
@reviewFix::addedRUNNINGstate{red+implementation+success}→all5statesCovered

[CLIENT-SIDE]
@aiAgent::v2.17.28{j-cvm-exec-plan.md updated}
@rules::
- ALLcvmCalls(getTask+submitTask)→masterOnly{¬subagents}
- ONEcvmToolCallPerTurn
- strictSequence::getTask→work→submitTask→waitConfirm→getTask
- subagentsOK→forWork{analyzeFiles+runTests+codeNav}
- subagentsVIETATO→forCVMprotocol{mcp__cvm__*tools}

[SUBMODULE]
@aiAgent::removedAndReadded{cleanSubmodule}
>commit::c4455d3{chore: remove .ai-agent submodule}
>readded::gitSubmoduleAdd{pointsTo 3dba33c master}
@gitGraphIssue::ServiceWorkerInvalidStateError{VSCode webview bug→openIssue#316991}

[ARCHITECTURE]
@planTypes::tddab{RED→GREEN→VERIFY→CROSSCHECK→MBUPDATE→COMMIT}+step{EXECUTE→VERIFY→MBUPDATE→COMMIT}
@multiFile::index.md{mission+files}→subFiles{blocks only}→merged uplan.json
@crossCheck::redKeys JSON template→Claude fills true/false→program verifies
@collaboration::claude-chat room"cvm"→cvm-builder+ai-agent-builder+human

[DEVELOPED]
>block01-state-guard::RED✓→GREEN✓→VERIFY✓→CROSSCHECK✓→MBUPDATE✓{2026-06-01}
>guard::vm-manager.ts:221{throwIf state≠AWAITING_COGNITIVE_RESULT}
>tests::vm-manager-submit-guard.spec.ts{5tests allPass}

[NEXT]
?commit→pushBranch→PR→mergeToMain
?closeIssue#9{withPRreference}
