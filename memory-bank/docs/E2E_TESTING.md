# Integration Testing Guide (E2E)

## Overview
End-to-end testing uses the MCP test client to verify CVM works correctly from source code through execution completion.

## Test Locations
- **E2E Test Client**: `test/integration/mcp-test-client.ts`
- **Test Programs**: `test/programs/`
- **Package Integration**: `packages/integration/` (unit-level integration tests)

## CRITICAL Testing Flow

**ALWAYS follow these steps after ANY code changes:**

1. **Reset and rebuild ALL packages**:
```bash
# From project root
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

2. **Run E2E tests**:
```bash
# From project root
cd test/integration
npx tsx mcp-test-client.ts ../programs/test-name.ts [cc-responses...]
```

## Why Rebuilding is Critical
- `cvm-server` runs from compiled JavaScript in `dist/`
- Changes to opcodes, VM, parser, or any package require rebuild
- `nx reset` clears cache to ensure clean builds
- `--skip-nx-cache` forces fresh compilation

## E2E Test Flow
```
Test Program → MCP Client → cvm-server → MCP Server → VM Manager → VM
                                ↑                            ↓
                          (stdio transport)              Storage
```

## Key Test Programs
- `test-string-length.ts` - String operations and methods
- `test-logical-operators.ts` - &&, ||, ! operators
- `test-working-password.ts` - Real-world password validation flow
- `test-all-features.ts` - Comprehensive language feature test
- `test-comparisons.ts` - All comparison operators
- `test-new-operators-simple.ts` - Arithmetic/comparison/logical ops

## Running Tests

### Single Test
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/counter.ts "1" "2" "3" "4" "5"
```

### Test with No CC Responses
```bash
npx tsx mcp-test-client.ts ../programs/basic-math.ts
```

### Debug Mode
```bash
# Set environment for debug output
export CVM_LOG_LEVEL=debug
npx tsx mcp-test-client.ts ../programs/test-name.ts
```

## Writing New E2E Tests

1. **Create test program** in `test/programs/`:
```typescript
function main() {
  // Test specific functionality
  console.log("Starting test...");
  
  const input = CC("Provide test input");
  console.log("Received:", input);
  
  // Verify behavior
  if (input === "expected") {
    console.log("✓ Test passed");
    return 0;
  } else {
    console.log("✗ Test failed");
    return 1;
  }
}
```

2. **Run with appropriate CC responses**:
```bash
npx tsx mcp-test-client.ts ../programs/my-test.ts "expected"
```

3. **Verify output** matches expectations

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Unknown opcode" | Packages not rebuilt | Run full rebuild sequence |
| Empty output | Runtime error in VM | Check debug logs |
| "No current execution" | Missing CC responses | Provide all required responses |
| Type errors | TypeScript changes | Rebuild parser package |
| Storage errors | Permissions issue | Check `.cvm/` directory |

## Test Patterns

### Testing New Opcodes
1. Add opcode to `packages/parser/src/lib/bytecode.ts`
2. Implement handler in `packages/vm/src/lib/handlers/`
3. Add compiler support in `packages/parser/`
4. **Rebuild all packages**
5. Write E2E test using the feature

### Testing Error Handling
```typescript
function main() {
  try {
    // CVM doesn't support try-catch!
    // Use defensive programming instead
    const result = someOperation();
    if (!result) {
      console.log("Operation failed");
      return 1;
    }
  } catch (e) {
    // This won't work in CVM
  }
}
```

### Testing State Persistence
Run partial execution, kill process, restart:
```bash
# Start execution
npx tsx mcp-test-client.ts ../programs/long-test.ts "response1"
# Ctrl+C after first CC

# Resume execution
npx tsx mcp-test-client.ts --resume exec-id "response2" "response3"
```

## Package-Level Integration Tests

For unit-level integration testing:
```bash
# Test cross-package integration
npx nx test integration

# Test specific integration
npx nx test integration -- full-stack.spec.ts
```

## Best Practices

1. **Always rebuild after changes** - This is the #1 cause of confusion
2. **Use console.log liberally** - It's your primary debugging tool
3. **Test error cases** - Ensure graceful failure
4. **Verify state persistence** - Test pause/resume scenarios
5. **Check memory leaks** - Monitor heap usage for large programs

## CI/CD Integration

For automated testing:
```bash
#!/bin/bash
# ci-test.sh
set -e

# Clean and rebuild
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache

# Run all E2E tests
cd test/integration
for test in ../programs/test-*.ts; do
  echo "Running $test..."
  npx tsx mcp-test-client.ts "$test" < responses/"$(basename $test .ts)".txt
done
```

Remember: E2E tests are your safety net. They catch integration issues that unit tests miss!