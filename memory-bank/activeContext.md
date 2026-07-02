§MBEL:5.0

[STATUS]
@state::EXEC-COMPLETE→5/5blocksDone{cvm-exec-plan};pendingCommits+j-close
@feature::06-drop-mongodb
@branch::feature/06-drop-mongodb
@date::2026-07-02

[FOCUS]
@feature::06-drop-mongodb::HardRemoveMongoStorage{→cvm-server@2.0.0BREAKING;fileStorageOnly}
!behavior::CVM_STORAGE_TYPE=mongodb→StorageFactory throws clearError{"removed v2.0.0;use file"}
+extra::typesDropMongoDep{phantom;pinoStays}+cleanConfig.storage+firstAppTest(config.spec)
@plan::tasks/06-drop-mongodb/plan.md{5blocks TDDAB;reviewAPPROVED;parsePlanValid;redKeys21/21match}
@decision::vmIntegrationSpec→convertToFileStorageAdapter{¬delete}

[PLAN-BLOCKS]
01-convert-vm-integration-to-file→removeOnlyExternalMongoDBAdapterConsumer
02-storage-file-only-guard→StorageFactory file-only+mongodb throws;deleteMongoDBAdapter+spec+dep
03-app-config-cleanup→config.ts/main.ts noMongo+config.spec+version2.0.0
04-remove-dead-mongodb-package→delete packages/mongodb+tsconfigRef+phantomDeps(types+mcp-server)
05-docs-docker-changelog→docker/READMEs/.env/techContext+CHANGELOG breaking
@order::01→02→{03∥04}→05

[PLAN-REVIEW]
>j-review-plan::APPROVED✓{parsePlanValid;redKeys21/21;structure+deps+order+cross-check+coverage}
>fixes-applied::{3minor}
  ✓{01-vm-spec::clarified vm-manager.integration.spec.ts¬MongoDBAdapter;onlyStaleComment→remove}
  ✓{rollup-external::stale'mongodb'in4vite.config.ts;added removal to blocks{02+01+04+03}}
  ✓{04-truncated-sentence::fixedIntroDependencyExplanation}
>validation::post-fix parsePlanValid;21redKeys maintained;blocksReadyForDevExecution

[RECENT]
>done::x-audit✓{tasks/audit-cvm-2026-07-02.md;overall3.5/5;committed→main+pushed}
>closed::05-cvm-plan-skills✓{merged→main;cvm-server@1.2.0released}
>done::j-review-plan✓{06-drop-mongodb;plan+3fixes;readyForDevelop}
>done::block01-convert-vm-integration-to-file✓{RED+GREEN+VERIFY5/5+CROSSCHECK5/5}
  ↳integration.spec.ts::MongoDBAdapter→FileStorageAdapter{tmpdir;noMongoUri;droppedNullNormalize}
  ↳vm-manager.integration.spec.ts::staleMONGODB_URIcomment removed{noAdapterSwap}
  ↳vite.config.ts::'mongodb'removedFromRollupExternal
  ↳verified::nx test vm{80files/700tests✓}+nx run-many build--all✓
>done::block02-storage-file-only-guard✓{RED+GREEN+VERIFY5/5+CROSSCHECK5/5}
  ↳deleted::mongodb-adapter.ts+mongodb-adapter.spec.ts
  ↳storage-factory.ts::StorageType='file'only{matchesPlanRefImpl};'mongodb'→throw"removed v2.0.0,use file";default→throwUnsupported
  ↳index.ts::mongodb-adapter export removed;package.json mongodbDep removed;vite.config.ts external mongodb entry removed
  ↳verified::nx test storage{3files/28tests✓}+nx run-many build--all✓{7projects}
>done::block03-app-config-cleanup✓{RED+GREEN+VERIFY5/5+CROSSCHECK4/4}
  ↳config.ts::Config.storage={type:'file';dataDir?}noMongoUri;removedMongoValidationBranch
  ↳main.ts::removedMongoDBloggingElseBranch{onlyFileStorageLogRemains}
  ↳package.json::version bumped1.2.0→2.0.0;mongodbDepRemoved
  ↳vite.config.ts::added test block{firstTestInfraForApp};removed'mongodb'fromExternal
  ↳new::config.spec.ts{4tests;firstTestEverForCvm-serverApp;audit#13closed}
  ↳verified::nx test cvm-server{4tests✓}+nx run-many build--all✓{7projects}
>done::block04-remove-dead-mongodb-package✓{VERIFY4/4+CROSSCHECK4/4;no-tests-block=deletionOnly}
  ↳deleted::packages/mongodb/**{deadPackage;noSrcConsumer}
  ↳tsconfig.json::removed{path:./packages/mongodb}reference
  ↳mcp-server::removed@cvm/mongodbDep+'mongodb'fromViteExternal
  ↳types::removedPhantom'mongodb'dep
  ↳nx sync::ranToFixOutOfSyncProjectRefs{tsconfig.json+mcp-server/tsconfig*.json}
  ↳verified::nx run-many build--all✓{6projects,mongodbGone}+test--all✓{7projects/allgreen}
>done::block05-docs-docker-changelog✓{VERIFY4/4+CROSSCHECK3/3;FINAL BLOCK;5/5plan COMPLETE}
  ↳docker::removedMongoDBservice+init-mongo/dir from docker-compose.yml{keptdocumentsNginxService}
  ↳.env+.env.example::removedMONGODB_URI;.env.exampleNowFileStorageOnly
  ↳READMEs::root+apps/cvm-server+packages/storage rewrittenFileStorageOnly{storageREADMEfullyRewritten,matchedActualAPI:StorageFactory+FileStorageAdapter}
  ↳CHANGELOG::apps/cvm-server/CHANGELOG.md added2.0.0BREAKINGentry
  ↳techContext.md::mongodbEnvVars+PackageDepsNotesRemoved;@mongodbmarkedREMOVED
  ↳verified::build--all✓{6projects}+test--all✓{7projects/108+mcp-server;allgreen}

[FEATURE-COMPLETE]
!06-drop-mongodb::ALL5BLOCKSdone{RED+GREEN+VERIFY+CROSSCHECK+MBupdate each};cvm-server@2.0.0BREAKING
!pending::gitCommits{5blocksSkipped-noUserResponseToApprovalAsk;workingTreeHasAllChangesUncommitted}

[NEXT]
?userApproval::commit5blocksIndividually(orSquash)beforej-close
?then::j-close{merge→main;possiblyPublish2.0.0}
