# CVM Test Program Inventory

## Overview
This document catalogs all test programs in the CVM test suite, their purpose, and reorganization plan.

## Current Test Programs (Categorized)

### 1. Basic Language Features
- `test-basic.ts` - Basic variables, console.log, simple execution
- `test-simple-test.ts` - Simple execution test
- `test-output.ts` - Console output testing
- `test-implicit-main.ts` - Tests implicit main function

### 2. Operators
- `test-logical-operators.ts` - Comprehensive: &&, ||, ! with all combinations
- `test-logical-simple.ts` - Simple logical operator test
- `test-unary-operators.ts` - Unary: +, -, ++, --
- `test-unary-simple.ts` - Simple unary test
- `test-new-operators.ts` - Modulo (%), <=, >=, ===, !==
- `test-new-operators-simple.ts` - Simplified version
- `test-all-new-operators.ts` - All new operators combined
- `test-comparisons.ts` - All comparison operators
- `test-compound-assignments.ts` - +=, -=, *=, /=, %=
- `test-ternary.ts` - Ternary operator (?:)
- `test-ternary-simple.ts` - Simple ternary test

### 3. Control Flow
- `test-control-flow.ts` - if/else, while loops
- `test-if-simple.ts` - Basic if statements
- `test-foreach-loops.ts` - For-of loops (misnamed)
- `test-forof-simple.ts` - Simple for-of
- `test-forof-fslist.ts` - For-of with file listing
- `test-forof-fslist-no-cc.ts` - For-of without CC calls
- `test-forof-cc-simulation.ts` - For-of with CC simulation
- `test-block-scoping.ts` - Block scope testing
- `test-scope-leak.ts` - Scope leak detection

### 4. Arrays & Objects
- `test-simple-array.ts` - Basic array creation
- `test-array-index.ts` - Array indexing
- `test-array-push-object.ts` - Pushing objects to arrays
- `test-inline-object-push.ts` - Inline object creation in push
- `test-objects.ts` - Basic object operations
- `test-objects-simple.ts` - Simplified object test
- `test-objects-comprehensive.ts` - Complex object operations
- `test-object-minimal.ts` - Minimal object test
- `test-object-with-vars.ts` - Objects with variables
- `test-object-debug.ts` - Object debugging

### 5. String Operations
- `test-string-length.ts` - String length property
- `test-string-methods.ts` - substring, indexOf, split, charAt
- `test-new-string-methods.ts` - Additional string methods

### 6. File System
- `test-fs-readfile.ts` - Reading files
- `test-fs-writefile.ts` - Writing files
- `test-fs-read-write.ts` - Combined read/write
- `test-fs-read-write-combined.ts` - Another combined test
- `test-fs-persistence.ts` - File persistence across executions
- `test-fs-objects-cc.ts` - File operations with objects and CC
- `test-fslist-basic.ts` - Basic file listing
- `test-fslist-iteration.ts` - Iterating over file lists
- `loadfile-test.ts` - Loading files

### 7. CC (Cognitive Call) Integration
- `test-cc-object-simple.ts` - CC with simple objects
- `test-objects-cc-simple.ts` - Objects with CC (duplicate?)
- `test-multi-cc-object.ts` - Multiple CC calls with objects
- `test-object-cc-debug.ts` - Debugging CC with objects

### 8. Type System
- `test-undefined.ts` - Undefined handling
- `test-undefined-simple.ts` - Simple undefined test
- `test-tostring.ts` - ToString conversions
- `test-tostring-and-implicit-main.ts` - ToString with implicit main
- `test-return-types.ts` - Different return types
- `test-return-value.ts` - Function return values
- `test-return-with-output.ts` - Return with console output
- `test-return-debug.ts` - Return debugging

### 9. Memory & Performance
- `test-heap-simple.ts` - Simple heap operations
- `test-heap-efficiency.ts` - Heap efficiency testing
- `test-iterator-debug.ts` - Iterator debugging

### 10. Comprehensive Tests
- `test-all-features.ts` - Tests all major features (365 lines)
- `test-comprehensive-features.ts` - Phase 1 & 2 features
- `test-comprehensive-final.ts` - Final comprehensive test
- `test-phase1-phase2.ts` - Phased feature testing
- `test-phase2-complete.ts` - Phase 2 completion
- `test-features-working.ts` - Working features test

### 11. Specific Examples
- `test-working-password.ts` - Password validation example
- `test-execution-management.ts` - Execution control
- `test-restart.ts` - Restart functionality
- `test-bug-fixes.ts` - Various bug fixes (needs investigation)

## Identified Issues

### Duplicates/Overlaps
1. **Logical operators**: `test-logical-operators.ts` vs `test-logical-simple.ts`
2. **Unary operators**: `test-unary-operators.ts` vs `test-unary-simple.ts`
3. **Objects**: Multiple overlapping object tests
4. **For-of loops**: 5+ different for-of tests
5. **Comprehensive tests**: 5 different "all features" tests
6. **File operations**: Multiple read/write combination tests

### Poorly Named
- `test-foreach-loops.ts` - Actually tests for-of, not forEach
- `test-bug-fixes.ts` - Vague, doesn't indicate what bugs
- `test-features-working.ts` - Too generic
- `test-output.ts` - Unclear purpose
- `simple-test.ts` - Too vague

### Missing Tests
Based on progress.md, we're missing tests for:
- Traditional for(;;) loops (not yet implemented)
- Function parameters (not yet implemented)
- Error handling patterns (null returns)
- State persistence scenarios
- Complex CC workflows

## Reorganization Plan

### Phase 1: Analyze & Document (Current)
- ✅ Inventory all tests
- ✅ Categorize by functionality
- ✅ Identify duplicates
- [ ] Read each test to understand exact purpose

### Phase 2: Create New Structure
```
test/programs/
├── README.md                      # Test suite documentation
├── 01-basics/                     # Basic language features
├── 02-operators/                  # All operators
├── 03-control-flow/              # Loops, conditionals
├── 04-data-structures/           # Arrays, objects
├── 05-strings/                   # String operations
├── 06-file-system/               # File I/O
├── 07-cc-integration/            # CC patterns
├── 08-examples/                  # Real-world examples
├── 09-comprehensive/             # Full integration tests
└── archive/                      # Old tests for reference
```

### Phase 3: Consolidate Tests
1. Merge duplicate tests into single, well-documented versions
2. Rename tests to be descriptive
3. Add header comments explaining what each test validates
4. Create response files for CC-based tests

### Phase 4: Documentation
1. Update each test with clear documentation
2. Create README for test suite
3. Document how to run each category
4. Create test coverage matrix

## Next Steps
1. Read through remaining tests to complete inventory
2. Start consolidating duplicate tests
3. Create new directory structure
4. Move tests to appropriate directories
5. Update integration testing documentation