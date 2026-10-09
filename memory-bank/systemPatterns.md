§MBEL:5.0

[Architecture]
@layers::
ClaudeDesktop(MCPClient)
→cvmServerApp{stdioTransport}
→MCPServer{protocolInterface}
→VMManager{orchestration}
→Parser→Compiler→VM→Storage

[KeyDecisions]

[1.CustomBytecodeInterpreter]
←why::EnablesZeroInfraDurableExecutionForAgent{3demands:zero-infra+survive-process-death+drive-MCP-agent}
@how::StackBasedVM+ExplicitStateManagement+ApplicationLevelCheckpoint
→benefits::PerfectStatePreservation+DeterministicExecution+AgentOrchestration
@moat::¬replaceable{bytecode VM necessary;simpler state machine insufficient}
@recovery::application-level block checkpoint{.cvm/uplan-progress.json}¬per-instruction serialization
§lesson{2026-06-09}::instruction-level resumability claim OVERSTATED;real moat is durable-execution-for-agent abstraction

[2.MCPServerArchitecture]
←why::ClaudeNeedsStandardProtocol{toolInteraction}
@how::PassiveServer{onlyRespondsToToolCalls}
→benefits::CleanIntegration+¬customProtocols

[3.HeapForReferenceTypes]
←why::JavaScriptSemantics{requireReferenceTypes}
@how::SeparateHeapStorage+IDbasedReferences
→benefits::ProperArray/ObjectBehavior+CleanSerialization

[4.HandlerPatternForOpcodes]
←why::Modularity+Testability
@how::EachOpcode→dedicatedHandler{withInterface}
→benefits::EasyToAddOpcodes+IsolatedTesting

[5.StorageAdapterPattern]
←why::SupportDifferentPersistenceBackends
@how::CommonInterface+File/MongoDBImplementations
→benefits::Flexibility+EasyNewBackends

[DesignPatterns]

[VisitorPattern(Compiler)]
CompilerContext{compileStatement+compileExpression+reportError}
→separateVisitors{statements+expressions}

[HandlerPattern(VM)]
OpcodeHandler{stackIn#→stackOut#→execute(state,instruction)}

[AdapterPattern(Storage)]
StorageAdapter{connect()+saveProgram()+getProgram()+...}

[FactoryPattern(Storage)]
createStorageAdapter()→autoSelectsBackend{basedOnEnvironment}

[DependencyFlow]
parser{standalone}
→types{sharedDefinitions}
→storage{usesTypes}
→vm{usesParser+types+storage}
→mcpServer{usesVM}
→cvmServer{appLayer}

[DataFlow]
SourceCode→Parser→AST→Compiler→Bytecode→VM→State→Storage
Storage→Resume→VM{cycle}

[ControlFlow]
Claude→MCPTools→MCPServer→VMManager→VM
VM→Task/Result→Claude{cycle}

[ExecutionPath]
1. mcp__cvm__load→CompileSourceToBytecode
2. mcp__cvm__start→InitializeVMState
3. VM→executesUntilCC()instruction
4. StateSaved+ExecutionPauses
5. mcp__cvm__getTask→ReturnPrompt
6. mcp__cvm__submitTask→ResumeWithResult{reportCCResult RUNS VM until next CC|complete|error+persists state}
7. Repeat→untilCompletion

[StateSerializationPath]
VMState{PC+stack+variables+heap}
→convertToJSON→storageAdapterPersists
→onResume::deserialize+restoreExactState

[ErrorHandlingPath]
OperationDetectsError→state.status='error'→state.error{message}
→returnToCaller{¬exceptions}→errorStatePersisted{forInspection}

[Principles]

[1.PassiveExecution]
CVM→¬pushesTasks
Claude→alwaysPulls{whenReady}
StateMachine→waitsBetweenTransitions

[2.StateAsFirstClass]
AllState→explicitlyManaged
State→survivesAnyInterruption
State→observable{anyTime}

[3.CleanBoundaries]
EachPackage→singleResponsibility
Dependencies→flowOneDirection
Interfaces→defineContracts

[4.NoMagic]
Explicit>Implicit
PredictableBehavior
DebuggableExecution

[ExtensionPoints]

[AddingOpcodes]
1. DefineInBytecode.ts→2.CreateHandlerInHandlers/→3.AddCompilerSupport→4.WriteTests

[AddingStorageBackends]
1. ImplementStorageAdapterInterface→2.AddToFactory→3.ConfigViaEnvironment

[AddingLanguageFeatures]
1. ExtendParserGrammar→2.AddASTNodeTypes→3.ImplementCompilerVisitor→4.CreateVMHandlers

[CVMPlanProtocol]
§CVMProtocol:1.0
@spec::docs/PLAN_FORMAT.md{CVM Plan Protocol (CVM-PP) Specification}
@paradigm::CVM¬executes+sequences→checkpoints+AIdrives+stateManaged
@purpose::contractForMarkdownPlanGrammar{parsedByMCPtool;executedByplanexecutor}
@format::single-file|multi-file{index.md+<files>/file1.md}
@types::tddab{RED→GREEN→VERIFY→CROSS-CHECK→COMMIT}|step{EXECUTE→VERIFY→COMMIT}
@detection::deducePlanType{autoDetectFromStructure}
@compiler::parsePlan{packages/mcp-server/src/lib/mcp-server.ts}
@output::.cvm/uplan.json{type+mission+sourceFile+sourceFiles+blocks[id/title/intro/red/redKeys/success/planRef]}
@resumption::.cvm/uplan-progress.json{applicationLevelCheckpoint}
↳reference-impl::tddab-parser.ts{lexing+parsing}
↳executor::test/programs/tddab/planexecutor.ts{checkpoint+resume+verify}
@moat::durable-execution-for-agent{zero-infra+survive-process-death+orchestrate-AI}
