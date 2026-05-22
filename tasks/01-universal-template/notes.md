# Feature: 01-universal-template

## Requirements (from user)

### Idea: TDDAB blocks con ID → CVM program generation
- Ogni block TDDAB avrebbe un tag `<block id="xxxx">`
- Un file "indice" elenca tutti i task come riferimenti con nome (come un array)
- Ogni TDDAB plan potrebbe essere trasformato in un file .ts (CVM program)
- Il file .ts generato avrebbe un prompt della missione all'inizio come task list

### Idea: tddab-executor.ts universale
- Un UNICO file `tddab-executor.ts` che è il CVM program esecutore
- Include/riceve la task list generata dal piano TDDAB
- While loop ESTERNO: itera sull'array dei task/blocchi
  - Man mano che un blocco è completato, lo segna come fatto
- While loop INTERNO (per ogni blocco):
  - Prima fa la parte RED del blocco (scrivi test che fallisce)
  - Poi sviluppa il codice (GREEN)
  - Testa tutto
  - Se il blocco va bene → committa e chiude il blocco
- In pratica: nested while loops dove l'esterno gestisce i blocchi e l'interno gestisce il ciclo RED→GREEN→VERIFY→COMMIT per ogni blocco

### Dettaglio: while interno è un loop di retry
- Il while interno NON è single-pass — è un loop perché:
  - Finché TUTTI i test non passano, deve continuare a loopare
  - Tiene Claude in esecuzione dei test in modo persistente
- Quando i test falliscono:
  - Ritorna al CC() con il risultato dei test falliti
  - Il CC() riporta Claude a fixare i test
  - In quel caso deve attivare Protocol D (debugging sistematico)
- Ciclo interno: TEST → falliscono? → CC("fix these failures + Protocol D") → Claude fixa → TEST di nuovo → passano? → esci dal loop → COMMIT

### Chiarimenti dal brainstorming

**Generazione task list:**
- TDDAB plan.md scritto con pochi tag XML (2-3, non full XML — LLM andrebbe male)
- Nuovo MCP tool del CVM parsa il markdown e genera l'array con riferimenti perfetti (inizio→fine blocco)
- I tag servono per trovare info speciali: es. `<red>` test definitions, `<intro>`, `<success>` criteria
- Quando CC() fa il prompt dice: "hai da fare blocco XY, che è nel file da riga A a riga B" + mission prompt + spiegazioni

**Universalità:**
- CVM NON esegue nulla — è un prompt orchestrator puro
- CC() dice a Claude cosa fare, Claude sa come eseguire test/build nel suo linguaggio
- Quindi tddab-executor.ts è UNICO e universale per qualsiasi progetto

**CC() e Protocol D:**
- CC() non vede output, non esegue nulla
- CC() dice semplicemente "rifai i test, se hai problemi usa Protocol D"
- Sarà più esteso nel reale ma il concetto è: istruzione, non esecuzione

**Commit:**
- CC() a fine blocco dice semplicemente "fai commit e push"
- Claude lo fa autonomamente

## Analysis

### CVM Language — tutto il necessario è già supportato
- Arrays, objects, nested while/for loops, if/else, CC(), string concat, JSON.stringify
- ¬arrow functions, ¬async/await, ¬destructuring, ¬template literals

### MCP Server — 13 tool esistenti, pattern chiaro per aggiungerne
- Tool registration in `packages/mcp-server/src/lib/mcp-server.ts` (setupTools())
- Pattern: `this.server.tool(name, zodSchema, handler)` → delega a VMManager
- Serve nuovo tool: `parse_tddab_plan` che parsa markdown → genera array blocchi

### TDDAB Plan attuale — formato non strutturato
- Formato attuale: `## TDDAB-N: [Name]` con sezioni Goal/Implementation/Test/Validation
- Nessun tag XML, nessun ID, nessun parser automatico
- Serve: aggiungere 2-3 tag leggeri per delimitare blocchi e info chiave

### Programmi CVM esistenti — buoni esempi di pattern
- `test/programs/04-data-structures/` → array + objects + push
- `test/programs/03-control-flow/` → nested loops + break/continue
- `test/programs/07-cc-integration/` → CC() con variabili e oggetti

### Cosa manca
1. Formato TDDAB strutturato con tag (block id, red, success)
2. MCP tool per parsare TDDAB plan → array di blocchi con riferimenti precisi
3. Template CVM `tddab-executor.ts` universale con nested while loops
4. Integrazione Protocol D nel prompt CC() per test failures

## Proposed Solution
<!-- Claude writes here the proposal from PROPOSE -->

## Status
- [x] Requirements gathered
- [x] Code analyzed
- [x] Solution proposed
- [x] Plan created
- [ ] Development done
- [ ] Tested
- [ ] Deployed
