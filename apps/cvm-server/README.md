# CVM Server

The Cognitive Virtual Machine (CVM) server - a deterministic bytecode VM that integrates AI cognitive operations.

## Features

- Zero-configuration file storage
- MongoDB support for production deployments
- MCP (Model Context Protocol) integration
- Automatic versioning with conventional commits

## Installation

Install globally or use with npx:

### Quick Start

```bash
npx cvm-server
```

### ⚠️ Important: Add to .gitignore

When using CVM in a git repository, add the data directory to your `.gitignore`:

```gitignore
# CVM data directory
.cvm/
```

## Configuration

CVM uses environment variables for configuration:

- `CVM_STORAGE_TYPE` - Storage backend: "file" (default) or "mongodb"
- `CVM_DATA_DIR` - Data directory for file storage (default: ".cvm")
- `CVM_LOG_LEVEL` - Logging level: "debug", "info" (default), "warn", "error"
- `MONGODB_URI` - MongoDB connection string (required only for mongodb storage)

## MCP Integration

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

## Production Usage

For production deployments with MongoDB:

```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server"],
      "env": {
        "CVM_STORAGE_TYPE": "mongodb",
        "MONGODB_URI": "mongodb://user:pass@host:27017/cvm?authSource=admin"
      }
    }
  }
}
```

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