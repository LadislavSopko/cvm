# System Patterns

## Architecture Overview

**Sanctions-Based System**: Each ipotesis contains embedded sanctions. No separate sanctions collection.

```
Data Sources (XML, HTML, RTF, CSV)
    ↓
MongoDB (ipotesis with embedded sanctions)
    ↓
Qdrant (field-separated embeddings per sanction)
    ↓
APIs (REST + MCP)
```

## Key Design Decisions

1. **Embedded Sanctions**: Sanctions are part of ipotesis documents, not separate
2. **Field-Separated Embeddings**: Each text field gets its own vector for fair comparison
3. **Weighted Search**: Different fields have different importance (title 30%, verbale 30%, etc.)
4. **No Backward Compatibility**: Clean break from old violations system

## Data Flow Patterns

1. **Import**: XML → Parse → Enrich → MongoDB
2. **Index**: MongoDB → Build Documents → Create Embeddings → Qdrant
3. **Search**: Query → Embed → Search Qdrant → Aggregate → Return Results

## ID Patterns

- MongoDB: ObjectId or string (nrecord)
- Qdrant: `{nrecord}_{field_type}_{chunk_index}` (e.g., "801398_title_0")

## Technology Patterns

- **Monorepo**: Nx for build orchestration
- **TypeScript**: ESM modules with .js imports
- **Testing**: Vitest with real service integration
- **No Mocks**: Test against real MongoDB/Qdrant in tests

For detailed implementation, see project READMEs.