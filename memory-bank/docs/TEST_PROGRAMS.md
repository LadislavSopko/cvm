# Test Programs Guide

All test programs are in `test/programs/`

## Feature Tests

### Core Features
- `test-output.ts` - Basic console.log and CC() testing
- `simple-test.ts` - Minimal CC() test
- `test-array-index.ts` - Array indexing and access
- `test-simple-array.ts` - Basic array operations

### Operators
- `test-comparisons.ts` - All comparison operators
- `test-logical-operators.ts` - AND, OR, NOT operators (&&, ||, !)
- `test-new-operators-simple.ts` - Arithmetic + comparison + logical
- `test-all-new-operators.ts` - Comprehensive operator testing

### Control Flow
- `test-control-flow.ts` - if/else and while loops
- `test-if-simple.ts` - Basic if statement
- `test-phase2-complete.ts` - All Phase 2 features

### String Operations
- `test-string-length.ts` - String length testing (NEW!)
- `test-working-password.ts` - Password validation with length

### Comprehensive
- `test-all-features.ts` - All implemented features
- `test-comprehensive-features.ts` - Deep feature testing
- `test-comprehensive-final.ts` - Final validation
- `test-phase1-phase2.ts` - Phase 1 & 2 features
- `test-features-working.ts` - Working feature subset

### Bug Tests
- `test-bug-fixes.ts` - Tests for fixed bugs

## Running Tests

```bash
# From test/integration/
npx tsx mcp-test-client.ts ../programs/test-name.ts [cc-responses...]
```

## Example Commands

```bash
# String length test
npx tsx mcp-test-client.ts ../programs/test-string-length.ts "myPassword123" "John"

# Password validation
npx tsx mcp-test-client.ts ../programs/test-working-password.ts "secret123" "secret123"

# Logical operators
npx tsx mcp-test-client.ts ../programs/test-logical-operators.ts "true" "password123"
```