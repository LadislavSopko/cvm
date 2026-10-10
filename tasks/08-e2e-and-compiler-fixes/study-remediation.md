# Studio di risanamento — CVM (feature 08)

**Data:** 2026-10-10 · **Base:** `tasks/audit-cvm-2026-10-09.md` · **Branch:** `feature/08-e2e-and-compiler-fixes`
**Obiettivo:** un unico piano diviso in tre macro-blocchi — **A correttezza**, **B semplificazione**, **C modernità e infrastruttura** — da eseguire in questa feature.

**Regola di chiusura dei bug:** ogni bug ha già un test `it.fails` in `packages/*/src/lib/audit-repro.spec.ts`. Il blocco che lo corregge trasforma quel test in `it` (RED → GREEN): un bug è chiuso solo quando il suo test, da `it` normale, passa.

Stato dei test di riproduzione oggi (rieseguiti il 2026-10-10): parser 2 `it.fails`, vm 6 `it.fails` + 1 controllo, mcp-server 3 `it.fails` + 1 controllo → **11 bug dimostrati**. Il bug B3 (`let = 5;`) è stato **ritirato**: è JavaScript valido (TypeScript stesso dà 0 diagnostiche).

---

## A — Correttezza (prima, rischio basso)

| # | Bug (test) | Causa verificata | Opzioni | Raccomandazione | Sforzo |
|---|---|---|---|---|---|
| A1 | Codice sintatticamente sbagliato accettato — B1, B2 (`parser/audit-repro`) | `compiler.ts:43` e `parser.ts:21` creano il `SourceFile` e non leggono mai le diagnostiche di parse | (a) `sourceFile.parseDiagnostics` — API **interna** di TS, nessun costo extra; (b) `ts.transpileModule(src, { reportDiagnostics: true })` — API **pubblica**, ~3 ms per programma (misurato) | (b) API pubblica, e **eliminare `parser.ts`** spostando in `compile()` i suoi 3 controlli (main presente, main senza parametri, funzioni proibite): il secondo passaggio sparisce, quindi il costo netto è circa zero | S |
| A2 | `x === undefined` sempre falso — B7, B8 (`vm/audit-repro`) | `createCVMUndefined()` (`cvm-value.ts:146`) restituisce **un oggetto nuovo ogni volta**; `EQ_STRICT` confronta con `left === right` (`comparison.ts:158`), quindi due `undefined` non sono mai uguali | (a) `undefined` diventa un **singleton** (`CVM_UNDEFINED`) restituito sempre dallo stesso helper; (b) `EQ`/`NEQ`/`EQ_STRICT`/`NEQ_STRICT` trattano due `CVMUndefined` come uguali | (a) singleton **più** (b) come rete di sicurezza: gli stati serializzati e poi deserializzati non conservano l'identità degli oggetti | S |
| A3 | Titolo vuoto nei piani a step — B10 (`mcp-server/audit-repro`) | `tddab-parser.ts:138` riconosce solo `^##\s+TDDAB-\d+:` | accettare anche `## Step N:` (formato prescritto da `step-planner.md`) | regex `^##\s+(?:TDDAB|Step)-?\s*\d+:\s+(.+)` + test sul commit message del planexecutor | S |
| A4 | Token di conferma inventato accettato — B11 ×2 (`mcp-server/audit-repro`) | `mcp-server.ts:445` genera il token ma non lo salva; `:461` e `:540` accettano qualunque `delete-<id>-*` | (a) nonce vero: mappa in memoria token→(id, scadenza), monouso; (b) togliere la cerimonia: parametro `confirm: true` | (b) — il token oggi non protegge nulla, e un agente che ha già deciso di cancellare passerebbe comunque `confirm: true`. Più semplice, nessuno stato in più. Se si vuole una protezione reale: (a) | S |
| A5 | Limiti `CVM_MAX_*` senza effetto — B9 (`vm/audit-repro`) | `config.ts:45-60` li calcola, `Config.execution` non è mai letto (LSAI: solo `:18` e `:57`) | **(a) Applicarli** · **(b) Toglierli** — vedi confronto sotto | **DECISIONE TUA** | (a) M · (b) S |

### Confronto A5 — limiti di esecuzione

| | (a) Applicarli | (b) Toglierli |
|---|---|---|
| Cosa | la VM conta le istruzioni eseguite per ogni `execute()` (budget), controlla la dimensione dello stack e quella dell'output; superato il limite → `status: 'error'` con messaggio chiaro | rimuovere `execution` da `Config`, le variabili `CVM_MAX_*` da README/.env.example, e il test B9 diventa un test che documenta l'assenza |
| Dove | `vm.ts:91` (ciclo principale), passaggio della config: app → `CVMMcpServer` → `VMManager` → `VM` (oggi nessuno di questi riceve la config: `main.ts:59` crea `CVMMcpServer(version)`) | `apps/cvm-server/src/config.ts`, README, `.env.example` |
| Beneficio | protezione da cicli infiniti: il ciclo principale (`vm.ts:91`) non ha nessun budget, quindi un `while (true)` senza `CC()` non verrebbe mai interrotto (deduzione dal codice, non provata con un test: un test che si blocca non è eseguibile) | nessuna promessa finta, codice più piccolo |
| Costo/rischio | M: tocca VM, VMManager, mcp-server e app; il budget di istruzioni va scelto bene (un piano grande non deve fermarsi). `maxExecutionTime` in un ciclo sincrono va controllato a campione (ogni N istruzioni), non a ogni istruzione | S, nessun rischio |
| Interazione con B | (a) richiede l'oggetto config unico di B4 — andrebbe dopo B4 | indipendente |

---

## B — Semplificazione (risolve anche i bug B4-B6)

| # | Intervento | Evidenza (LSAI) | Effetto | Sforzo/rischio |
|---|---|---|---|---|
| B1 | **Dispatch dei metodi con tabella** + scelta in base al tipo del destinatario **a runtime** | `call-expression.ts` ~25 rami uguali (`:104-366`); bug B4-B6 (`arr.includes`, `arr.indexOf`, `arr.toString`) | ~250 righe → ~60; i metodi omonimi stringa/array funzionano: gli handler `STRING_INCLUDES`/`STRING_INDEXOF`/`TO_STRING` delegano alla logica array (`ARRAY_INDEX_OF` esiste già, `arrays.ts:499`) quando il destinatario è un array | M / medio: tocca il cuore del compilatore, ma ogni metodo ha già test e la suite e2e è affidabile |
| B2 | `STRING_SLICE` riusa `ARRAY_SLICE` (duplicato introdotto da me nel blocco 03) | `arrays.ts:409` vs `advanced.ts:355` | una sola implementazione | S |
| B3 | Helper `runtimeError(state, instruction, msg)`; togliere `safePop` (la VM già controlla `stackIn` in `validateStack`, `vm.ts:64-73`) | 91 oggetti errore scritti a mano; 40 chiamate `safePop` in 7 file | ~400 righe in meno, uno stile solo | M / basso (meccanico, coperto da 725 test VM) |
| B4 | Un solo oggetto di configurazione, creato dall'app e passato giù | `process.env` letto in 5 punti (`config.ts`, `storage-factory.ts:17,20`, `mcp-server.ts:704`, `logger.ts:13-14`, `file-system.ts:31-32`) | niente più derive di configurazione; prerequisito di A5(a) | M / basso |
| B5 | Stato VM → esecuzione in un'unica funzione | duplicazione `vm-manager.ts:153-185` e `:260-285`; commento falso "READ-ONLY" `:112` | ~30 righe in meno, commento corretto | S |
| B6 | Codice morto | 15 opcode mai emessi (LSAI); `CALL` (`control.ts:150`), `GET`/`SET` (`unified.ts`), `JUMP_IF`, `DUP2`, `*_PROP`; `arraysHandlers` alias; `getCurrentContext`; `iterVariable`; config porta commentata; `static/` (4,6 MB), `graph.html`, `counter.ts`, `benchmark/`, `test/programs/archive/` | meno codice, meno test da mantenere | S / basso — per gli opcode morti si eliminano anche i loro test (sono test di codice irraggiungibile) |
| B7 | Un solo log trace per istruzione, con controllo del livello | `vm.ts:93` e `:102` | meno lavoro nel ciclo più caldo | S |
| B8 | Wrapper comune per gli errori delle tool MCP + risoluzione dell'id corrente | 14 `catch` uguali; `currentId` ×6 (`mcp-server.ts:202…382`) | ~120 righe in meno | S — si fa insieme a C2 |

---

## C — Modernità e infrastruttura (ultima, rischio più alto)

| # | Intervento | Opzioni | Raccomandazione | Sforzo/rischio |
|---|---|---|---|---|
| C1 | **CI** | GitHub Actions | workflow su push/PR: `npm ci`, build, typecheck **senza cache**, test, e2e `run-all-tests.sh` (ora affidabile) | S / basso |
| C2 | Tool MCP con `registerTool` (tutti gli overload `server.tool()` sono `@deprecated` nella 1.32) | — | migrare le 15 tool aggiungendo **descrizioni** (oggi gli agenti non ne vedono nessuna) | M / basso |
| C3 | **Lint** | eslint (flat config) · biome | **DECISIONE TUA**: eslint è lo standard Nx; biome è più veloce e un solo tool | S |
| C4 | **Node** | 20 LTS · 22 LTS (entrambi già installati con nvm) | **DECISIONE TUA** — raccomando 22 (supporto più lungo; LSAI usa già 22.15); `engines` ≥ 20 | S / medio (va verificato tutto il toolchain) |
| C5 | Toolchain (TS 5.8→7, Nx 21→23, Vitest 3→5, Vite 6→8, zod 3→4, pino 9→10) | tutto insieme · a passi | **a passi**, un aggiornamento per blocco, suite completa dopo ognuno; probabilmente va **separato in una feature a sé**: è il punto con più rischio e meno legato ai bug | L / alto |
| C6 | SDK MCP v2 (pacchetti separati, specifica 2026-07-28, richiede Node ≥20) | migrare ora · rimandare | **DECISIONE TUA** — raccomando di rimandare dopo C4/C5: la 1.32 è supportata, la v2 cambia il protocollo | L / alto |

---

## Decisioni prese (2026-10-10)

1. **A5 limiti:** solo **budget di istruzioni tra due `CC()`** (protezione dai cicli infiniti senza `CC()`); tolti i limiti su stack, output e tempo.
2. **A4 token:** **conferma vera in due passi** (token monouso con scadenza, salvato dal server).
3. **C3 lint:** eslint. **C4 Node:** 22.
4. **C5 + C6:** toolchain e SDK MCP v2 in una **feature separata**.
5. **A2:** il singleton di `undefined` non serve (YAGNI): basta il confronto strutturale in `===`/`!==`, perché `==` lo gestisce già (`comparison.ts:29-33`).

Piano: `tasks/08-e2e-and-compiler-fixes/remediation/` (index.md + a-correctness.md, b-simplification.md, c-modernity.md), 17 blocchi TDDAB, 73 test RED, parsePlan valido.

## Decisioni che servivano prima di scrivere il piano

1. **A5 limiti:** applicarli (a) o toglierli (b)?
2. **A4 token:** `confirm: true` (raccomandato) o nonce vero?
3. **C3 lint:** eslint o biome?
4. **C4 Node:** 20 o 22?
5. **C5 + C6:** toolchain e SDK v2 dentro questo piano, oppure in una feature separata (raccomandato)?

## Forma del piano (dopo le decisioni)

Un unico file `plan-remediation.md` (multi-file: `index.md` + `a-correctness.md`, `b-simplify.md`, `c-modernity.md`) con blocchi TDDAB. Ordine di dipendenza: **A1-A4 → B (B4 prima di A5a) → A5 → C**. Le parti senza test unitari (CI, lint, rimozione file generati) vanno in blocchi con test verificabili (es. la CI viene provata eseguendo il workflow localmente con gli stessi comandi) oppure in un piano a step separato, perché un piano misto viene classificato tutto come TDDAB.
