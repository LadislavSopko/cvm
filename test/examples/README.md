# CVM Server Examples

This directory contains examples for using the CVM (Cognitive Virtual Machine) server with MCP (Model Context Protocol).

## Quick Start

The CVM server is now available as an npm package and can be run directly with npx:

```bash
npx cvm-server@latest
```

## MCP Configuration

The `.mcp.json` file in this directory is configured to use the published npm package:

```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server@latest"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm-examples",
        "CVM_LOG_LEVEL": "info"
      }
    }
  }
}
```

## Testing with Claude Desktop

1. Copy `.mcp.json` to your Claude Desktop configuration directory
2. Restart Claude Desktop
3. The CVM tools will be available in Claude

## Environment Variables

- `CVM_STORAGE_TYPE`: Storage backend (`file` or `mongodb`)
- `CVM_DATA_DIR`: Directory for file storage (default: `.cvm`)
- `CVM_LOG_LEVEL`: Logging verbosity (`debug`, `info`, `warn`, `error`)

## Example Programs

### Simple Hello World

```typescript
function main() {
  console.log("Hello from CVM!");
  const response = CC("What's a creative way to say hello?");
  console.log(response);
}
```

### Interactive Story

```typescript
function main() {
  console.log("Starting interactive story...");
  
  const character = CC("Create a character name for a sci-fi story");
  console.log("Our hero: " + character);
  
  const location = CC("Where does " + character + " live?");
  console.log("Location: " + location);
  
  const adventure = CC("What adventure awaits " + character + " in " + location + "?");
  console.log("Adventure: " + adventure);
  
  console.log("The End!");
}
```

## Troubleshooting

If you see warnings about `.cvm/` directory, add it to your `.gitignore`:

```
# CVM data directory
.cvm/
.cvm-examples/
```

## Version Information

Current published version: 0.2.1

To use a specific version:
```json
"args": ["cvm-server@0.2.1"]
```

To always use the latest:
```json
"args": ["cvm-server@latest"]
```