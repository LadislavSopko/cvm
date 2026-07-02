# TDDAB Plan: Drop MongoDB Storage (v2.0.0)
**Date:** 2026-07-02

<mission>
## Project: CVM (Cognitive Virtual Machine)
Custom bytecode VM exposed as an MCP server, published to npm as `cvm-server`. TypeScript Nx monorepo.

### Goal of this feature
**Hard-remove the MongoDB storage backend entirely.** File storage becomes the only backend. This is a BREAKING change → bump `cvm-server` to **2.0.0**. If a user sets `CVM_STORAGE_TYPE=mongodb`, the app must fail fast at storage creation with a clear message pointing to file storage.

### Stack & conventions
- TypeScript 5.8, Node 18.16+, **moduleResolution `nodenext`** → ALL relative imports use `.js` extension even for `.ts` files (e.g. `import { StorageAdapter } from './storage.js'`).
- Nx 21.2 monorepo. Packages under `packages/*`, app under `apps/cvm-server`.
- Tests: **Vitest**. Run per package: `npx nx test <package>` (e.g. `npx nx test storage`). Build all: `npx nx run-many --target=build --all`.
- `strict: true`, no `any` in production code.
- License header on every source file: two comment lines `// SPDX-License-Identifier: AGPL-3.0-or-later` and `// Copyright (C) 2025-2026 Ladislav Sopko`.

### Relevant architecture
- `packages/storage` = the LIVE storage layer. Interface `StorageAdapter` (`packages/storage/src/lib/storage.ts`). Implementations: `FileStorageAdapter` (`file-adapter.ts`) and `MongoDBAdapter` (`mongodb-adapter.ts`). Wired by `StorageFactory.create()` in `storage-factory.ts`. Barrel: `packages/storage/src/index.ts`.
- `FileStorageAdapter` signature: `new FileStorageAdapter(dataDir: string)` then `await adapter.connect()` / `await adapter.disconnect()`; implements `saveProgram/getProgram/saveExecution/...`.
- `packages/mongodb` = a SEPARATE, DEAD package (its own standalone `MongoDBAdapter` in `mongodb.ts`). Confirmed dead: no `import '@cvm/mongodb'` exists in any `src`. Only its own spec references it.
- Phantom deps to drop: `packages/types/package.json` declares `mongodb` but no `types/src` file imports it; `packages/mcp-server/package.json` declares `@cvm/mongodb` (the dead package) but does not import it.
- App wiring: `apps/cvm-server/src/config.ts` `loadConfig()` builds a `Config` object (has `storage.mongoUri` + mongodb validation). `apps/cvm-server/src/main.ts` logs a mongodb branch. The MCP server internally builds its own `VMManager` which calls `StorageFactory.create()` reading `process.env` directly.
- The VM has one MongoDB-based integration spec: `packages/vm/src/lib/integration.spec.ts` (imports `MongoDBAdapter` from `@cvm/storage`). It is the ONLY external consumer of `MongoDBAdapter`.

### Decisions already made (do NOT reopen)
- Hard removal, not a deprecation shim.
- VM integration spec is CONVERTED to `FileStorageAdapter` (not deleted) to keep persistence/resume coverage.
- `pino` stays in `packages/types` (the logger lives there; relocating it is a separate future feature). Only `mongodb` is removed from `types` deps.
- Reference audit: `tasks/audit-cvm-2026-07-02.md`.

### Verification per block
Each block ends GREEN: `npx nx test <touched-package>` passes AND `npx nx run-many --target=build --all` passes. Each block is atomic and independently `git revert`-able.
</mission>

<block id="01-convert-vm-integration-to-file">
## TDDAB-1: Convert VM integration spec from MongoDB to FileStorageAdapter

<intro>
The VM integration spec `packages/vm/src/lib/integration.spec.ts` is the only external consumer of `MongoDBAdapter` from `@cvm/storage`. Convert it to `FileStorageAdapter` using a unique temp data directory, so the later removal of `MongoDBAdapter` does not break the `vm` package. Remove the MongoDB-specific null-normalization step (file storage round-trips `undefined` faithfully). This block touches `packages/vm/src/lib/integration.spec.ts` and (cosmetically) `packages/vm/src/lib/vm-manager.integration.spec.ts`. NOTE on `vm-manager.integration.spec.ts`: it does NOT use `MongoDBAdapter` or a `mongodb://` URI — it uses `new VMManager()`, which relies on `StorageFactory.create()` defaulting to file storage (`.env` sets only `MONGODB_URI`, NOT `CVM_STORAGE_TYPE`, so the default is `'file'`). It stays green after the later mongodb-throw guard. The only mongo reference is the stale comment on line 8 (`// VMManager will use MONGODB_URI from .env file`) — just remove that comment; do NOT swap adapters. Also remove the now-stale `'mongodb'` entry from the rollup `external` array in `packages/vm/vite.config.ts` (mongodb is no longer a runtime dependency of the vm package).
</intro>

<red>
- test: the integration spec imports `FileStorageAdapter` from `@cvm/storage` (no `MongoDBAdapter`, no `mongodb://` URI).
- test: "should parse, store, retrieve and execute a simple program" passes using file storage — retrieved bytecode `toEqual(parseResult.bytecode)` WITHOUT the mongo null→undefined normalization.
- test: "should handle program with cognitive call (CC)" passes: save program+execution, retrieve, execute → `waiting_cc`, resume "Blue" → `complete`, output contains "Nice to meet you, User".
- test: all existing object-support / bytecode-format cases still pass unchanged.
- test: `npx nx test vm` is green with no MongoDB connection required.
</red>

### Implementation
In `packages/vm/src/lib/integration.spec.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FileStorageAdapter } from '@cvm/storage';
import { compile, OpCode } from '@cvm/parser';
import { VM } from './vm.js';
import * as os from 'os';
import * as path from 'path';
import { promises as fs } from 'fs';

describe('Parser-VM-FileStorage Integration', () => {
  let adapter: FileStorageAdapter;
  let vm: VM;
  let dataDir: string;

  beforeAll(async () => {
    // unique temp dir per run; avoid Date.now()/Math.random collisions is fine here (test env)
    dataDir = path.join(os.tmpdir(), `cvm-it-${process.pid}`);
    adapter = new FileStorageAdapter(dataDir);
    await adapter.connect();
    vm = new VM();
  });

  afterAll(async () => {
    await adapter.disconnect();
    await fs.rm(dataDir, { recursive: true, force: true });
  });
  // ...same test bodies, but:
  //  - saveProgram/getProgram/saveExecution now hit FileStorageAdapter
  //  - REMOVE the normalizedBytecode mapping; assert retrieved!.bytecode toEqual parseResult.bytecode directly
});
```
Keep every `it(...)` body identical except the adapter type and the removed null-normalization. Preserve the license header.

<success>
- [ ] `integration.spec.ts` no longer imports `MongoDBAdapter` or uses a `mongodb://` URI (grep clean).
- [ ] `npx nx test vm` passes with zero MongoDB dependency at runtime.
- [ ] `vm-manager.integration.spec.ts`: stale `MONGODB_URI` comment (line 8) removed; no adapter swap (VMManager uses the file-storage default).
- [ ] `packages/vm/vite.config.ts` no longer lists `'mongodb'` in `external`.
- [ ] `npx nx run-many --target=build --all` passes.
</success>
</block>

<block id="02-storage-file-only-guard">
## TDDAB-2: Make StorageFactory file-only; MongoDB type throws

<intro>
Remove MongoDB from `packages/storage`. Delete `mongodb-adapter.ts` and `mongodb-adapter.spec.ts`. Update `storage-factory.ts` so `'file'` is the only real backend and `'mongodb'` (or any unknown) throws a clear, actionable error. Drop `mongoUri` from `StorageConfig`. Remove the `mongodb-adapter` re-export from `index.ts`. Remove the `mongodb` dependency from `packages/storage/package.json` AND the stale `'mongodb'` entry from the rollup `external` array in `packages/storage/vite.config.ts`. Depends on TDDAB-1 (no external consumer of `MongoDBAdapter` remains). Files: `packages/storage/src/lib/storage-factory.ts`, `.../storage-factory.spec.ts`, `.../mongodb-adapter.ts` (delete), `.../mongodb-adapter.spec.ts` (delete), `packages/storage/src/index.ts`, `packages/storage/package.json`.
</intro>

<red>
- test: `StorageFactory.create({ type: 'file', dataDir })` returns a `FileStorageAdapter`.
- test: `StorageFactory.create()` with no config and no env returns a `FileStorageAdapter` (default zero-setup).
- test: `StorageFactory.create({ type: 'mongodb' })` throws an Error whose message mentions that MongoDB is no longer supported and to use file storage.
- test: `StorageFactory.create({ type: 'bogus' as any })` throws the unsupported-type Error.
- test: `StorageConfig` has no `mongoUri` field (type-level; spec compiles without referencing it).
</red>

### Implementation
`packages/storage/src/lib/storage-factory.ts`:
```typescript
import { StorageAdapter } from './storage.js';
import { FileStorageAdapter } from './file-adapter.js';

export type StorageType = 'file';

export interface StorageConfig {
  type?: StorageType;
  dataDir?: string;
}

export class StorageFactory {
  static create(config?: StorageConfig): StorageAdapter {
    const type = config?.type || process.env['CVM_STORAGE_TYPE'] || 'file';

    if (type === 'file') {
      const dataDir = config?.dataDir || process.env['CVM_DATA_DIR'] || '.cvm';
      return new FileStorageAdapter(dataDir);
    }

    if (type === 'mongodb') {
      throw new Error(
        'MongoDB storage was removed in cvm-server v2.0.0. ' +
        'Unset CVM_STORAGE_TYPE (or set it to "file") to use file storage.'
      );
    }

    throw new Error(`Unsupported storage type: ${type}. Only "file" is supported.`);
  }
}
```
`packages/storage/src/index.ts`: remove the `export * from './lib/mongodb-adapter.js';` line. Delete `mongodb-adapter.ts` + `mongodb-adapter.spec.ts`. Remove `"mongodb"` from `packages/storage/package.json` dependencies. Rewrite `storage-factory.spec.ts` to drop the "creates MongoDBAdapter" cases and add the throw cases above (import only `FileStorageAdapter`).

<success>
- [ ] `mongodb-adapter.ts` and `mongodb-adapter.spec.ts` deleted; `index.ts` no longer exports them.
- [ ] `rg -i mongo packages/storage/src` returns nothing.
- [ ] `packages/storage/package.json` has no `mongodb` dependency; `packages/storage/vite.config.ts` no longer lists `'mongodb'` in `external`.
- [ ] `npx nx test storage` passes including the new mongodb-throws tests.
- [ ] `npx nx run-many --target=build --all` passes.
</success>
</block>

<block id="03-app-config-cleanup">
## TDDAB-3: Simplify app config/main, add config spec, bump to 2.0.0

<intro>
Clean the app layer now that only file storage exists. In `apps/cvm-server/src/config.ts`: drop `mongoUri` from `Config.storage` and remove the mongodb-requires-URI validation branch; keep the `CVM_LOG_LEVEL` validation and execution defaults. In `apps/cvm-server/src/main.ts`: remove the mongodb logging branch (the `else` that logs "Using MongoDB storage"), keeping the file-storage log. Remove `"mongodb"` from `apps/cvm-server/package.json` dependencies and bump its `version` to `2.0.0`. Add the first test for the app (`config.spec.ts`) — the deployable currently has zero tests (audit #13). Files: `apps/cvm-server/src/config.ts`, `apps/cvm-server/src/main.ts`, `apps/cvm-server/package.json`, new `apps/cvm-server/src/config.spec.ts`. Depends on TDDAB-2.
</intro>

<red>
- test: `loadConfig()` with `CVM_STORAGE_TYPE` unset returns `storage.type === 'file'`.
- test: `loadConfig()` with `CVM_STORAGE_TYPE='file'` and `CVM_DATA_DIR='/tmp/x'` returns `storage.dataDir === '/tmp/x'` and no `mongoUri` key.
- test: `loadConfig()` with an invalid `CVM_LOG_LEVEL='bogus'` throws mentioning valid levels.
- test: the `Config.storage` type has no `mongoUri` member (spec compiles referencing only `type`/`dataDir`).
</red>

### Implementation
`apps/cvm-server/src/config.ts` — `Config.storage` becomes `{ type: 'file'; dataDir?: string }`; `loadConfig` drops `mongoUri` and the `if (storageType === 'mongodb' && !mongoUri) throw` block; the actual mongodb-type rejection now lives in `StorageFactory` (TDDAB-2). New `apps/cvm-server/src/config.spec.ts` uses Vitest, saves/restores `process.env` in `beforeEach/afterEach`, asserts the cases above. `apps/cvm-server/src/main.ts` — replace the storage `if/else` so only the file-storage branch remains. `apps/cvm-server/package.json` — remove `"mongodb"` from dependencies, set `"version": "2.0.0"`. Also remove the stale `'mongodb'` entry from the rollup `external` array in `apps/cvm-server/vite.config.ts`.

<success>
- [ ] `config.ts` has no `mongoUri` and no mongodb validation branch.
- [ ] `apps/cvm-server/src/config.spec.ts` exists and `npx nx test cvm-server` passes.
- [ ] `apps/cvm-server/package.json`: version `2.0.0`, no `mongodb` dependency; `apps/cvm-server/vite.config.ts` no longer lists `'mongodb'` in `external`.
- [ ] `rg -i mongo apps/cvm-server/src` returns nothing.
- [ ] `npx nx run-many --target=build --all` passes.
</success>
</block>

<block id="04-remove-dead-mongodb-package">
## TDDAB-4: Delete the dead @cvm/mongodb package and phantom deps

<intro>
Remove the dead standalone package `packages/mongodb` entirely and the phantom dependency declarations that reference MongoDB. Confirmed dead: no `src` imports `@cvm/mongodb`. Steps: delete the `packages/mongodb` directory; remove its project reference `{ "path": "./packages/mongodb" }` from root `tsconfig.json`; remove `"@cvm/mongodb"` from `packages/mcp-server/package.json` dependencies; remove `"mongodb"` from `packages/types/package.json` dependencies (phantom — no `types/src` import); remove the stale `'mongodb'` entry from the rollup `external` array in `packages/mcp-server/vite.config.ts`. This is a deletion/cleanup block verified by a green full build and negative greps (no behavioral unit under test — nothing consumes the deleted code). Files: `packages/mongodb/**` (delete), root `tsconfig.json`, `packages/mcp-server/package.json`, `packages/mcp-server/vite.config.ts`, `packages/types/package.json`. Depends on TDDAB-2 (it removes `MongoDBAdapter` from storage); this block is otherwise independent of TDDAB-3 and can run in parallel with it, after 02.
</intro>

<red>
- test: `npx nx show projects` (or workspace project list) contains no `mongodb`/`@cvm/mongodb` project.
- test: `rg -n "@cvm/mongodb" packages apps --glob '!node_modules' --glob '!dist'` returns nothing.
- test: `rg -n '"mongodb"' packages/types/package.json packages/mcp-server/package.json` returns nothing.
- test: `npx nx run-many --target=build --all` compiles with no missing-reference/type errors.
</red>

### Implementation
Delete directory `packages/mongodb`. In root `tsconfig.json`, remove the `references` entry `{ "path": "./packages/mongodb" }`. In `packages/mcp-server/package.json`, delete the `"@cvm/mongodb": "^0.0.1"` dependency line, and in `packages/mcp-server/vite.config.ts` remove `'mongodb'` from the `external` array. In `packages/types/package.json`, delete the `"mongodb": "^6.3.0"` dependency line (keep `pino`, `pino-pretty`, `@types/pino`). If any Nx cache/graph references linger, they resolve on `nx reset`; note it in the block but no code change needed.

<success>
- [ ] `packages/mongodb` directory no longer exists.
- [ ] Root `tsconfig.json` has no `./packages/mongodb` reference.
- [ ] No `@cvm/mongodb` dependency anywhere; `packages/types` has no `mongodb` dep; `packages/mcp-server/vite.config.ts` no longer lists `'mongodb'` in `external`.
- [ ] `npx nx run-many --target=build --all` and `npx nx run-many --target=test --all` pass.
</success>
</block>

<block id="05-docs-docker-changelog">
## TDDAB-5: Remove MongoDB from docker/docs; CHANGELOG breaking entry

<intro>
Final wiring/docs block. Remove the MongoDB service from local infra and update documentation to reflect file-only storage and the v2.0.0 breaking change. This block has no unit tests (docs/infra); it is verified by negative greps and a present CHANGELOG entry. Files: `docker/docker-compose.yml`, `docker/init-mongo/**` (delete), `packages/storage/README.md`, `apps/cvm-server/README.md`, `README.md` (root, env-vars section), `.env` (remove `MONGODB_URI`), `docs/CHANGELOG` (or the repo's changelog location), and MB `memory-bank/techContext.md` (drop mongodb env vars + `[PackageDeps]` mongodb notes). Depends on TDDAB-2/03/04.
</intro>

<red>
- test: `rg -in "mongo" docker/` returns nothing (service + init dir removed).
- test: `rg -in "MONGODB_URI|CVM_STORAGE_TYPE=mongodb" README.md apps/cvm-server/README.md packages/storage/README.md .env` returns nothing.
- test: the changelog contains a `2.0.0` entry documenting "BREAKING: removed MongoDB storage backend; file storage only".
</red>

### Implementation
Remove the `mongodb` service, its volume `mongodb_data`, and `mongo-network` from `docker/docker-compose.yml` (keep the nginx docs service if still wanted, or remove the whole `docker/` dir if it only served mongo — decide by what remains; the nginx `documents` service is unrelated to mongo, keep it). Delete `docker/init-mongo/`. Strip MongoDB rows from the env-var tables in the three READMEs and the root README; remove `MONGODB_URI` from `.env`. Add the CHANGELOG `2.0.0` breaking entry. Update `memory-bank/techContext.md`: remove `MONGODB_URL`/`CVM_STORAGE_TYPE=mongodb` from `[EnvVars]`, and update `[PackageDeps]`/`[KeyDeps]` mongodb lines to reflect removal.

<success>
- [ ] `rg -in mongo docker/` is empty; `docker/init-mongo/` deleted.
- [ ] No `MONGODB_URI` / `CVM_STORAGE_TYPE=mongodb` references in READMEs or `.env`.
- [ ] CHANGELOG has the `2.0.0` BREAKING entry.
- [ ] `memory-bank/techContext.md` no longer advertises MongoDB storage.
</success>
</block>

## Execution Order
```
01-convert-vm-integration-to-file  → no dependencies (removes the only external MongoDBAdapter consumer first)
02-storage-file-only-guard         → depends on 01
03-app-config-cleanup              → depends on 02
04-remove-dead-mongodb-package     → depends on 02 (can run parallel with 03)
05-docs-docker-changelog           → depends on 02, 03, 04
```
