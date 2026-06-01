§MBEL:5.0

[Mission]
@CVM::AlgorithmicTODOManager{forClaude}
@purpose::Programs→SmartTODOLists{systematic+¬contextLoss}

[WhatCVMIs]
@is::PassiveStateMachine{Claude→asks"whatsNext"→CVMgivesTask→complete→repeat}
@is::PerfectExecutionFlow{across#1000sOperations}
@solves::"Claude,analyzeThese1000Files"→¬confusion

[WhatCVMIsNot]
¬generalPurposeLang
¬complexComputation
¬traditionalScripting

[CoreConcept]
CC()::CreateTaskForClaude
CC("SummarizeFile:"+filename)→createsTODO{¬callsClaude}

[Architecture]
Claude→asks"whatsNext?"→CVMgivesTask→Claudecompletes→repeat
