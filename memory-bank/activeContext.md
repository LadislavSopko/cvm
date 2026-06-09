§MBEL:5.0

[FOCUS]
@state::AUDIT_COMPLETE
@date::2026-06-09

[AUDIT-2026-06-09]
@type::x-audit(architecture/foundations/security)
@score::3.9/5{engineering strong,enforcement weak}
@testsPass::1179 passed+1 skipped✓|typecheck clean✓
@testRatio::2.4:1{source:test}

[CRITICAL-SECURITY⚠PREPUBLISH]
@sandbox-bypass::packages/vm/src/lib/file-system.ts:56
@issue::startsWith(sandboxPath) without trailing separator→/data/sandbox-evil passes when root=/data/sandbox
@fix::1-line{addTrailingSeparatorCheck}
@status::actionable before next publish

[ARCHITECTURE-FINDINGS]
@deadCode::@cvm/mongodb{unused,noImports,onlyVitecfg}→@cvm/storage has own mongodb-adapter.ts
@depsIncoherent::mongodb pinned 3 ranges{types^6.3UNUSED,storage^6.12,app^6.17};@types/pino{deprecated,published};typescript{double-declared}
@nxCloudId::nx.json undeclared→401 on every build
@clutter::counter.ts+graph.html+tsconfig.tsbuildinfo{committed}
@planexecutor::production builtin under test/tree→should move to apps/cvm-server/programs/
@npmAudit::impossible{nexus proxy returns 400}→supply-chain unmeasured
@mcp-sdk::1.17.2 installed vs 1.29.0 upstream;deprecated server.tool() API

[ENFORCEMENT-GAPS]
@ci::none
@lint::none
@validation::config cast-without-zod-despite-available
@foundationScore::9.5/16{arch strong:interface-first+black-box+test-per-module;enforcement weak:¬CI¬lint}

[VM-MOAT-CLARIFIED]
>hypothesis::bytecode VM replaceable by simpler state machine
>challenge::Protocol-D review of planexecutor.ts FULL TEXT
✓corrected::VM is NOT replaceable;three requirements{zero-infra+survive-process-death+drive-MCP-agent}require full bytecode
>claim::moat="instruction-level resumability"→OVERSTATED
@actual-moat::zero-infra durable-execution-for-agent
@recovery::application-level block checkpoint(.cvm/uplan-progress.json)¬per-instruction VM serialization

[NEXT-QUICK-WINS]
→next{fix sandbox bypass}⚠critical-before-publish
→next{delete @cvm/mongodb}
→next{clean @cvm/types deps+drop @types/pino from published}
→next{remove nxCloudId from nx.json}
→next{add CI+ESLint}
→next{ship 05-vm-functions}⚡strategic{silent-undefined at control.ts:158 is biggest user trap}
