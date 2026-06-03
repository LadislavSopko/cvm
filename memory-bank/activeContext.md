§MBEL:5.0

[FOCUS]
@state::IDLE
@date::2026-06-03

[LAST-COMPLETED]
@feature::04-verdict-gate-contract{2026-06-02}
@branch::feature/04-verdict-gate-contract→merged✓main
@release::cvm-server@1.1.0 LIVE on npmjs{published 2026-06-03}
@confirmedByUse::human confirms 1.1.0 working in real use→benchmark formale non urgente

[CONTRACT-VERDICT-GATE]{agreed room"cvm" w/ai-agent-builder+human 2026-06-02}
@parser::MINIMAL inline→var v=resp.toLowerCase();var passed=v.startsWith("passed");while(!passed)
>2 op solo{toLowerCase+startsWith};NO split/trim/includes;NO ===;NO function{VM limit};bias→failed
@submit::SECCO→solo token{passed|failed|done};ragionamento nel turno NON nel submit
@policy0/0::vive lato skill SCOPED al toolchain reale{NO enforcement nell'executor}
@noCapNoAbort::human veto
@ownership::planexecutor.ts=cvm;benchmark-runner.ts+4 skill=ai-agent-builder{parser 1:1}

[CRITICAL-VM-LIMIT]
@noUserFunctions::CVM supporta SOLO main(){control.ts:158};logica INLINE obbligatoria
@futureCandidate::05-vm-functions

[MBEL-DISCUSSION]{2026-06-03 room"cvm" w/ai-agent-builder+ai-skills-user+human}
Verdetto unanime a 3, misurato con 3 misure indipendenti (tiktoken cl100k):
- MB reale prosa→MBEL = ~40% token risparmiati (6774→3600-4400). REALE e utile.
- MA il merito è DISCIPLINA (terseness+dedup), NON gli operatori. Encoding puro ≈ +14-21% peggiore.
- Prova: stesso encoding MBEL, 3 numeri diversi (-34/-40/-47) = conta quanto stringi, non il formato.
- MBEL valore VERO = struttura + triage + marcatori + PROTOCOLLO DI POTATURA (overwrite¬append/completed→history/clears-on-new-task/archive-EOD).
- Claim onesto per README pubblico: niente "75%/100%". Token ~come inglese-terso; valore = disciplina encoding-indipendente.
- Bet futuro: se modelli imparano MBEL (training+tokenizer) → decode sparisce + token diventano efficienti → encoding diventa win. Repo pubblico = seed.
@repo::https://github.com/0ics-srls/memory-bank{PUBLIC,MIT,credito Cline}
@npmRegistry::nexus.0ics.ai è cache→stale;npmjs.org diretto è l'autorità{per cvm-server}

[PREV-COMPLETED]
@03-submitTask-guard{2026-06-01}→merged main+released cvm-server@1.0.1{vm-manager.ts:221 state guard,issue #9}
