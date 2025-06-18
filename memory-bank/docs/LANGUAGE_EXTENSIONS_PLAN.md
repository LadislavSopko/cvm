# CVM Language Extensions Plan

## Overview
Extend CVM to support file analysis workflows with minimal, practical features:
- ✅ Arrays for storing file paths and results (Phase 1 - COMPLETED)
- ✅ JSON parsing for structured AI responses (Phase 1 - COMPLETED)
- Branching (if/else) for conditional logic (Phase 2)
- Iteration (foreach) for processing file lists (Phase 3)
- Built-in `getFiles()` function for secure file discovery (Phase 4)

## Current State Analysis

### Phase 1 Completed ✅
- **Type System**: Extended to support arrays, numbers, booleans, null
- **Array Operations**: ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_LEN implemented
- **JSON Parsing**: JSON_PARSE opcode with proper error handling
- **Arithmetic**: ADD, SUB, MUL, DIV opcodes for numeric operations
- **Type Operations**: TYPEOF opcode for runtime type checking
- **Parser/Compiler**: Array literals, indexing, and JSON.parse() support
- **VM**: Type-safe stack with CVMValue[], proper type coercion rules

### Remaining Infrastructure
- **Control Flow**: Need branching and loops
- **File Operations**: Need secure file system access
- **Iterator State**: Need foreach implementation

## Implementation Plan (TDD Approach)

### Phase 1: Type System & Arrays ✅ COMPLETED
- Extended type system with CVMValue, CVMArray, numbers, booleans, null
- Implemented array operations (ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_LEN)
- Added JSON_PARSE with error handling
- Implemented arithmetic operations (ADD, SUB, MUL, DIV)
- Added TYPEOF for runtime type checking
- Parser supports array literals, indexing, and JSON.parse()
- VM uses type-safe CVMValue[] stack with proper coercion rules

### Phase 2: Branching
**Goal**: Add if/else statements

#### 2.1 New OpCodes
```typescript
// Comparison
EQ = 'EQ',           // a, b → bool
NEQ = 'NEQ',         // a, b → bool
LT = 'LT',           // a, b → bool
GT = 'GT',           // a, b → bool

// Control flow
JUMP = 'JUMP',               // → (jumps to arg address)
JUMP_IF_FALSE = 'JUMP_IF_FALSE', // cond → (jumps if false)
JUMP_IF_TRUE = 'JUMP_IF_TRUE',   // cond → (jumps if true)

// Logical operations
AND = 'AND',                 // a, b → (a && b)
OR = 'OR',                   // a, b → (a || b)
NOT = 'NOT',                 // a → (!a)
```

#### 2.2 Compiler Changes
- Parse if/else statements
- Generate jump instructions with correct offsets
- Handle comparison operators (==, !=, <, >)

### Phase 3: Iteration
**Goal**: Add foreach loops

#### 3.1 New OpCodes
```typescript
// Iteration
ITER_START = 'ITER_START',    // array → (setup iterator)
ITER_NEXT = 'ITER_NEXT',      // → value, hasMore
ITER_END = 'ITER_END',        // → (cleanup iterator)
```

#### 3.2 VM Iterator State
```typescript
interface IteratorContext {
  array: CVMArray;
  index: number;
}

// Add to VMState
iterators: IteratorContext[];
```

#### 3.3 Compiler Changes
- Parse `foreach (item in array)` syntax
- Generate iteration opcodes with proper jumps

### Phase 4: File Operations
**Goal**: Add secure `getFiles()` function

#### 4.1 New OpCode
```typescript
FS_LIST_FILES = 'FS_LIST_FILES', // path, recursive, pattern → array
```

#### 4.2 Security Implementation
```typescript
interface FileSystemOptions {
  rootDir: string;  // Sandbox root
  maxDepth: number; // Recursion limit
  maxFiles: number; // Result limit
}
```

#### 4.3 Built-in Function
- Implement `getFiles(path, recursive, pattern?)` 
- Always return sorted results (deterministic)
- Validate paths (no .., must be relative)
- Support simple glob patterns (*.ts, *.js)

## Testing Strategy (TDD)

### Comprehensive Test Coverage
Beyond basic functionality, test edge cases and error conditions:

#### Array Edge Cases
- Out-of-bounds access: `arr[10]` on 3-element array
- Type mismatches: `ARRAY_PUSH` on non-array
- Null/undefined handling in arrays
- Very large arrays (performance/memory)

#### JSON Parsing Edge Cases
- Invalid JSON: `JSON.parse("not json")`
- Non-array JSON: `JSON.parse("{}")`  
- Deeply nested structures
- Unicode and escape sequences

#### Type System Edge Cases
- Type coercion in all contexts
- Null/undefined propagation
- Mixed-type comparisons: `"5" == 5`

#### Control Flow Edge Cases
- Nested if/else statements
- Empty branches
- Complex boolean expressions
- Short-circuit evaluation for AND/OR

#### File Operation Edge Cases
- Path traversal attempts: `../../../etc/passwd`
- Non-existent paths
- Permission errors
- Resource limits (maxFiles, maxDepth)
- Invalid glob patterns
- Symlinks and circular references


### Phase 2 Tests
```typescript
// If statement compilation
test('compiles if statement with jumps', () => {
  const source = 'if (x == 5) { console.log("yes"); }';
  const result = compile(source);
  expect(result.bytecode).toContainEqual({ op: 'JUMP_IF_FALSE' });
});
```

### Phase 3 Tests
```typescript
// Foreach compilation
test('compiles foreach loop', () => {
  const source = 'foreach (item in items) { console.log(item); }';
  const result = compile(source);
  expect(result.bytecode).toContainEqual({ op: 'ITER_START' });
});
```

### Phase 4 Tests
```typescript
// File listing
test('lists files securely', () => {
  const state = vm.execute([
    { op: OpCode.PUSH, arg: './src' },
    { op: OpCode.PUSH, arg: true },
    { op: OpCode.PUSH, arg: '*.ts' },
    { op: OpCode.FS_LIST_FILES }
  ]);
  expect(state.stack[0].type).toBe('array');
  // Results should be sorted
  expect(isSorted(state.stack[0].elements)).toBe(true);
});
```

## Example Programs

### Basic File Analysis
```typescript
function main() {
  // Get TypeScript files
  let files = getFiles("./src", true, "*.ts");
  console.log("Found " + files.length + " TypeScript files");
  
  // Analyze each file
  foreach (file in files) {
    let prompt = "Analyze this TypeScript file for issues: " + file;
    let analysis = CC(prompt);
    
    if (analysis != "No issues") {
      console.log(file + ": " + analysis);
    }
  }
}
```

### AI-Driven File Selection
```typescript
function main() {
  // Ask AI which files to analyze
  let criteria = CC("What files should I analyze in this codebase?");
  let filesJson = CC("List files matching: " + criteria + " as JSON array");
  let files = JSON.parse(filesJson);
  
  foreach (file in files) {
    let result = CC("Analyze: " + file);
    console.log(result);
  }
}
```

## Implementation Notes

### Compiler Architecture Improvements
1. **AST Visitor Pattern**: Replace ad-hoc traversal with structured visitor
2. **Symbol Table**: Track variable types and scopes
3. **Jump Target Resolution**: Two-pass compilation for forward jumps
4. **Error Recovery**: Continue compilation after errors for better diagnostics

### VM Architecture Changes
1. **Type-Safe Stack**: Replace `any[]` with `CVMValue[]`
2. **Operation Validation**: Type check before each operation
3. **Error Handling**: Structured error types with context
4. **Performance**: Consider type-specific fast paths

## Migration Strategy

1. **No Breaking Changes**: All existing programs continue to work
2. **Incremental Rollout**: Features can be used independently
3. **Backward Compatible**: String-only programs still valid
4. **Type Coercion**: Explicit rules, no surprises

## Security Considerations

1. **Path Sandboxing**: All paths relative to CVM working directory
2. **Resource Limits**: Max files, max array size, max iterations
3. **No File Writing**: Read-only operations for safety
4. **Pattern Validation**: Only safe glob patterns allowed
5. **Deterministic Results**: Always sorted for reproducibility

## Next Steps

1. Update Memory Bank with this plan
2. Cross-check with Zen for completeness
3. Start Phase 1 implementation with TDD
4. Create example programs for testing
5. Document new language features