# cvm-server

The executable MCP server application for CVM. This is the npm package that users install to run CVM with Claude Desktop.

## Overview

This app provides:
- **Executable MCP Server**: Ready-to-run server for Claude Desktop
- **Configuration Management**: Environment-based configuration
- **Logging**: Structured logging for debugging
- **Graceful Shutdown**: Proper cleanup on exit
- **Version Management**: Automatic version detection

## Architecture

```
Claude Desktop
      ↓ (stdio)
cvm-server (this app)
      ↓
CVMMcpServer (@cvm/mcp-server)
      ↓
VMManager (@cvm/vm)
      ↓
Storage + VM Engine
```

## Installation

### For End Users

Add to Claude Desktop's MCP settings:

```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server@latest"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm"
      }
    }
  }
}
```

### For Development

```bash
# Clone repository
git clone https://github.com/LadislavSopko/cvm.git
cd cvm

# Install dependencies
npm install

# Build all packages
npx nx build cvm-server

# Run locally
node apps/cvm-server/dist/main.js
```

## Configuration

The server uses environment variables for configuration:

### Storage Configuration

```bash
# File storage (default)
CVM_STORAGE_TYPE=file
CVM_DATA_DIR=.cvm

# MongoDB storage
CVM_STORAGE_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/cvm
```

### Logging Configuration

```bash
# Log levels: debug, info, warn, error
CVM_LOG_LEVEL=info

# Log format: pretty (default) or json
CVM_LOG_FORMAT=pretty
```

### Environment

```bash
# Environment: development, production
NODE_ENV=production
```

## Features

### Automatic Storage Setup
- Creates storage directories if needed
- Warns about adding data directory to .gitignore
- Connects to MongoDB if configured

### Version Detection
- Attempts to find package.json in multiple locations
- Works in development and production builds
- Falls back to hardcoded version if needed

### Graceful Shutdown
- Handles SIGINT and SIGTERM signals
- Closes all connections properly
- Ensures data is saved before exit

### Error Handling
- Comprehensive error logging
- Graceful degradation
- Clear error messages for debugging

## File Structure

```
apps/cvm-server/
├── src/
│   ├── main.ts         # Entry point
│   ├── config.ts       # Configuration management
│   └── logger.ts       # Logging setup
├── bin/
│   └── cvm-server.cjs  # Executable wrapper
├── package.json        # Package metadata
└── README.md          # This file
```

## Building and Publishing

### Build

```bash
# Development build
npx nx build cvm-server --configuration=development

# Production build
npx nx build cvm-server --configuration=production
```

### Publish to npm

```bash
# Bump version and publish
npx nx release

# Or manually
cd apps/cvm-server/dist
npm publish --otp=YOUR_OTP
```

## Usage

Once installed, Claude can interact with CVM through MCP tools:

1. Load a program: `mcp__cvm__load`
2. Start execution: `mcp__cvm__start`
3. Get tasks: `mcp__cvm__getTask`
4. Submit results: `mcp__cvm__submitTask`

See the main project README for detailed usage examples.

## Development Tips

### Running Locally

```bash
# Set environment variables
export CVM_STORAGE_TYPE=file
export CVM_DATA_DIR=.cvm-dev
export CVM_LOG_LEVEL=debug

# Run the server
node apps/cvm-server/dist/main.js
```

### Testing with Claude Desktop

1. Build the server: `npx nx build cvm-server`
2. Update MCP config to point to local build:
```json
{
  "mcpServers": {
    "cvm": {
      "command": "node",
      "args": ["/path/to/cvm/apps/cvm-server/dist/main.js"]
    }
  }
}
```

### Debugging

Enable debug logging:
```bash
export CVM_LOG_LEVEL=debug
export CVM_LOG_FORMAT=pretty
```

Check logs for:
- Storage initialization
- MCP tool calls
- VM state changes
- Error traces

## Dependencies

### Runtime Dependencies
- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **dotenv**: Environment variable loading
- **mongodb**: MongoDB driver (optional)
- **typescript**: Type definitions
- **zod**: Schema validation

### Internal Dependencies
- **@cvm/mcp-server**: MCP server implementation
- **@cvm/vm**: Core VM engine
- **@cvm/storage**: Storage layer
- **@cvm/parser**: CVM language parser
- **@cvm/types**: Shared types

## License

Apache 2.0 - See LICENSE file for details