# Feature: 05-cvm-plan-skills

## Requirements (from user)
<!-- Claude writes here what user says during LISTEN -->

- C'è una issue su GitHub collegata a questo tema (da verificare in ANALYZE quale issue esattamente).
- Obiettivo: creare **3 skill universali** come parte di CVM stesso, per chi NON usa il setup ai-agent completo:
  1. Skill per la **creazione del piano TDDAB**
  2. Skill per la **review del piano**
  3. Skill per **eseguire il piano con CVM** (execute plan)
- Motivazione: l'ai-agent è molto dettagliato, ma per un uso generico di CVM "da solo" (standalone) servono skill autonome che permettano di lavorare con CVM direttamente, senza il resto dell'infrastruttura ai-agent.
- Dubbio aperto dell'utente: non è sicuro se/quanto CVM possa funzionare bene da solo in questo modo ("non so").

### Ordine di lavoro richiesto
1. **PRIMA**: fix della issue su GitHub
2. **POI**: deploy del fix
3. **POI**: le 3 skill universali (creazione piano, review piano, execute plan)
4. **INOLTRE**: eseguire anche un **x-audit** (audit architettura/foundations/security)

## Analysis
<!-- Claude writes here findings from ANALYZE -->

### Issue GitHub identificata
- **Issue #10** (aperta 2026-07-02): `parsePlan` ritorna `valid:true` ma scarta in silenzio le righe dentro `<red>` che non iniziano esattamente con `- test:` (es. `- test @local-only:` con tag prima dei due punti). Nel caso reale: 3 test su 9 persi senza alcun warning.
- Preferenza espressa nella issue: **opzione 1 — errore strict**: ogni riga non vuota dentro `<red>`/`<actions>` che non parsa come test/action line deve fallire la validazione con file:line.

### Codice responsabile
- Parser unico: `packages/mcp-server/src/lib/tddab-parser.ts`
  - Loop `<red>`: righe 165-177 — regex `/^-\s*test:\s*(.+)/`, righe non-matching saltate silenziosamente
  - Loop `<actions>`: righe 179-192 — regex `/^-\s*action:\s*(.+)/`, stesso problema
- Consumato da `mcp-server.ts` (handler parsePlan, single-file riga ~579 e multi-file ~653, `deducePlanType`)
- Test esistenti: `tddab-parser.spec.ts`, `mcp-server-parseplan.spec.ts`, `tddab-e2e.spec.ts`
- Spec del formato: `docs/PLAN_FORMAT.md` (CVM-PP v1.0) — da aggiornare: tag DOPO i due punti, righe estranee in `<red>` = errore

### Contesto skills
- Nessuna cartella skill nel repo (`.claude/skills` assente); i j-* skill vivono nel setup ai-agent dell'utente, fuori dal repo CVM
- MB segnalava già pendente: "add-cvm-skills {2generic: generate-plan, validate-plan}" — ora l'utente ne vuole 3 (create, review, execute)
- Base disponibile per le skill: `docs/PLAN_FORMAT.md` (CVM-PP) + tool MCP `parsePlan`/`start`/`getTask`/`submitTask`

### Deploy
- `j-settings.md @deploy-script: none`; il rilascio reale è npm publish (`chore(release): publish` in history)

### x-audit
- Ultimo audit: 2026-06-09 (commit 47e7383). L'utente ne vuole uno nuovo — da eseguire come attività separata (skill /x-audit), non parte del piano TDDAB.

## Research
- **Codebase first**: il parser e i suoi test esistono già; il fix è un'estensione locale del loop di parsing (nessuna libreria esterna necessaria).
- **Skills**: formato skill standard Claude Code (cartella `skills/` o `.claude/skills/` con SKILL.md); per essere "parte di CVM" la scelta naturale è una cartella `skills/` versionata nel repo, documentata nel README, che l'utente copia/linka nel proprio `.claude`. Riusano `docs/PLAN_FORMAT.md` come fonte di verità (DRY: le skill referenziano la spec, non la duplicano).
- Nessuna soluzione esterna da adottare: tutto interno al progetto.

## Proposed Solution
<!-- Claude writes here the proposal from PROPOSE -->

### Parte 1 — Fix issue #10 (strict red/actions parsing)
- In `tddab-parser.ts`: ogni riga non vuota dentro `<red>`/`<actions>` che non matcha `- test:` / `- action:` → errore di validazione con numero riga (opzione 1 della issue)
- TDD: nuovi test in `tddab-parser.spec.ts` (+ verifiche parsePlan spec)
- Aggiornare `docs/PLAN_FORMAT.md`: tag dopo i due punti, `<red>` è contratto strict
- Chiudere issue #10, poi deploy = npm publish

### Parte 2 — 3 skill universali versionate in `skills/` nel repo
1. `cvm-plan-create` — creazione piano TDDAB conforme CVM-PP
2. `cvm-plan-review` — review conformità piano (usa parsePlan)
3. `cvm-plan-execute` — esecuzione via planexecutor (parsePlan → start → getTask/submitTask loop)
- Le skill referenziano docs/PLAN_FORMAT.md (no duplicazione); README aggiornato con istruzioni installazione

### Parte 3 — x-audit
- Eseguito come attività separata con /x-audit dopo fix+skills (fuori dal piano TDDAB)

## Complexity Assessment
| Task | Score | Decisione |
|------|-------|-----------|
| Strict parsing `<red>`/`<actions>` in tddab-parser | 4/10 | 2 subtask: (a) red strict + test, (b) actions strict + test — logica semplice ma è un contratto pubblico, serve copertura edge case (righe vuote, prose, tag prima dei :) |
| Aggiornamento docs/PLAN_FORMAT.md | 2/10 | singolo item (docs, action block) |
| Skill cvm-plan-create | 3/10 | singolo item — contenuto markdown che referenzia la spec |
| Skill cvm-plan-review | 3/10 | singolo item |
| Skill cvm-plan-execute | 3/10 | singolo item |
| README + installazione skills | 2/10 | singolo item |
| Chiusura issue + publish | 2/10 | fuori piano — passi operativi in j-close/deploy |
| x-audit | n/a | attività separata post-feature |

## TDDAB Rules Applied
(scritte dopo lettura integrale di tddab-planner.md + typescript-tddab-overlay.md)

1. **Decomposizione bottom-up per layer/responsabilità**: ogni block copre UNA responsabilità (parser red ≠ parser actions ≠ docs ≠ singola skill), mai un block monolitico per l'intera feature.
2. **RED = contratto d'interfaccia**: le righe `- test:` definiscono COSA deve fare l'unità (input → output/errore atteso), a livello unit del parser, non test E2E dell'intero tool MCP. Devono coprire happy path, edge case, errori — senza limiti fissi di numero.
3. **Block auto-sufficiente**: intro + mission bastano per eseguire il block su contesto pulito — path completi dei file, comandi (npx nx test mcp-server), decisioni già prese, zero riferimenti a "come discusso". Il codice di riferimento mostra tipi/firme/logica chiave, non serve boilerplate perfetto (ci pensa j-develop).
4. **Atomico e reversibile**: ogni block deployabile da solo e revertibile con git revert; setup non testabile (es. creazione cartella skills/) si fonde nel primo block che lo usa, mai block "preparazione" separati.
5. **Il piano è una ricetta**: nessuna opzione, nessun TODO, nessun "investigare"; lavoro non-testabile (docs, contenuti skill) usa blocchi actions con righe `- action:`; il piano chiude con Execution Order. Mai scrivere nomi di tag con parentesi angolari dentro il contenuto dei tag.

## Status
- [x] Requirements gathered
- [x] Code analyzed
- [x] Solution proposed (auto-avanzato: utente AFK, proposta = preferenza espressa nella issue #10; da riconfermare al review del piano)
- [x] Plan created (plan.md, 7 blocchi; self-review j-review-plan passata: parsePlan valid, redKeys 19/19, fix rule-10 applicato agli snippet)
- [x] Development done (7/7 blocchi via j-cvm-exec-plan, commits 31f4821..da069fe)
- [x] Tested (mcp-server 108/108 green; build 7 progetti OK, zero warning)
- [ ] Deployed (@deploy-script: none — nessun deploy applicabile)
