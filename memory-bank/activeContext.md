§MBEL:5.0

[STATUS]
@state::IDLE
@lastClosed::09-mcp-sdk-v2{j-close 2026-10-11;merged→main 64966fe;pushed;history.md §2026-10-11}
@submodule::.ai-agent→branch feature/06-tddab-review{pushed;user keeps it;¬change}

[OPEN]
?release::cvm-server 3.0.0 ready on main{MCP SDK v2 server 2.3.1,zod 4,serveStdio both eras 2025-11-25+2026-07-28,Actions v7}→PR main→production(CI verify)→user merges→CD publishes 3.0.0;then invalidate Nexus npm-proxy+npm-group+clear npx cache dir with cvm-server
  ↳cvm-dbg(local dist)=3.0.0 verified 2026-10-11(server_info,load/start/getTask/submitTask,2-step delete);Claude Code negotiates 2025 era
?changelog::2.1.1 entry lacks feature-08 remediation items(Node22 engine,sandbox default cwd,instruction budget,registerTool,eslint)→offer a note
?npm::after a CD publish:"Require 2FA and disallow tokens";dist-tag next still 2.1.0
?nexus::lower npm-proxy "Maximum metadata age" so releases arrive without manual invalidation
?nvm::user may run `nvm alias default 22`(shell default still Node 18.20.8;run gates with `source ~/.nvm/nvm.sh && nvm use 22`)

[CICD]
@flow::PR main→production runs ci.yml(verify,only head=main of this repo);user merges by hand;push production→release.yml build+npm publish --provenance(OIDC Trusted Publishing,no token;skips existing version;'-'→next)
@checklist::tasks/08-e2e-and-compiler-fixes/cicd-setup.md
@e2e::CVM_E2E_PROTOCOL=legacy forces 2025 handshake(default auto→2026-07-28)

[LESSONS]
§typecheck::always --skip-nx-cache(cache once hid a failing typecheck)
§nexus::~/.npmrc registry=nexus.0ics.ai npm-group→after publish invalidate nexus npm-proxy+npm-group cache
§lsai::warm defining file(lsai_outline)before name lookups;@cvm/types logger is a Proxy(not spyable);reopen TS workspace after Claude restart
§build::types/app vite externals must include pino/fs/path,else pino browser build logs to STDOUT(breaks MCP stdio)
§process::never pkill -f with broad patterns(killed cvm-dbg)
§sdkv2::zod 3 with SDK v2 compiles but fails at first tools/list;serveStdio may call the factory more than once per connection and starts the transport without awaiting it

[NEXT]
?feature::toolchain majors(TS 7,Nx 23,Vitest 5,Vite 8,pino 10)
?audit-followups::config-zod,realpathSandbox,158 lint warnings(no-explicit-any)
