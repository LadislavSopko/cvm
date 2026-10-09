§MBEL:5.0

[CoreStack]
@TypeScript::5.8.2{primaryLanguage}
@NodeJs::18.16+{runtime}
@Nx::21.2.0{monorepo+build+tooling}
@Vitest::3.0.0{testing+coverage}

[BuildTools]
@Vite::6.0.0{fastBuild}
@ESBuild::0.19.2{bundler}
@SWC{fastTScompiler}

[KeyDeps]
@modelcontextprotocol/sdk→MCPprotocol{1.17.2installed vs1.29.0upstream;deprecated server.tool()API}⚠upgrade-target
@mongodb::REMOVED{06-drop-mongodb→v2.0.0shipped;fileStorageOnly;@cvm/mongodbPkg+allMongoDeps+MongoDBAdapterDeleted}
@zod→schemaValidation{©audit-correction::USED forMCPtoolInputs(mcp-server.ts:82-538);¬usedForEnvConfig(realGap§8)}
@TypeScriptCompilerAPI→parsingCVMsource
@types/pino→©audit-correction::USED(logger.ts require pino);but shipsAsRUNTIMEdep⚠move-to-devDeps

[DevSetup]
!prereqs::NodeJs18.16+&npm&Git
?optional::ClaudeDesktop{MCPintegration}

[SetupCommands]
npm install
npx nx run-many --target=build --all
npx nx run-many --target=test --all

[Constraints]

[ModuleSystem]
!critical::moduleResolution"nodenext"
!rule::ALLimports→use.jsExtension
import{foo}from'./bar.js'{evenFor.tsFiles}
TS→resolves.js→actual.tsFiles

[LanguageConstraints]
✓basicTypes+controlFlow+arrays+objects
✓functions{¬parameters@currently}
✗classes+async/await+modules
✗try/catch+destructuring+spread

[RuntimeConstraints]
¬networkAccess{fromCVMprograms}
fileSystemAccess→sandboxed{workingDirOnly}
¬shellCommandExecution
memoryLimits{heapAllocations}

[PackageDeps]
parser→{¬internalDeps}
types→{¬internalDeps}
storage→types
vm→parser+types+storage
mcpServer→vm+parser
cvmServer→mcpServer

[ExternalDeps]
@production::minimal{MCPsdk}
@development::fullNxToolchain+TypeScript+Vitest

[NxCommands]
npx nx build <package>
npx nx test <package>
cd test/integration && npx tsx mcp-test-client.ts ../programs/test.ts
npx nx reset && npx nx run-many --target=build --all --skip-nx-cache

[MCPIntegration]
mcpServers.cvm{command:"npx",args:["cvm-server@latest"]}
env{CVM_STORAGE_TYPE:"file",CVM_DATA_DIR:".cvm"}

[TestingPatterns]
UnitTests→perPackage{Vitest}
IntegrationTests→crossPackage{packages/integration}
E2ETests→fullStack{test/integration}
CoverageTarget~%85+{corePackages}

[EnvVars]
CVM_STORAGE_TYPE=file
CVM_DATA_DIR=.cvm
CVM_LOG_LEVEL=debug|info|warn|error
CVM_LOG_FORMAT=pretty|json
NODE_ENV=development|production

[TSConfig]
strictMode✓+ES2022target+NodeNextModuleResolution+sourceMaps✓

[BuildConfig]
Vite{libraryBuilds}→outputsCJS+ESM+typeDefs+treeShaking✓

[NPMPublish]
npx nx release
| cd apps/cvm-server/dist && npm publish

[SecuritySandboxing]
CVMprograms→restrictedEnv
¬accessToNodeGlobals
fileOps→limitedToSandbox{!BUG:file-system.ts:56 startsWith bypass⚠critical-prepublish}
resourceLimits→enforced

[InfrastructureIssues]
@nxCloudId::©audit-correction::DECLARED(nx.json:20)but noAccessToken→orphan⚠remove-or-add-token
@npmAudit::nexus proxy returns 400→supply-chain exposure unmeasured
@clutter::counter.ts+graph.html+tsconfig.tsbuildinfo{committed}⚠clean
@ci::none⚠add
@lint::none⚠add
@configValidation::cast-without-zod despite zod available⚠enforce

[InputValidation]
AllMCPinputs→validatedWithZod
ProgramSource→validatedBeforeCompilation
CCresponses→sanitized

[Website]
@files::wwwroot/index.html{landing}+wwwroot/study.html{research}
@tech::pureHTML/CSS/JS+ChartJs4.4.4{CDN}+CSSCustomProperties{theming}
@storage::localStorage{cvm-theme+cvm-experienced}
@hosting::cvm.example4.ai{staticFiles}
