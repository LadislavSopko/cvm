# Product Context

## Mission

Transform Italian traffic sanctions into AI-ready flowcharts for modern law enforcement.

## The Problem

- 1300+ traffic sanctions with complex legal text
- Police officers struggle to find the right sanction
- AI needs structured decision trees, not walls of text
- Legal professionals need to validate AI interpretations

## Our Solution (Current & Future)

### Phase 1 (Current) - Search Foundation
1. **Import** all sanctions data from multiple sources into MongoDB
2. **Index** sanctions with AI embeddings in Qdrant for semantic search  
3. **Search** sanctions using natural language queries
4. **Integrate** with Claude for AI-assisted violation lookup

### Phase 2 (Next) - AI Flowchart Generation
1. **Generate Mermaid flowcharts** for each violation showing decision flow
2. **Create an editor** for legal professionals to validate/modify flowcharts
3. **Enable AI agents** to navigate flowcharts for step-by-step guidance

## Current Status

- ✅ Data imported: 1201 ipotesis with 1341 sanctions
- ✅ Search UI operational
- ✅ Claude integration via MCP
- 🔧 Full production indexing pending

## Users

1. **Police Officers**: Need quick, accurate sanction lookup
2. **Legal Professionals**: Validate and review sanction data
3. **AI Systems**: Claude and other agents accessing via API

## Success Metrics

- Find correct sanction in < 5 seconds
- 95%+ search accuracy
- Support natural language queries in Italian

## Technical Implementation

See project READMEs for implementation details.