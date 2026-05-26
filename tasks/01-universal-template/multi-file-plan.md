# Multi-File Plan Support for parsePlan

**Data:** 2026-05-26
**Stato:** ANALISI — da ragionare

## Problema

parsePlan accetta un singolo `filePath`. Scenario reale: piani TDDAB grandi vengono divisi in più file .md (es. `plan-core.md`, `plan-api.md`, `plan-ui.md`). Oggi non c'è modo di parsarli insieme in un unico `uplan.json`.

## Obiettivo

`parsePlan` accetta un array di file → produce un unico `uplan.json` con blocchi da tutti i file, ognuno con riferimenti corretti al proprio file sorgente e righe.

## Analisi del codice attuale

### tddab-parser.ts
- `parseTddabPlan(markdown, sourceFile)` → `ParseResult { valid, plan, errors }`
- `TddabPlan { mission, blocks[], sourceFile }`
- `TddabBlock { id, title, intro, redTests[], success[], startLine, endLine }`
- **Problema**: `<mission>` è OBBLIGATORIA — se manca → `valid: false, plan: null`
- Line numbers (`startLine`/`endLine`) sono relative al file — OK per multi-file

### mcp-server.ts (parsePlan tool, riga 523)
- Schema: `{ filePath: z.string() }` — singolo file
- Legge file, chiama `parseTddabPlan`, costruisce `uplanData`
- `planRef` per blocco: `` `See ${plan.sourceFile} lines ${b.startLine}-${b.endLine}` ``
- Scrive `uplan.json` in `.cvm/`

### planexecutor.ts (riga 6-14)
- Legge `data.sourceFile` (stringa) per display
- Ogni blocco ha `block.planRef` che punta già al file+righe corretto
- Il loop usa solo `block.planRef`, non `sourceFile` globale

## Punti critici da ragionare

### 1. Mission — dove sta?
- Solo il primo file deve avere `<mission>`
- I file successivi hanno solo `<block>` (blocks-only)
- Il parser attuale fallisce se `<mission>` manca
- **Serve**: rendere `<mission>` opzionale nel parser

### 2. Ordine dei blocchi cross-file
- I blocchi vengono uniti nell'ordine: tutti da file1, poi tutti da file2, ecc.
- Gli ID blocco (formato `NN-kebab`) definiscono l'ordine logico
- **Domanda**: serve ordinare per ID numerico dopo il merge, o basta l'ordine dei file?
  - PRO ordinamento: l'utente può distribuire blocchi liberamente tra file
  - PRO ordine file: più prevedibile, l'utente controlla l'ordine tramite l'ordine dei file nell'array
  - **Proposta**: ordine dei file (semplice), eventualmente ordinamento per ID in futuro

### 3. Validazione cross-file
- ID duplicati: un blocco in file1 e file2 con stesso ID → errore
- Mission duplicata: `<mission>` in più file → usare solo la prima? errore?
  - **Proposta**: usare la prima, ignorare le successive (warning in console)

### 4. Formato uplan.json — backward compatibility
- `sourceFile` oggi è stringa → i consumer esistenti la leggono
- **Proposta**: 
  - `sourceFile` → resta, punta al primo file (backward compat)
  - `sourceFiles` → nuovo campo array con tutti i file
  - `planRef` per blocco → già corretto, punta al file specifico

### 5. Errori — come riportarli
- Se file2 ha errori di parsing, si ferma tutto o si salta?
- **Proposta**: qualsiasi errore in qualsiasi file → fallimento totale con errori prefissati dal nome file
  - Es. `plan-api.md line 5: Block "03-api" missing <red> tag`

## Proposta implementativa

### Cambiamento 1: tddab-parser.ts (MINIMO)
```typescript
// Aggiungere options parameter
export function parseTddabPlan(
  markdown: string, 
  sourceFile: string, 
  options?: { requireMission?: boolean }
): ParseResult
```
- Default `requireMission: true` (backward compat totale)
- Con `false`: nessun errore se `<mission>` manca, ritorna mission vuota

### Cambiamento 2: mcp-server.ts (parsePlan tool)
```typescript
// Schema
{ filePath: z.union([z.string(), z.array(z.string())]) }

// Logica
1. Normalizza in array
2. File[0] → parseTddabPlan(md, file, { requireMission: true })
3. File[1+] → parseTddabPlan(md, file, { requireMission: false })
4. Valida no ID duplicati cross-file
5. Merge tutti i blocchi
6. planRef per blocco → usa il sourceFile del parse da cui viene
7. Scrivi uplan.json con sourceFile (primo) + sourceFiles (tutti)
```

### Cambiamento 3: planexecutor.ts (MINIMO)
```typescript
// Riga ~21: già stampa sourceFile, gestire array
var files = data.sourceFiles || [data.sourceFile];
console.log("Plan: " + files.join(", "));
```

### Cambiamento 4: test
- Aggiornare test parser per opzione `requireMission: false`
- Aggiornare test parsePlan MCP per array input
- Creare example multi-file in `test/examples/`

## Test example da creare

```
test/examples/
  plan.md           → <mission> + blocchi 01-02 (core)
  plan-extra.md     → solo blocchi 03-04 (extra features)
```

Chiamata: `parsePlan({ filePath: ["test/examples/plan.md", "test/examples/plan-extra.md"] })`

Risultato atteso in uplan.json:
- mission da plan.md
- 4 blocchi totali
- blocchi 01-02 con planRef → plan.md
- blocchi 03-04 con planRef → plan-extra.md
- sourceFile = "test/examples/plan.md"
- sourceFiles = ["test/examples/plan.md", "test/examples/plan-extra.md"]

## Domande aperte

1. Ordinamento blocchi: per ordine file o per ID numerico?
2. Mission in più file: errore o warning+ignora?
3. Serve un campo `blockCount` per file nel risultato parsePlan?
4. Il skill j-cvm-check-plan deve supportare multi-file?
