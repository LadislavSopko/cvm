§MBEL:5.0

[FOCUS]
@state::PLAN
@feature::01-universal-template
@branch::feature/universal-template
@date::2026-05-18

[RECENT]
>added::ai-agent{submodule→.ai-agent/}✓
>ranSetup::setup.sh→symlinks+hooks+memoryBankIntegration✓
>converted::memoryBank→MBELv5{allCoreFiles}✓
>created::j-settings.md{juniorWorkflow}✓
>pushed::feature/universal-template→origin✓

[NEXT]
?gatherRequirements::LISTEN→whatUserNeeds
?analyze::afterLISTEN→codeAnalysis
?propose::solution→userApproval
?plan::TDDAB→implementation

[DECISIONS]
@passiveArchitecture::CVM→¬initiates{onlyResponds}
@statePreservationFirst::¬loseUserProgress
@cleanBoundaries::eachPackage→singleResponsibility
@mergeStrategy::direct→main
@methodology::TDDAB
