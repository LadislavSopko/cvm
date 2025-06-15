# CVM Examples

This directory contains example CVM programs and configuration for running CVM with file-based storage.

## Configuration

The `.mcp.json` file configures CVM to use file-based storage instead of MongoDB:

```json
{
  "cvm": {
    "env": {
      "CVM_STORAGE_TYPE": "file",
      "CVM_DATA_DIR": "~/.cvm-examples"
    }
  }
}
```

This means:
- Programs and execution state are stored as JSON files in `~/.cvm-examples/`
- No MongoDB required!
- Perfect for testing and development

## Example Programs

- `hello.ts` - Simple hello world with cognitive call
- `counting.ts` - Multiple cognitive calls example
- `counting-simple.ts` - Simplified counting example
- `test-multiple-cc.ts` - Test for multiple consecutive CC calls

## How It Works

When Claude connects to the CVM server:
1. CVM server starts with file-based storage
2. Programs are saved to `~/.cvm-examples/programs/`
3. Execution state is saved to `~/.cvm-examples/executions/`
4. Everything persists between runs

## Storage Location

Check your stored programs and executions:
```bash
ls -la ~/.cvm-examples/
```

## Switching to MongoDB

If you want to use MongoDB instead, update `.mcp.json`:
```json
{
  "cvm": {
    "env": {
      "CVM_STORAGE_TYPE": "mongodb",
      "MONGODB_URI": "mongodb://root:example@localhost:27017/cvm?authSource=admin"
    }
  }
}
```