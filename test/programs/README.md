# CVM Test Suite

This directory contains all test programs for the CVM (Cognitive Virtual Machine). Tests are organized by functionality to make it easy to find, run, and maintain specific test cases.

## Directory Structure

```
test/programs/
├── 01-basics/          # Basic language features (variables, functions, console)
├── 02-operators/       # All operators (arithmetic, logical, comparison, etc.)
├── 03-control-flow/    # Control structures (if/else, loops, break/continue)
├── 04-data-structures/ # Arrays and objects
├── 05-strings/         # String operations and methods
├── 06-file-system/     # File I/O operations
├── 07-cc-integration/  # CC() (Cognitive Call) patterns
├── 08-examples/        # Real-world example programs
├── 09-comprehensive/   # Full integration tests
├── 10-regex/           # Regular expression literals and patterns
└── archive/            # Old/deprecated tests for reference
```

## Running Tests

Tests are run using the MCP test client. Always rebuild before running tests:

```bash
# From project root
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache

# Run a test
cd test/integration
npx tsx mcp-test-client.ts ../programs/01-basics/variables.ts
```

## Test Categories

### 01-basics
- Variables and assignments
- Console output
- Function declarations
- Return values
- Basic execution flow

### 02-operators
- Arithmetic: +, -, *, /, %
- Comparison: ==, !=, <, >, <=, >=, ===, !==
- Logical: &&, ||, !
- Unary: ++, --, +, -
- Compound assignment: +=, -=, *=, /=, %=
- Ternary: ? :

### 03-control-flow
- if/else statements
- while loops
- for-of loops
- break and continue
- Block scoping

### 04-data-structures
- Array creation and manipulation
- Array methods (push, length)
- Object creation and property access
- Nested structures
- JSON operations

### 05-strings
- String length
- String methods: charAt, indexOf, substring, slice, split
- String concatenation
- Type conversion (toString)

### 06-file-system
- fs.readFile()
- fs.writeFile()
- fs.listFiles()
- File persistence
- File iteration patterns

### 07-cc-integration
- Basic CC() calls
- CC() with objects
- Multiple CC() workflows
- Complex interactive scenarios

### 08-examples
- Password validation
- Grade calculation
- Data processing
- Real-world workflows

### 09-comprehensive
- Full feature integration tests
- Stress tests
- Performance tests

### 10-regex
- Regular expression literals (`/pattern/flags`)
- Regex object properties (source, flags, global, ignoreCase, multiline)
- Error handling for invalid patterns
- Real-world TODO orchestration patterns

## Test Naming Convention

Tests should be named descriptively:
- `{feature}-basic.ts` - Basic functionality test
- `{feature}-advanced.ts` - Advanced features
- `{feature}-edge-cases.ts` - Edge cases and error handling
- `{feature}-example.ts` - Real-world usage example

## Writing New Tests

When creating new tests:

1. Add a header comment explaining what the test validates:
```typescript
/**
 * Tests: Basic variable declaration and assignment
 * Features: let, const, basic types (string, number, boolean)
 * CC Responses needed: none
 */
```

2. Keep tests focused on specific functionality
3. Use descriptive console.log messages
4. Return 0 for success, 1 for failure
5. For CC-based tests, document required responses

## CC Response Files

For tests requiring CC responses, create a corresponding `.responses` file:
- `password-validator.ts` → `password-validator.responses`

Response file format (one response per line):
```
admin123
password
SecurePass123!
```

## Test Maintenance

- Archive old tests instead of deleting them
- Update tests when language features change
- Keep comprehensive tests in sync with new features
- Document any special requirements or limitations