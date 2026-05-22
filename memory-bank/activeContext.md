§MBEL:5.0

[FOCUS]
@state::PLAN✓→readyForDevelop
@feature::01-universal-template
@branch::feature/universal-template
@date::2026-05-22

[WHAT]
@building::PipelineTDDABplans→CVMprograms
3components::
1. TDDABplanFormat→markdown+5XMLtags{mission+block+intro+red+success}
2. MCPtool`parsePlan`→parsesplan.md→JSONarrayOfBlocks{withLineRefs}
3. MCPtool`generateExecutor`→producesUniversalTddabExecutor.ts

[TDDAB-FORMAT-V2]
@tags::mission+block+intro+red+success
@mission::fullProjectBriefing{¬oneParagraph}→enoughForCleanContextExecution
@success::checklist{- [ ] items}→allMustPass{¬singleSentence}
@executor::4CC()perBlock::RED→GREEN→VERIFY→COMMIT
@responseProtocol::"done"{actions}+"passed"|"failed"{tests}
@fixLoop::separate{CC(fix)→CC(retest)}→provenPatternFromV3

[PLAN]
@file::tasks/01-universal-template/plan.md
@blocks#6::
01-plan-format→defineFormat{noDeps}
02-parser-unit→parseMD→JSON{dependsOn01}
03-mcp-tool→parsePlanMCPtool{dependsOn02}
04-executor-template→universalCVMprogram{dependsOn01}
05-generate-tool→generateExecutorMCPtool{dependsOn02+04}
06-e2e-integration→fullPipelineTest{dependsOnAll}

[ARTIFACTS]
>tasks/01-universal-template/tddab-planner-v2.md→formatSpec✓
>tasks/01-universal-template/plan.md→TDDABplan{6blocks}✓
>tasks/01-universal-template/notes.md→requirements+analysis✓
>j-settings.md→juniorWorkflowConfig✓
>.ai-agent→submodule{setup.sh→ran}✓
>memoryBank→convertedToMBELv5✓

[PREVIOUS]
>VMExecutionLogging→TDDAB3complete✓+testingAntiPattern⚠️
>regexpLiterals→fullyImplemented✓{2025-07-05}
>bugFixes#1-5→allFixed✓+BTLT✓
>websiteCVMexample4ai→landing+study→complete✓

[NEXT]
?j-develop→startImplementation{block01-plan-format}
?afterCVM→mergeTddabPlannerV2→ai-agentSubmodule

[DECISIONS]
@CVMisPromptOrchestrator::¬executesAnything
@formatLightweight::5tags{¬fullXML→LLMfriendly}
@executorUniversal::sameForAnyLanguage/Project
@REDseparatePhase::testFirstEnforced{byCVM}
@missionFullBriefing::cleanContextExecution
@successIsChecklist::verifiableOutcomes
@provenPatternFromV3::implement→test→fixLoop→commit
