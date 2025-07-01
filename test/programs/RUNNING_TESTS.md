# Running CVM Tests

This directory contains several scripts to help run the CVM test suite.

## Prerequisites

Before running any tests, ensure you're in the CVM project root directory and have built all packages:

```bash
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

## Test Runner Scripts

### 1. run-all-tests.sh
Runs the entire test suite with appropriate CC responses for each test.

```bash
./test/programs/run-all-tests.sh
```

Features:
- Automatically rebuilds all packages
- Runs all tests in order by category
- Provides correct CC responses for interactive tests
- Generates `test-results.log` with detailed output
- Shows colored pass/fail status
- Returns exit code 0 if all pass, 1 if any fail

### 2. run-category.sh
Runs all tests in a specific category.

```bash
# Run all operator tests
./test/programs/run-category.sh 02-operators

# Run with rebuild
./test/programs/run-category.sh 02-operators --rebuild
```

Categories:
- 01-basics
- 02-operators
- 03-control-flow
- 04-data-structures
- 05-strings
- 06-file-system
- 07-cc-integration
- 08-examples
- 09-comprehensive

### 3. run-test.sh
Runs a single test with optional CC responses.

```bash
# Test without CC responses
./test/programs/run-test.sh 01-basics/variables-and-output.ts

# Test with CC responses
./test/programs/run-test.sh 07-cc-integration/cc-with-objects.ts 42

# Test with multiple CC responses
./test/programs/run-test.sh 08-examples/password-validator.ts mypass123 mypass123
```

## Manual Testing

You can also run tests manually:

```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/01-basics/variables-and-output.ts
```

## Common CC Response Patterns

Some tests require specific CC responses:

### logical-operators.ts
```bash
# Age, HasPermit, Password, Confirm, Health, HasShield, Day, Hour
"25" "yes" "secure123" "secure123" "75" "yes" "3" "14"
```

### objects-complex.ts
```bash
# Name1, Age1, Job1, Name2, Age2, Job2
"John" "30" "Engineer" "Jane" "25" "Designer"
```

### password-validator.ts
```bash
# Password, Confirm
"mypass123" "mypass123"
```

## Debugging Failed Tests

1. Check `test-results.log` for detailed output
2. Run the specific test with `run-test.sh` to see live output
3. Enable debug mode:
   ```bash
   export CVM_LOG_LEVEL=debug
   ./test/programs/run-test.sh 01-basics/variables-and-output.ts
   ```

## Adding New Tests

1. Create test file in appropriate category directory
2. Add header comment documenting what it tests
3. If CC responses needed, document them in the header
4. Update `run-all-tests.sh` if CC responses are required

Example test header:
```typescript
/**
 * Tests: Basic array operations
 * Features: array creation, push, length, indexing
 * CC Responses needed: none
 */
```