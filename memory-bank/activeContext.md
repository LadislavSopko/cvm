§MBEL:5.0

[STATUS]
@state::TEST{plan 4/4 done;ready for j-close}
@feature::09-mcp-sdk-v2
@branch::feature/09-mcp-sdk-v2
@plan::tasks/09-mcp-sdk-v2/plan.md{tddab;4 blocks;19 redKeys;parsePlan valid;reviewed x2}
@decisions09::serveStdio both eras;Actions v7(checkout 3d3c42e,setup-node 949feb2);release 3.0.0;zod ^4.2 required(zod3 fails at runtime);toolchain out
@lastClosed::08-e2e-and-compiler-fixes{j-close 2026-10-10;merged→main bb3f741;pushed;history.md §2026-10-10}
@submodule::.ai-agent→branch feature/06-tddab-review{pushed;user keeps it;¬change}

[EXEC-09]
@run::run-09-sdk-v2{planexecutor 2.1.1;.cvm/uplan-progress.08-remediation.bak = old progress}
>B01-sdk-v2-server-and-zod4✓{RED2fail+3guard;GREEN;VERIFY5/5;CROSSCHECK5/5}
  ↳@modelcontextprotocol/server ^2.3.1+zod ^4.2.0 in mcp-server+apps/cvm-server;imports from server root,StdioServerTransport from /stdio;15 inputSchema→z.object;vite externals /^@modelcontextprotocol\//
  ↳lock:-817 lines(v1 sdk gone);bundle requires @modelcontextprotocol/server(+/stdio) external;stdout 0 bytes
  ↳!e2e client still imports @modelcontextprotocol/sdk→broken until B03(root devDep client added in B02)
  ↳gate::build6+typecheck7+lint7+mcp156+cvm-server7✓
  ↳commit::00ba44a
>B02-serve-stdio-both-eras✓{RED4fail+3guard;GREEN;VERIFY4/4;CROSSCHECK7/7}
  ↳mcp-server.ts buildServer() fresh McpServer{capabilities tools} per factory call;setupTools(server);start()→handles.add(serveStdio(factory,{transport,onerror→logger}));stop() closes all handles then vmManager.dispose()
  ↳VMManager+DeleteConfirmations shared across connections;@cvm/types dep added;root devDep @modelcontextprotocol/client ^2.3.1
  ↳TestTransport ready promise(callTool/listTools await it);existing 156 specs unchanged
  ↳eras spec(InMemoryTransport)::legacy 2025,pin 2026-07-28,auto→modern;token shared across connections
  ↳gate::build6+typecheck7+lint7+mcp163+cvm-server7✓;stdout 0 bytes
  ↳commit::bfe48e8
>B03-e2e-client-v2-auto✓{RED3fail+1guard;GREEN;VERIFY4/4;CROSSCHECK4/4}
  ↳mcp-test-client.ts→@modelcontextprotocol/client(+/stdio);versionNegotiation auto by default;CVM_E2E_PROTOCOL=legacy→no options;prints 'Protocol era: <era> (<version>)'
  ↳real stdio smoke(return-types.ts string)::auto→modern 2026-07-28 exit0;legacy→2025-11-25 exit0
  ↳plan fix::smoke command needs the CC response 'string'
  ↳gate::build6+typecheck7+lint7+integration64✓
  ↳commit::edbe422
>B04-release-3-0-0✓{RED3fail;GREEN;VERIFY3/3;CROSSCHECK3/3}
  ↳apps/cvm-server 3.0.0(lock synced);CHANGELOG 3.0.0(SDK v2 server,both eras serveStdio,zod 4,stdout tolerance,e2e client auto,Actions v7)
  ↳ci.yml+release.yml→checkout v7 3d3c42e,setup-node v7 949feb2;actionlint ok(local scratch tool)
  ↳gate::build6+typecheck7+lint7+integration67+cvm-server7✓
  ↳!note::2.1.1 CHANGELOG lacks feature-08 remediation items(Node22 engine,sandbox default cwd,instruction budget,registerTool,eslint)→published 2.1.1 shipped them undocumented

[OPEN]
?release::cvm-server version 2.1.1 vs 3.0.0{recommended 3.0.0: engines node>=22,sandbox default cwd,compile rejects syntax errors,delete nonce,instruction budget}→user decides;2.1.1 NOT on npm yet
?cicd::user configures tonight per tasks/08-e2e-and-compiler-fixes/cicd-setup.md{npm Trusted Publisher done(release.yml,env production,only "npm publish");GitHub env production,Actions read-only,ruleset production}
  ↳flow::PR main→production runs ci.yml(verify);user merges by hand;push production→release.yml build+npm publish --provenance(OIDC,no token;skips existing version)
  ↳!creating production branch triggers CD→publishes current version
?preview::npm pack tarball of apps/cvm-server/dist→test via npx -y <tgz> before publishing{offered,not done}
!cvm-dbg::MCP server killed by my pkill(2026-10-10)→user must restart it
?nvm::user may run `nvm alias default 22`(shell default still Node 18.20.8;run gates with `source ~/.nvm/nvm.sh && nvm use 22`)

[LESSONS]
§typecheck::always --skip-nx-cache(cache once hid a failing typecheck)
§nexus::~/.npmrc registry=nexus.0ics.ai npm-group→after publish invalidate nexus npm-proxy+npm-group cache
§lsai::warm defining file(lsai_outline)before name lookups;@cvm/types logger is a Proxy(not spyable)
§build::types/app vite externals must include pino/fs/path,else pino browser build logs to STDOUT(breaks MCP stdio)
§process::never pkill -f with broad patterns(killed cvm-dbg)

[NEXT]
?feature::toolchain majors(TS 7,Nx 23,Vitest 5,Vite 8,zod 4,pino 10)+MCP SDK v2(analyze sessions/new spec;stdio impact)
?audit-followups::config-zod,realpathSandbox,48+ no-explicit-any warnings(158 lint warnings)
