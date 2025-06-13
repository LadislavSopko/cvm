# AI Pipeline Manager v3 Context

## Overview

The AI Pipeline Manager v3 combines Dify's AI orchestration platform with custom domain interfaces to transform Italian traffic sanctions into validated flowcharts for legal professionals.

## Architecture Evolution

### Current Infrastructure (Debug/Development)
- **MongoDB**: 1201 ipotesi with 1341 sanctions
- **Qdrant**: 1333 embeddings for semantic search
- **Search API**: REST endpoints for data access
- **Debug UI**: Web interface for data verification

### New Production System
- **Dify**: Self-hosted AI workflow orchestration
- **Pipeline API**: NestJS integration layer
- **Legal Editor**: Angular 19 professional interface
- **Validation System**: Workflow approval and publishing

## Key Components

### Dify Workflows
Self-hosted Dify instance providing:
- Visual workflow designer
- Anthropic Claude integration
- Prompt management and versioning
- Execution monitoring

### Pipeline API (NestJS)
Integration layer that:
- Connects to existing MongoDB
- Triggers Dify workflows
- Manages validation state
- Provides WebSocket updates

### Legal Editor (Angular 19)
Production UI featuring:
- Sanctions browser with semantic search
- Flowchart generation interface
- Side-by-side validation view
- Batch processing capabilities

## Data Flow

```
MongoDB Sanctions → Dify Workflow → Mermaid Flowchart → Legal Validation → Published Diagram
        ↑                                                        ↓
        └────────────── Qdrant Semantic Search ─────────────────┘
```

## Integration Strategy

1. **Leverage Existing Data**: Use current MongoDB/Qdrant as-is
2. **Add New Capabilities**: Dify for AI, Angular for UI
3. **Maintain Separation**: Debug tools remain, production UI is new
4. **Gradual Migration**: No disruption to current system

## Tomorrow's Quick Start

1. Deploy Dify with Docker Compose
2. Connect to existing MongoDB
3. Create "Sanction to Flowchart" workflow
4. Test with real sanctions data
5. Build minimal API endpoint

## Success Metrics

- **Accuracy**: 90%+ flowcharts approved without major edits
- **Speed**: < 30 seconds per sanction
- **Efficiency**: 5x faster than manual creation
- **Cost**: < €0.10 per flowchart
- **Reliability**: 99.9% uptime