# Active Context

## NEXT TASK: Push sanctions_rag to Dify Knowledge Base

**PROBLEM**: Dify doesn't pull from external sources - we must push data via API

**PLAN**: Create script in `mongo-importer` to push all sanctions to Dify:
- Each sanction = 1 document
- Each field (content_full, notes_*, etc) = separate chunk
- Use Dify Knowledge Base API: https://docs.dify.ai/en/guides/knowledge-base/knowledge-and-documents-maintenance/maintain-dataset-via-api

**Script**: `packages/mongo-importer/src/scripts/push-to-dify-knowledge.ts`

**Dify API Config**:
- Base URL: `http://localhost/v1`
- Dataset ID: `90cecd61-5fb2-45ee-aa07-908717c1134a` (CDS dataset)
- API Key: `dataset-xFjsc3DfZxBwlSq1LSYWROHr`

**API Endpoint**:
```
POST http://localhost/v1/datasets/90cecd61-5fb2-45ee-aa07-908717c1134a/document/create_by_text
Headers:
  Authorization: Bearer dataset-xFjsc3DfZxBwlSq1LSYWROHr
  Content-Type: application/json
Body:
{
  "name": "Sanction {nrecord}_{idipotesi}",
  "text": "COMBINED ALL CHUNKS HERE WITH SECTION HEADERS",
  "indexing_technique": "high_quality",
  "process_rule": {"mode": "automatic"}
}
```

**Document Structure** (1 per sanction):
- Name: `{nrecord}_{idipotesi}` (e.g., "801453_174-17")
- Text: Combine all fields with headers:
  ```
  === TITOLO ===
  {title}
  
  === VERBALE ===
  {content_verbale}
  
  === DETTAGLI ===
  {content_mdtext}
  
  === NOTE DOTTRINALI ===
  {notes_dottrinali}
  
  === NOTE INFORMATIVE ===
  {notes_informative}
  
  === NOTE SANZIONATORIE ===
  {notes_sanzionatorie}
  
  === NOTE OPERATIVE ===
  {notes_operative}
  
  === RIFERIMENTI NORMATIVI ===
  Fonti: {sources_text}
  Articolo: {articolo}
  Comma: {comma}
  
  === INFORMAZIONI LEGALI ===
  Disposizione: {law_info.disposizione}
  Data: {law_info.data}
  Numero: {law_info.numero}
  
  === METADATA ===
  ID Sanzione: {sanction_id}
  NRecord: {nrecord}
  ID Ipotesi: {idipotesi}
  Categoria: {categoria}
  Ha Sanzioni Pecuniarie: {has_penalties}
  Ha Decurtazione Punti: {has_points}
  ```

**Process**: Read sanctions_rag → Format each → POST to Dify → Track progress

### What We Built:

1. **MongoDB Collection**: `violations.sanctions_rag` with 1341 documents containing:
   - All 4 note types (dottrinali, informative, sanzionatorie, operative)
   - Combined content fields for RAG
   - Complete legal metadata
   - Text search indexes with weighted fields

2. **API Endpoint**: `POST /retrieval` that:
   - Accepts Dify's standard retrieval request format
   - Uses MongoDB text search (not Qdrant)
   - Returns COMPLETE documents from sanctions_rag
   - Lets Dify handle the AI/RAG processing

### Collection Structure: `violations.sanctions_rag`

```typescript
interface SanctionRAG {
  _id: ObjectId;
  
  // Primary identifiers
  sanction_id: string;           // `${nrecord}_${idipotesi}` (unique)
  nrecord: string;               // "801453"
  idipotesi: string;             // "174-17"
  
  // RAG Content Fields (what Dify will index)
  title: string;                 // Ipotesi title
  content_full: string;          // Combined text for general search
  content_verbale: string;       // Verbale text (specific)
  content_mdtext: string;        // Markdown text (detailed)
  
  // Legal Sources
  sources_text: string;          // "CDS art. 174 c. 10"
  law_info: {
    disposizione: string;        // "decreto legislativo"
    data: string;                // "1992-04-30"
    numero: string;              // "285"
    articolo: string;            // "174"
    comma: string;               // "10"
  };
  
  // Separated Notes for Granular Search (all 4 types)
  notes_dottrinali: string;      // Doctrinal/legal notes
  notes_informative: string;     // Informative/procedural notes
  notes_sanzionatorie: string;   // Sanctioning/penalty notes
  notes_operative: string;       // Operational/enforcement notes
  
  // Filter Metadata
  articolo: string;              // "174"
  comma: string;                 // "10"
  categoria: string;             // Violation category
  has_penalties: boolean;        // Has monetary penalties
  has_points: boolean;          // Has license points
  
  // References
  original_ipotesi_id: ObjectId; // Link to ipotesis document
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}
```

### Scripts to Create (in `packages/mongo-importer/src/scripts/`):

1. **`create-sanctions-rag-collection.ts`**
   - Create collection with proper indexes
   - Indexes: sanction_id (unique), nrecord, articolo, categoria
   - Text indexes on content fields for MongoDB text search

2. **`populate-sanctions-rag.ts`**
   - Read from `violations.ipotesis` collection
   - Transform each sanction in sanctions[] array
   - Combine texts for content_full field
   - Handle missing/null values gracefully
   - Batch insert for performance

3. **`update-sanctions-rag.ts`** (future maintenance)
   - Sync changes from ipotesis to sanctions_rag
   - Compare timestamps for incremental updates

### Content Combination Logic:

```typescript
const content_full = [
  `TITOLO: ${title}`,
  `VIOLAZIONE: ${sanctions.tabelloneData.verbale}`,
  `DETTAGLI: ${sanctions.mdText}`,
  `FONTI LEGALI: ${sources_text}`,
  sanctions.tabelloneData.notes.dottrinali ? `NOTE DOTTRINALI: ${sanctions.tabelloneData.notes.dottrinali}` : '',
  sanctions.tabelloneData.notes.informative ? `NOTE INFORMATIVE: ${sanctions.tabelloneData.notes.informative}` : '',
  sanctions.tabelloneData.notes.sanzionatorie ? `NOTE SANZIONATORIE: ${sanctions.tabelloneData.notes.sanzionatorie}` : '',
  sanctions.tabelloneData.notes.operative ? `NOTE OPERATIVE: ${sanctions.tabelloneData.notes.operative}` : ''
].filter(Boolean).join('\n\n');
```

### Commands to Add to package.json:

```json
{
  "scripts": {
    "create-rag-collection": "tsx src/scripts/create-sanctions-rag-collection.ts",
    "populate-rag": "tsx src/scripts/populate-sanctions-rag.ts",
    "update-rag": "tsx src/scripts/update-sanctions-rag.ts"
  }
}
```

### Execution Order:

1. `npx nx run mongo-importer:create-rag-collection`
2. `npx nx run mongo-importer:populate-rag`

### Dify Configuration:

Use the `/retrieval` endpoint at `http://localhost:3333/retrieval` with:
```json
{
  "knowledge_id": "sanctions_rag",
  "query": "your search query",
  "retrieval_setting": {
    "top_k": 10
  }
}
```

The endpoint returns complete documents with all fields for Dify to process.

### Summary:

✅ **Phase 2 Foundation Complete**:
- Created `sanctions_rag` collection with 1333 documents
- Includes all 4 note types (dottrinali, informative, sanzionatorie, operative)
- MongoDB text search indexes configured
- `/retrieval` endpoint exposes full documents for Dify RAG
- Ready for Dify External Knowledge Base integration

**NOTE**: Old plan files (`dify-rag-collection-plan.md` and `dify-search-api-extension.md`) have been superseded by this implementation.

---

## Current State

- **Architecture**: Sanctions-based system (ipotesis documents with embedded sanctions array)
- **MongoDB**: ✅ FULLY IMPORTED - 1201 ipotesis with 1341 sanctions in `violations.ipotesis` collection
- **Qdrant**: ✅ FULLY IMPORTED - All 1341 sanctions indexed with field-separated embeddings
- **Search UI**: Fully operational at http://localhost:3000
- **MCP Server**: Integrated with Claude via `qdrant-find` tool

## Recent Work (2025-01-28)

- Created accurate READMEs for all libraries and apps
- Cleaned up Memory Bank documentation
- **FIXED ALL LIBRARIES**:
  - mongo-importer: ✅ All TypeScript errors resolved
  - qdrant-client: ✅ All build/test/lint pass
  - qdrant-importer: ✅ Fixed with parallel import working
- **DATA REIMPORTED SUCCESSFULLY**:
  - MongoDB: 1201 ipotesis with 1341 sanctions (1333 unique)
  - Qdrant: 1333 embeddings indexed with field separation
- **PARALLEL IMPORT WORKING**:
  - Configuration: 2 batches × 10 sanctions = 20 concurrent
  - Performance: ~6-7 sanctions/second
  - Better error handling prevents hanging
- **FIXED SEARCH-API DETAIL VIEW**:
  - Created new clean detail.html page that displays raw MongoDB data
  - Removed all API transformations - now returns raw database documents
  - Fixed browser history state management for search results preservation
  - Back button now properly returns to search results without re-querying

## Project Status

1. **@cds/mongo-importer** ✅ FULLY FIXED
   - All build/test/typecheck pass
   - Data import successful: 1201 ipotesis, 1341 sanctions

2. **@cds/qdrant-client** ✅ FULLY FIXED
   - All commands work (build, test, typecheck, lint pass)

3. **@cds/qdrant-importer** ✅ FULLY FIXED
   - All TypeScript errors resolved
   - Parallel import working: ~6-7 sanctions/second
   - Successfully imported 1333 unique sanctions to Qdrant

4. **@cds/mcp-server-qdrant-openai** ✅ WORKING
   - Build and typecheck work
   - MCP integration functional

5. **@cds/search-api** ✅ FIXED
   - Fixed all import errors
   - API now returns raw MongoDB data without transformations
   - New detail.html page displays sanctions array properly
   - Browser history state management preserves search results

## Next Steps - AI Pipeline Manager v3

Following `/home/laco/cds/ai-pipeline-manager-v3-updated.md` plan:

### Mission
Transform Italian traffic sanctions into AI-generated flowcharts through intelligent pipelines, enabling legal professionals to validate and publish official procedural diagrams.

### Architecture Overview
- **Existing Infrastructure**: MongoDB (1201 ipotesi), Qdrant (1333 embeddings), Debug Search UI
- **New Components**: Dify AI Workflows, Pipeline API (NestJS), Legal Editor UI (Angular 19)
- **Integration**: Leverages existing data and search capabilities

### Technology Stack
- **AI Processing**: Dify (self-hosted) with Anthropic Claude
- **Backend**: NestJS Pipeline API, existing MongoDB/Qdrant
- **Frontend**: Angular 19 Legal Editor (production UI)
- **Current Debug Tools**: search-api remains for development

### Development Phases
1. **Phase 1**: Dify Setup & Workflow Design (Week 1)
2. **Phase 2**: Integration API (Week 2)
3. **Phase 3**: Legal Editor UI - Core Features (Week 3-4)
4. **Phase 4**: Advanced Features (Week 5-6)
5. **Phase 5**: Quality & Polish (Week 7-8)
6. **Phase 6**: Production Deployment (Week 9-10)

### Key Distinction
- **Current System**: Debug tools for data verification
- **New System**: Production platform for legal professionals

## Key Achievements

- ✅ All core libraries fixed and working
- ✅ Data successfully reimported (1333 unique sanctions)
- ✅ Parallel import optimized (~6-7 sanctions/second)
- ✅ MCP integration functional for Claude searches
- ✅ Web UI operational at http://localhost:3000

## Key References

- See individual project READMEs for commands and usage:
  - `packages/mongo-importer/README.md` - Data import pipeline
  - `packages/qdrant-client/README.md` - Vector search client
  - `packages/qdrant-importer/README.md` - MongoDB to Qdrant pipeline
  - `apps/mcp-server-qdrant-openai/README.md` - Claude integration
  - `apps/search-api/README.md` - REST API and web UI