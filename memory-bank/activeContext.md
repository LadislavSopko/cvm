§MBEL:5.0

[FOCUS]
@state::IDLE
@date::2026-06-02

[LAST-COMPLETED]
@feature::04-verdict-gate-contract{2026-06-02}
@branch::feature/04-verdict-gate-contract→merged✓main{commits ede9a1f..030a921}
@dogfooding::eseguito via planexecutor{rifattorizzato planexecutor COL planexecutor}
>01-clean-main::main→0/0 toolchain reale{22 errori typecheck latenti fixati:14 miei da 03 null-check+8 preesistenti mcp-server;integration.spec.ts via MongoDB docker;_key vm-manager.ts:386}
>02-verdict-inline::gate VERIFY/RE-VERIFY{:91,93,110,149,151,168}→v.toLowerCase().startsWith("passed");while(!passed)+terminatori terse{:17-18}
>03-fix-crosscheck-reverify::bug RE-VERIFY post-crosscheck ritorno scartato→wired nel fix loop{ccPassed+while}
@verify::build 7 proj+typecheck 0+vm 698+mcp-server 96{12 test nuovi}+e2e 64/64
@release::PENDING→human publish npm a mano{1.0.1→1.1.0 feat};poi ping ai-agent-builder→rebuild img→benchmark 3 task{cliffy,fastapi,prometheus}

[CONTRACT-VERDICT-GATE]{agreed room"cvm" w/ai-agent-builder+human 2026-06-02}
@parser::MINIMAL inline→var v=resp.toLowerCase();var passed=v.startsWith("passed");while(!passed)
>2 op solo{toLowerCase+startsWith};NO split/trim/includes{CVM instabile chaining};NO ===;NO function{VM limit};bias→failed
@submit::SECCO→solo token{passed|failed|done};ragionamento nel turno NON nel submit;esempi mindset secchi
@policy0/0::ASSOLUTA{"preesistente" non esiste,zero workaround:no @ts-ignore/.skip/eslint-disable};vive lato skill SCOPED al toolchain reale{NO enforcement nell'executor=troppo fuzzy};VERIFY resta sui success criteria del blocco
@noCapNoAbort::human veto{abort=morte};backstop=max_turns harness
@ownership::planexecutor.ts=mio repo cvm;benchmark-runner.ts+4 skill=ai-agent-builder repo cvm-benchmark-kit{5c69b4a,parser 1:1}

[CRITICAL-VM-LIMIT]
@noUserFunctions::CVM supporta SOLO main(){control.ts:158 'Functions not implemented';add(2,3)→undefined};helper→undefined→loop infinito se usata in gate→logica INLINE obbligatoria
@futureCandidate::05-vm-functions{call frames+param+local scope+RETURN unwind;tosta perché stack VM}

[PREV-COMPLETED]
@03-submitTask-guard{2026-06-01}→merged main+released cvm-server@1.0.1{vm-manager.ts:221 state guard,issue #9}
