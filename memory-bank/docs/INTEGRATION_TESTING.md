# Integration Testing Guide

## Overview
Integration testing uses the MCP (Model Context Protocol) client to test CVM end-to-end.

## Location
- Test client: `test/integration/mcp-test-client.ts`
- Test programs: `test/programs/`
- Output files: `test/integration/.cvm/outputs/`

## CRITICAL Testing Flow

**ALWAYS follow these steps after ANY code changes:**

1. **Reset and rebuild ALL packages**:
```bash
# From project root
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

2. **Run integration tests**:
```bash
# From project root
cd test/integration
npx tsx mcp-test-client.ts ../programs/test-name.ts [cc-responses...]
```

## Why Rebuilding is Critical
- cvm-server runs from compiled JavaScript in `dist/`
- Changes to opcodes, VM, or parser won't work until rebuilt
- `nx reset` clears cache for clean builds
- `--skip-nx-cache` forces fresh compilation

## Key Test Programs
- `test-string-length.ts` - Tests string.length functionality
- `test-logical-operators.ts` - Tests &&, ||, !
- `test-working-password.ts` - Real-world password validation
- `test-all-features.ts` - Comprehensive feature test
- `test-comparisons.ts` - All comparison operators
- `test-new-operators-simple.ts` - All arithmetic/comparison/logical ops

## Adding New Tests
1. Create test program in `test/programs/`
2. Use console.log() for output verification
3. Use CC() for simulating user input
4. Provide CC responses as command line args

## Common Issues
- "Unknown opcode" = Need to rebuild
- Empty output = Check for runtime errors
- Missing responses = Provide enough CC responses