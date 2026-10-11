§MBEL:5.0

[STATUS]
@state::IDLE
@lastClosed::09-mcp-sdk-v2{j-close 2026-10-11;merged→main 64966fe;pushed;history.md §2026-10-11}
@submodule::.ai-agent→branch feature/06-tddab-review{pushed;user keeps it;¬change}

[RELEASED]
✓cvm-server@3.0.0::2026-10-11 via PR #13 main→production→CI verify green(Actions v7,e2e 64/64)→user merge→CD release.yml(OIDC,provenance,sigstore logIndex 3204776013)→npm latest=3.0.0{deps @modelcontextprotocol/server ^2.3.1,zod ^4.2.0;engines node>=22}
  ↳verified::cvm MCP(npx cvm-server@latest via Nexus)=3.0.0(server_info,load/start/getTask/submitTask,2-step delete);cvm-dbg(local dist)=3.0.0;Claude Code negotiates 2025 era
  ↳npm takes ~3-4 min after publish before the version is visible(registry+CDN)

[OPEN]
?npm::"Require 2FA and disallow tokens" now possible(CD publish proven)
?changelog::2.1.1 entry lacks feature-08 remediation items(Node22 engine,sandbox default cwd,instruction budget,registerTool,eslint)→offer a note
?nvm::user may run `nvm alias default 22`(shell default still Node 18.20.8;run gates with `source ~/.nvm/nvm.sh && nvm use 22`)

[CICD]
@flow::PR main→production runs ci.yml(verify,only head=main of this repo);user merges by hand;push production→release.yml build+npm publish --provenance(OIDC Trusted Publishing,no token;skips existing version;'-'→next)
@checklist::tasks/08-e2e-and-compiler-fixes/cicd-setup.md
@e2e::CVM_E2E_PROTOCOL=legacy forces 2025 handshake(default auto→2026-07-28)

[LESSONS]
§release::after CD publish:1)wait until npmjs shows the version(npm view cvm-server dist-tags --registry https://registry.npmjs.org) 2)ONLY THEN Invalidate cache Nexus npm-proxy+npm-group(earlier→Nexus caches a 404) 3)rm ~/.npm/_npx/<dir with cvm-server> 4)/mcp→cvm→Reconnect
§nexus::~/.npmrc registry=nexus.0ics.ai npm-group;user decision 2026-10-11:keep Nexus default cache ages(release every ~3 months)→invalidate by hand
§disttag::next=2.1.0 left as is(user 2026-10-11);all installs use latest;CD moves next on the first pre-release('-' version)
§node18::cvm-server 3.0.0 runs on Node 18 too(only EBADENGINE warnings) but declares >=22
§typecheck::always --skip-nx-cache(cache once hid a failing typecheck)
§lsai::warm defining file(lsai_outline)before name lookups;@cvm/types logger is a Proxy(not spyable);reopen TS workspace after Claude restart
§build::types/app vite externals must include pino/fs/path,else pino browser build logs to STDOUT(breaks MCP stdio)
§process::never pkill -f with broad patterns(killed cvm-dbg)
§sdkv2::zod 3 with SDK v2 compiles but fails at first tools/list;serveStdio may call the factory more than once per connection and starts the transport without awaiting it

[NEXT]
?feature::toolchain majors(TS 7,Nx 23,Vitest 5,Vite 8,pino 10)
?audit-followups::config-zod,realpathSandbox,158 lint warnings(no-explicit-any)
