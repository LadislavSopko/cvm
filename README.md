# CVM - Cognitive Virtual Machine

A deterministic bytecode virtual machine designed for AI-driven execution through the Model Context Protocol.

## Quick Start

```bash
npx cvm-server@latest
```

[![npm version](https://badge.fury.io/js/cvm-server.svg)](https://www.npmjs.com/package/cvm-server)

## ⚠️ Important: Add to .gitignore

When using CVM in a git repository, add the data directory to your `.gitignore`:

```gitignore
# CVM data directory
.cvm/
```

## Overview

CVM (Cognitive Virtual Machine) is a passive execution environment that processes programs under AI control. The AI (like Claude) drives the entire execution by pulling tasks and pushing results through MCP tools. CVM never initiates actions - it only responds to AI requests.

### How CVM Really Works

**CVM is NOT a traditional VM that calls out to AI. Instead:**
- The AI (Claude) drives the entire execution
- CVM waits passively for the AI to request tasks
- When encountering CC() instructions, CVM presents them as tasks
- The AI provides responses and continues execution
- All control flow is managed by the AI through MCP tools

### Execution Flow Diagram

```
┌─────────────┐                    ┌─────────────┐
│     AI      │                    │     CVM     │
│  (Claude)   │                    │   Server    │
└─────────────┘                    └─────────────┘
      │                                   │
      │  1. load(program)                │
      ├──────────────────────────────────>│
      │                                   │
      │  2. start(executionId)           │
      ├──────────────────────────────────>│
      │                                   │
      ┌───────────────────────────────────┐
      │ EXECUTION LOOP (AI-driven)        │
      │                                   │
      │  3. getTask()                    │
      ├──────────────────────────────────>│
      │                                   │
      │  4. Returns task/prompt          │
      │<──────────────────────────────────┤
      │                                   │
      │  5. AI processes task            │
      │  (e.g., answers CC prompt)       │
      │                                   │
      │  6. submitTask(result)           │
      ├──────────────────────────────────>│
      │                                   │
      │  7. CVM executes next steps      │
      │     until next CC() or end       │
      │                                   │
      └───────────────────────────────────┘
           Repeat until program ends
```

### Key Features

- **AI-Driven Execution**: The AI controls program flow by pulling tasks
- **Passive State Machine**: CVM only responds to MCP tool calls
- **Deterministic**: Each step is predictable and debuggable
- **State Persistence**: Execution state preserved between AI interactions
- **MCP Protocol**: Standard interface for AI-VM communication

## Installation

### As an MCP Server

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm"
      }
    }
  }
}
```

### Global Installation

```bash
npm install -g cvm-server
cvm-server
```

## Configuration

CVM uses environment variables for configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `CVM_STORAGE_TYPE` | Storage backend: "file" or "mongodb" | "file" |
| `CVM_DATA_DIR` | Directory for file storage | ".cvm" |
| `CVM_LOG_LEVEL` | Logging level: "debug", "info", "warn", "error" | "info" |
| `MONGODB_URI` | MongoDB connection string (required for mongodb storage) | - |

## Example Program

```typescript
function main() {
  console.log("Starting creative writing assistant...");
  
  const topic = CC("What's an interesting topic for a short story?");
  console.log("Topic: " + topic);
  
  const outline = CC("Create a brief outline for a story about: " + topic);
  console.log("Outline: " + outline);
  
  const opening = CC("Write an engaging opening paragraph for this story");
  console.log("Opening: " + opening);
  
  console.log("Story started!");
}
```

### Execution Example

Here's what actually happens when this program runs:

```
1. AI: load("function main() { ... }")
   CVM: Program loaded as program-123

2. AI: start("execution-456", "program-123")
   CVM: Execution started

3. AI: getTask("execution-456")
   CVM: No task (executes console.log)

4. AI: getTask("execution-456")
   CVM: { prompt: "What's an interesting topic for a short story?" }

5. AI: submitTask("execution-456", "A time-traveling detective")
   CVM: Stored response, continues execution

6. AI: getTask("execution-456")
   CVM: No task (executes console.log)

7. AI: getTask("execution-456")
   CVM: { prompt: "Create a brief outline for a story about: A time-traveling detective" }

8. AI: submitTask("execution-456", "1. Detective discovers time anomaly...")
   CVM: Stored response, continues execution

... (pattern continues until program completes)
```

**Remember**: CVM never initiates communication. The AI must continuously poll for tasks.

## How It Works

1. **AI Loads Program**: The AI calls `load()` with your TypeScript-like program
2. **AI Starts Execution**: The AI calls `start()` to begin execution
3. **AI Pulls Tasks**: The AI repeatedly calls `getTask()` to check for work
4. **CVM Responds**: When reaching CC(), CVM returns the prompt as a task
5. **AI Processes**: The AI determines the response to the prompt
6. **AI Submits Result**: The AI calls `submitTask()` with the response
7. **CVM Continues**: CVM processes the response and executes until next CC()
8. **Repeat**: The AI continues pulling tasks until the program completes

**Key Point**: The AI drives everything. CVM never "calls" the AI - it only responds when the AI asks for tasks.

## Architecture

CVM is built as a monorepo with the following packages:

- `@cvm/parser` - TypeScript parser for CVM language
- `@cvm/compiler` - Bytecode compiler
- `@cvm/vm` - Virtual machine executor
- `@cvm/storage` - Storage abstraction layer
- `@cvm/mcp-server` - MCP protocol implementation
- `@cvm/types` - Shared type definitions

## Development

### Prerequisites

- Node.js >= 18
- npm or yarn
- MongoDB (optional, for mongodb storage)

### Setup

```bash
git clone https://github.com/LadislavSopko/cvm
cd cvm
npm install
```

### Build

```bash
npx nx build cvm-server
```

### Test

```bash
npx nx test --all
```

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

Copyright 2024 Ladislav Sopko

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
