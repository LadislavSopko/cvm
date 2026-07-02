# Feature: 06-drop-mongodb

## Requirements (from user)
- Deprecare/rimuovere **completamente** lo storage MongoDB da CVM. Solo file storage resta.
- **Hard removal** → breaking change → **v2.0.0**. Se `CVM_STORAGE_TYPE=mongodb` → errore chiaro allo startup.
- Rimuovere: `packages/mongodb`, `mongodb-adapter`, dipendenze `mongodb`, config `MONGODB_URI`, docker mongo.
- Extra quick-win audit inclusi:
  - `packages/types` senza dep `mongodb` (core più vicino a zero-dep, foundation #10). NB: `pino` resta (logger vive in types → refactor separato #11).
  - Pulizia `Config.storage` in `apps/cvm-server/src/config.ts` (via `mongoUri` + validazione mongo).
- Riferimento: `tasks/audit-cvm-2026-07-02.md`

## Analysis
Blast radius mappato (LSAI usages + grep scoped, escluso dist/out-tsc/node_modules).

**Codice morto confermato:**
- `packages/mongodb/` → nessun `import '@cvm/mongodb'` in alcun src (solo la sua spec). Duplicato standalone di MongoDBAdapter. DELETE intero.
- `packages/types` dep `mongodb ^6.3.0` → **fantasma** (nessun import in types/src). REMOVE dep.
- `packages/mcp-server` dep `@cvm/mongodb ^0.0.1` → verso il pacchetto morto. REMOVE dep.

**Adapter vivo:** `packages/storage/src/lib/mongodb-adapter.ts` (`implements StorageAdapter`), cablato in `storage-factory.ts:32` (case 'mongodb'), esportato da `storage/index.ts`.

**Consumatori da modificare:**
| File | Azione |
|---|---|
| `packages/storage/src/lib/mongodb-adapter.ts` + `.spec.ts` | DELETE |
| `packages/storage/src/lib/storage-factory.ts` | rimuovi import+case 'mongodb'; `type==='mongodb'` → errore chiaro; togli `mongoUri` da StorageConfig |
| `packages/storage/src/lib/storage-factory.spec.ts` | rimuovi test mongodb; aggiungi test "mongodb type → throws" |
| `packages/storage/src/index.ts` | rimuovi export mongodb-adapter |
| `packages/storage/package.json` | rimuovi dep `mongodb` |
| `packages/vm/src/lib/integration.spec.ts` | usa MongoDBAdapter → converti a FileStorageAdapter o DELETE |
| `packages/vm/src/lib/vm-manager.integration.spec.ts` | verificare uso mongo |
| `apps/cvm-server/src/config.ts` | rimuovi `mongoUri` + validazione mongo; semplifica `Config.storage` |
| `apps/cvm-server/src/main.ts:53-60` | rimuovi branch mongodb (else) |
| `apps/cvm-server/package.json` | rimuovi dep `mongodb`; bump → 2.0.0 |
| `tsconfig.json:14` | rimuovi ref `./packages/mongodb` |
| `docker/docker-compose.yml` + `docker/init-mongo/` | rimuovi servizio mongo (o intera dir) |
| READMEs (storage, cvm-server), MB techContext, `.env` | aggiorna: no MONGODB_URI, no CVM_STORAGE_TYPE=mongodb |
| CHANGELOG | voce breaking v2.0.0 |

**Breaking contract:** `CVM_STORAGE_TYPE=mongodb` non più supportato → errore esplicito allo startup che indirizza a file storage.

## Research
Nessuna libreria nuova. Codebase-first: `FileStorageAdapter` esiste già ed è il default zero-setup (`storage-factory.ts:22`). È una rimozione pura, non serve ricerca esterna.

## Proposed Solution
1. **Rimozione pacchetto morto** — elimina `packages/mongodb/` + ref in `tsconfig.json`/nx/workspace.
2. **storage senza mongo** — elimina `mongodb-adapter.ts`(+spec); `storage-factory` supporta solo 'file', `type==='mongodb'` → `throw` con messaggio chiaro (breaking guard); `StorageConfig` senza `mongoUri`; `index.ts` senza export mongo; `package.json` senza dep mongodb.
3. **config/app puliti** — `Config.storage` senza `mongoUri` e senza validazione mongo; `main.ts` senza branch mongodb; `apps/cvm-server/package.json` senza dep mongodb, versione → **2.0.0**.
4. **types quasi-zero-dep** — rimuovi dep fantasma `mongodb` (pino resta: logger vive qui, refactor separato).
5. **mcp-server** — rimuovi dep `@cvm/mongodb`.
6. **test** — converti/elimina le integration spec basate su mongo; nuovo test "mongodb type throws".
7. **docker/docs** — rimuovi servizio mongo, `init-mongo/`; aggiorna READMEs, MB techContext, `.env`; CHANGELOG breaking.
8. **verifica** — BTLT: `nx run-many build` + `test` verdi su tutti i package.

## Complexity Assessment
Decisione: integration spec vm → **A) convertire a FileStorageAdapter**.

| Task | Score (1-10) | Note |
|---|---|---|
| Convertire vm integration spec a FileStorageAdapter | 3 | meccanico, swap adapter + tmp dataDir |
| storage-factory file-only + guard mongodb→throw | 4 | delete file, edit factory, riscrivi spec |
| app config/main cleanup + version 2.0.0 + spec config | 3 | + nuovo config.spec (audit #13) |
| delete packages/mongodb + phantom deps + tsconfig/nx | 3 | cancellazione + rimozione ref |
| docker/docs/CHANGELOG/.env | 2 | non-testabile, blocco finale wiring/docs |

Tutti 2-4 → blocchi singoli, nessuna espansione pesante. 5 blocchi, piano single-file.

## TDDAB Rules Applied
Regole chiave che seguirò (dalla lettura di tddab-planner.md + typescript-overlay):
1. **Decomposizione bottom-up per layer, ma orientata alla rimozione**: rimuovo prima l'unico consumer esterno di `MongoDBAdapter` (vm integration spec), poi lo storage, poi app, poi il pacchetto morto, infine docs/docker. Ogni blocco lascia il sistema **buildabile e verde** (atomico + `git revert`-abile).
2. **RED = contratto del blocco**, non E2E. Es. blocco storage: `StorageFactory.create({type:'mongodb'})` → throw con messaggio chiaro; `create({type:'file'})` → `FileStorageAdapter`. Non testo lo stack intero.
3. **Niente blocchi "setup/preparation" separati**: rimozione deps, cancellazione file e cambi config sono **dentro l'implementazione** del blocco pertinente.
4. **Self-sufficiency**: ogni blocco ha path assoluti completi e reference code TS con firme/asserzioni; la `mission` contiene stack, comandi (`npx nx test <pkg>`), convenzioni `.js`-import.
5. **Blocchi di sola cancellazione** (pacchetto morto, docs/docker): sono cleanup verificati da **build/typecheck verde + negative-grep** nel success, non da unit test comportamentali (natura della rimozione). Ammesso come blocco finale di wiring/decomposition-step 5.

## Status
- [x] Requirements gathered
- [x] Code analyzed
- [x] Solution proposed
- [x] Plan created (j-review-plan: APPROVED; parsePlan valid; 21/21 redKeys match)
- [ ] Development done
- [ ] Tested
- [ ] Deployed
