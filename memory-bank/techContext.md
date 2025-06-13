# Tech Context

## Stack Overview

- **Runtime**: Node.js 18+ with TypeScript
- **Build**: Nx monorepo with Vite/ESBuild
- **Database**: MongoDB + Qdrant vector DB
- **AI**: OpenAI embeddings (text-embedding-3-small)
- **Testing**: Vitest
- **Package Manager**: npm

## Project Structure

```
/home/laco/cds/
├── apps/
│   ├── mcp-server-qdrant-openai/    # MCP server for Claude
│   └── search-api/                   # REST API + Web UI
├── packages/
│   ├── mongo-importer/               # Data import pipeline
│   ├── qdrant-client/                # Shared Qdrant client
│   └── qdrant-importer/              # MongoDB to Qdrant pipeline
└── docker/
    └── docker-compose.yml            # MongoDB + Qdrant
```

## Key Technical Details

- **ESM Modules**: Always use .js extension in imports
- **TypeScript**: `"moduleResolution": "nodenext"`
- **Nx Commands**: Use `npx nx` for all operations
- **Docker Services**: MongoDB on 27017, Qdrant on 6333

## Environment Variables

```bash
MONGODB_URI=mongodb://root:example@localhost:27017
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your-key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## Quick Start

```bash
# Start services
docker-compose up -d

# Install dependencies
npm install

# Import data (if needed)
npx nx run mongo-importer:import
npx nx run qdrant-importer:import

# See individual project READMEs for specific commands
```

## Import Performance

- **MongoDB Import**: ~50 ipotesis/second
- **Qdrant Import**: ~6-7 sanctions/second with parallel processing
- **Parallel Config**: 2 batches × 10 sanctions = 20 concurrent operations

## Current Data Status

- **MongoDB**: 1201 ipotesis with 1341 sanctions (1333 unique)
- **Qdrant**: 1333 embeddings indexed with field separation
- **All libraries**: ✅ Fixed and working
- **Remaining issue**: search-api import errors

For detailed setup and commands, refer to individual project READMEs.