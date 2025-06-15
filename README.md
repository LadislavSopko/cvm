# CVM - Cognitive Virtual Machine

A deterministic bytecode virtual machine that seamlessly integrates AI cognitive operations into program execution.

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

CVM (Cognitive Virtual Machine) is an innovative approach to AI integration that inverts the typical pattern. Instead of AI systems calling functions, CVM programs make "cognitive calls" (CC) to AI models during execution. This creates a deterministic, debuggable environment for AI-enhanced applications.

### Key Features

- **Deterministic Execution**: Programs execute in a predictable, step-by-step manner
- **Cognitive Calls**: Seamlessly integrate AI reasoning into your program flow
- **State Persistence**: All execution state is preserved between cognitive operations
- **MCP Protocol**: Built on the Model Context Protocol for standardized AI communication
- **Multiple Storage Backends**: File-based (default) or MongoDB for production

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

## How It Works

1. **Load Program**: CVM compiles your TypeScript-like program into bytecode
2. **Execute**: The VM executes instructions deterministically
3. **Cognitive Calls**: When a CC() is encountered, execution pauses
4. **AI Processing**: The MCP client (like Claude) processes the cognitive request
5. **Resume**: Execution continues with the AI's response
6. **Persist**: All state is saved between operations

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
