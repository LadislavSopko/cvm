§MBEL:5.0

[FOCUS]
@state::PLAN
@date::2026-06-02
@next::04-verdict-gate-contract{refactor gate loops→tolerant parsing}

[DESIGN-AGREED]{2026-06-02 room"cvm" w/ai-agent-builder+human}
@problem::gateLoops match esatto stringa vs LLM output stocastico
@twoLoops::
- benchmark-runner.ts:48{while reviewOk!=="passed"}→default RIFAI{spreca cicli}
- planexecutor.ts:148+:92{while testResult==="failed"}→default PROCEDI{PERICOLOSO:falso GREEN committato}
@contract::REVISED{human direttiva 08:08→submit SECCO,no saggio}{NO cap, NO abort→abort=morte}
1>REQUEST gate→agent::"submit ONLY: passed|failed"{non-gate:"submit ONLY: done"};prompt STRETTI,no "puoi spiegare"
2>RESPONSE::submitTask = SOLO il token,zero motivazione;ragionamento/checklist nel TURNO a schermo{guardrail resta},NON nel submit
3>PARSING{executor,RETE DI SICUREZZA}::MINIMAL{human 08:39+validato VM}→var v=resp.toLowerCase();var passed=v.startsWith("passed");while(!passed){...}
  >SOLO 2 op:toLowerCase+startsWith;NO split/trim/includes{CVM instabile su chaining lungo};submit secco rende resto superfluo;bias→failed;INLINE no function no ===
  >validato VM:passed→T,failed→F,PASSED→T,"passed\nessay"→T,loop["failed","failed","passed"]→exit@2
4>verdetti unificati passed/failed{CROSS-CHECK resta JSON,non toccare}
5>ESEMPI nei mindset::secchi{`passed`,non `passed.<saggio>`}→esempio insegna comportamento
6>asciugare prompt planexecutor::missionCtx+toolsReminder verbosi→stretti
@policy0warn0err::{human 08:11}tutto codice via piani→CC deve essere PULITO 0 error 0 warning
@REVISED{human+ai-agent-builder 08:33}::policy NON enforced nell'executor→troppo fuzzy
>WHY-no-executor-gate::executor GENERICO(TS/Py/Go/...)→non sa quale comando=lint né cosa=warning→verdetto soggettivo→falsi failed→NO-CAP=LOOP INFINITO{stesso disastro evitato con isPassed}
>aggancio2 RITIRATO::NIENTE gate BTLT separato/assoluto nell'executor;VERIFY resta sui SUCCESS CRITERIA del blocco{agente verifica col comando reale,auto-riporta}
>parsePlan NON toccato
>policy vive SOLO lato skill{ai-agent-builder}::SCOPED al toolchain reale{understand rileva tool+comandi esatti};mission policy solo su tool esistenti{no inventare linter assenti};disciplina:no suppress(@ts-ignore/.skip),no "pre-existing",fix root cause→ma solo su tool reali
>mio repo cvm HA typecheck+lint+test→2 violazioni restano da chiudere{applicare disciplina al progetto reale,NON enforcement}
>motivazione::FAIL#1 cliffy moriva 40 errori TS;03-guard warning residuo vm-manager.ts:386{6133}
@policyABSOLUTE::{human 08:12}"preesistente" NON esiste;0/0 non violabile né aggirabile;ZERO workaround{no @ts-ignore,no eslint-disable,no .skip,no "altro modulo"}
>0/0 = STATO repo a fine blocco,NON delta{"non ci sono errori" non "non ho aggiunto errori"}
>warning/error trovato anche se preesistente→FA PARTE DEL LAVORO→fix,non giustifica
>VERIFY gate controlla stato ASSOLUTO repo non delta
@DEBT-main-dirty::{verificato sessione}main NON pulito ora→2 violazioni da chiudere PRIMA{banco prova policy}:
  1.vm-manager.ts:386 TS6133 'key' declared never read{warning}
  2.integration.spec.ts "Hook timed out 10000ms"{test rotto,liquidato erroneamente come preesistente}
@selfCritique::io su 03-guard ho usato "preesistente/unrelated"→esattamente l'aggiramento vietato→non ripetere
@noAliasApproved::FINAL DECISION→solo passed/failed ovunque{G6 review compreso}{2026-06-02}
@terminatorInjection::ME inietto submitTest dal lato programma{planexecutor.ts:18 + benchmark-runner separato→replico terminator in ENTRAMBI};mindset rinforza disciplina,non inietta
@parserReadsFirstLineOnly→motivazione non falsa verdetto
@CRITICAL-VM-LIMIT::CVM NON supporta funzioni user-defined{control.ts:158 'Functions not implemented';add(2,3)→undefined verificato eseguendo}
>impl::NIENTE function isPassed(){ritornerebbe undefined→!undefined sempre true→loop gate INFINITO+no cap=LETALE}
>SOLUTION::logica verdetto INLINE in var dentro ogni gate{validata su VM reale tmp/verdict-probe6}:
  var line=resp.split("\n")[0].trim().toLowerCase();
  var passed=line.startsWith("passed")&&!line.includes("fail")&&!line.includes("reject");
  while(!passed){...FIX...;resp=CC(reverify);line=...;passed=...;}
>replicato G1-G5 planexecutor.ts{MIO repo cvm}+G6 benchmark-runner.ts{repo ai-agent-builder cvm-benchmark-kit→LUI applica su mio spec,no PR cross-repo}
>OWNERSHIP::planexecutor=mio,benchmark-runner=suo;spec verdict inline mandato in room{G6 review loop+fasi non-gate submit ONLY done}
>ai-agent-builder DONE::4 skill{tddab-planner,j-cvm-exec-plan,j-review-plan,step-planner}+benchmark-runner{root+build/kit sync}
>G6 deviazione APPROVATA::runner usa skill /j-review-plan{non inline-mindset}→più robusto+corretto mio naming errato(/mind-sets:tddab-planner→/tddab-planner);parsing verdetto identico,contratto invariato
>verified::split/trim/toLowerCase/startsWith/includes/&&/! tutti solidi INLINE;function CALL rotto
@probesSaved→avoided shipping infinite-loop to prod{human istinto giusto}
@futureCandidate::05-vm-functions{user-defined functions→call frames+param passing+local scope+RETURN unwind;CALL oggi stubbed control.ts:150;tosta perché stack VM;next feature dedicata,non ora}

[EXEC-04 PROGRESS]
@branch::feature/04-verdict-gate-contract{off main}
@dogfooding::planexecutor run-04-verdict{exec via cvm-dbg}
>block01-clean-main DONE✓{RED→GREEN→VERIFY→CROSSCHECK passed}
  >scoperta::typecheck reale aveva 22 errori{NON 2}→14 in vm-manager-submit-guard.spec.ts{MIEI da 03,null-check mancante getExecution}+8 in mcp-server{preesistenti:unlink/beforeEach unused,JSON.parse unknown}
  >LEZIONE::03 verificato solo `nx test`(vitest no typecheck)→mergiato+rilasciato 1.0.1 con typecheck rotto→BTLT include TYPECHECK non solo test
  >fix::null-guard×3{spec}+_key{vm-manager.ts:386,param posizionale non dead code}+rm import unused+as string×2;NO suppression
  >TS6133:386 era solo IDE/LSP{nx typecheck non lo segnala}→fixato comunque
  >integration.spec.ts::richiede MongoDB→avviato docker compose{docker/docker-compose.yml,prontuari-mongo:27017}→passa 259ms{file non toccato,no .skip}
  >result::typecheck 0/0,test vm 698✓+mcp-server 87✓
>block02-verdict-inline DONE✓{RED→GREEN→VERIFY→CROSSCHECK passed}
  >planexecutor.ts::terminatori terse{:17-18 Submit ONLY one word}+parser inline minimal su STEP loop{:91,93,110}+TDDAB loop{:149,151,168}→v.toLowerCase().startsWith("passed");while(!passed)
  >no ===,no split/trim/includes,no helper{solo main}→grep confermato
  >test::6 nuovi in planexecutor.spec.ts{:346-373}+helper runVerdict{pulisce uplan-progress per isolamento}→mcp-server 93 verdi
  >BTLT::build 7 proj✓+typecheck 0+test 698+93;planexecutor copiato in dist con nuova logica
>block03-fix-crosscheck-reverify DONE✓{RED→GREEN→VERIFY→CROSSCHECK passed}
  >bug :209{RE-VERIFY post-crosscheck ritorno scartato}→FIXED:ccResult assegnato+ccPassed+while(!ccPassed) loop{stesso parser minimal}
  >test::3 in planexecutor.spec.ts{:381,387,396}→cross-check fail+RE-VERIFY failed→2 FIX{discriminante};pass path invariato
  >BTLT::build 7 proj+typecheck 0+vm 698+mcp-server 96
  >e2e::run-all-tests.sh 64/64✓{tutti 11-tddab inclusi}→behavior holds
  >NOTA::run-category.sh falliva{legge risposte non-secche da file→gate stretto le rifiuta}→runner obsoleto non planexecutor;run-all-tests.sh=autorità,verde
@04-DONE::tutti 3 blocchi completati→pronto per close/merge+benchmark validation

[PLAN-READY]
@plan::tasks/04-verdict-gate-contract/plan.md→parsePlan valid✓{3 blocks}+j-review-plan APPROVED{fix:added Execution Order+header+### Implementation reference code per block}
@blocks::01-clean-main{vm-manager.ts:386 TS6133+integration.spec.ts timeout→0/0}→02-verdict-inline{toLowerCase+startsWith minimal su G1-G5+terminatori secchi}→03-fix-crosscheck-reverify{bug :205 ritorno scartato→wire nel fix loop}
@formatNote::parser tddab-parser.ts vuole<block id="NN-kebab">{no title attr}+## TDDAB-N: title+<red>"- test:"+<success>"- [ ]"
@userChoice::pulizia main STESSO refactor+piano TDDAB dogfooding{eseguire via planexecutor}
@nextStep::eseguire piano{tocca codice→serve ACT};dogfooding usa planexecutor VECCHIO{contratto attuale},refactor lo aggiorna
@vmStringMethods::split/trim/toLowerCase/startsWith/includes✓{strings.ts}
@gates::G1 VERIFY PHASE block:136,G2 RE-VERIFY block:158,G3 RE-VERIFY post-crosscheck:205{BUG ritorno scartato→fix},G4 VERIFY step:83,G5 RE-VERIFY step:102,G6 Review runner:49
@workSplit::
- ME{executor}::verdict()condivisa+apply G1-G6+fixBugG3+nuovo submitTest+parsePlan enforce tipo+unità(FAIL#2)
- ai-agent-builder{skill/mindset}::verdetto-prima-riga in j-review-plan+VERIFY skill;tddab-planner obbliga tipo+unità in success criteria
@outOfScope::watchdog resume(FAIL#1 morte silenziosa submitTask-as-text)→rischio residuo accettato;status awaitingSince/lastCCPrompt parcheggiato
@bench::6run{4pass/2fail}→FAIL1 cliffy-run2{submitTask emesso come testo→end_turn→executor bloccato blocco1},FAIL2 prometheus{float0.001 vs int64 ms→test RED self-authored su spec ambigua}

[LAST-COMPLETED]
@feature::03-submitTask-guard{2026-06-01}
@branch::feature/03-submitTask-guard→merged✓main
@issue::#9→fixed✓
@guard::vm-manager.ts:221{throwIf state≠AWAITING_COGNITIVE_RESULT}
@tests::vm-manager-submit-guard.spec.ts{5tests allPass}
@e2e::64/64 pass
@commit::8c42e80{feat: add state guard to reportCCResult (fixes #9)}
@release::cvm-server@1.0.1{npm publish pending→user OTP}
@note::1.0.0 blocked on npm registry→bumped to 1.0.1

[LAST-COMPLETED]
@feature::03-submitTask-guard{2026-06-01}
@branch::feature/03-submitTask-guard→merged✓main
@issue::#9→fixed✓
@guard::vm-manager.ts:221{throwIf state≠AWAITING_COGNITIVE_RESULT}
@tests::vm-manager-submit-guard.spec.ts{5tests allPass}
@e2e::64/64 pass
@commit::8c42e80{feat: add state guard to reportCCResult (fixes #9)}
@release::cvm-server@1.0.1{npm publish pending→user OTP}
@note::1.0.0 blocked on npm registry→bumped to 1.0.1
