# CVM Integration Tests

This directory contains integration tests for the CVM system.

## Test Client

### mcp-test-client.ts

The official test client using the MCP SDK. This client:
- Properly sets the working directory to project root
- Configures storage to use `.cvm` in the project directory
- Captures and verifies console.log output in `.cvm/outputs/`

### Usage

```bash
# From project root
cd test/integration

# Run with responses for CC prompts
npx tsx mcp-test-client.ts ../programs/test-output.ts "Alice" "25"

# General usage
npx tsx mcp-test-client.ts <program.ts> [response1] [response2] ...
```

### Output Files

Output files are stored in `test/integration/.cvm/outputs/` with the format:
- `{executionId}.output` - Contains all console.log output from the program

The `.cvm` directory is created in the test directory to keep test artifacts isolated.

## Test Programs

Test programs are located in `../programs/`:
- `test-output.ts` - Tests console.log output capture with arrays, JSON parsing, and CC calls
- `simple-test.ts` - Basic program with a single CC call
- Other test programs for specific features

## Important Notes

### CRITICAL: Testing Flow

**ALWAYS follow these steps when testing after ANY code changes:**

1. **Reset and rebuild ALL packages** (required after any VM/parser changes):
```bash
# From project root
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

2. **Run the integration test**:
```bash
# From project root
cd test/integration
npx tsx mcp-test-client.ts ../programs/your-test.ts [cc-responses...]
```

### Why rebuilding is critical:
- The cvm-server runs from compiled JavaScript in `dist/`
- Changes to opcodes, VM, or parser won't work until rebuilt
- `nx reset` clears the cache to ensure clean builds
- `--skip-nx-cache` forces fresh builds

### Other notes:
- The `.cvm` directory is created in the test/integration directory
- Make sure to provide enough responses for all CC calls in your test program
- Output files are saved in `.cvm/outputs/`