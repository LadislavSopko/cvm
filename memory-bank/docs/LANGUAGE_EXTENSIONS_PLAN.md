# CVM Language Extensions Plan

## Overview
Extend CVM to support file analysis workflows with minimal, practical features:
- Arrays for storing file paths and results
- JSON parsing for structured AI responses
- Branching (if/else) for conditional logic
- Iteration (foreach) for processing file lists
- Built-in `getFiles()` function for secure file discovery

## Current State Analysis

### Existing Infrastructure
1. **Parser**: Uses TypeScript AST, validates CVM subset
2. **Compiler**: Transforms AST to bytecode instructions
3. **VM**: Stack-based executor with state persistence
4. **Types**: Shared definitions with string-only values currently
5. **OpCodes**: Basic set (PUSH, POP, LOAD, STORE, CONCAT, CC, PRINT, HALT)

### Key Architecture Points
- Stack-based VM (not register-based)
- All values are strings currently
- State persisted after each CC instruction
- Clean separation: Parser → Compiler → VM

## Implementation Plan (TDD Approach)

### Phase 1: Type System & Arrays
**Goal**: Enable arrays to store file paths and parse JSON from AI

#### 1.1 Extend Type System
```typescript
// In @cvm/types/src/lib/types.ts
export type CVMValue = string | boolean | number | CVMArray | null;
export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
}

// Type checking helpers
export function isCVMArray(value: CVMValue): value is CVMArray {
  return value !== null && typeof value === 'object' && 'type' in value && value.type === 'array';
}
```

#### 1.2 New OpCodes
```typescript
// In @cvm/parser/src/lib/bytecode.ts
export enum OpCode {
  // ... existing ...
  
  // Array operations
  ARRAY_NEW = 'ARRAY_NEW',      // → array
  ARRAY_PUSH = 'ARRAY_PUSH',    // array, value → array
  ARRAY_GET = 'ARRAY_GET',      // array, index → value
  ARRAY_LEN = 'ARRAY_LEN',      // array → number
  
  // Type operations
  JSON_PARSE = 'JSON_PARSE',    // string → array
  TYPEOF = 'TYPEOF',            // value → string (type name)
  
  // Basic arithmetic (for array lengths, counters)
  ADD = 'ADD',                  // a, b → (a + b)
  SUB = 'SUB',                  // a, b → (a - b)
}
```

#### 1.3 VM Implementation
- Replace `any[]` stack with `CVMValue[]` stack
- Add runtime type checking for all operations
- Implement array operations in execute()
- Add JSON parsing with error handling
- Define type coercion rules:
  - Number to string for CONCAT: `5 + "hello"` → `"5hello"`
  - Boolean to string for CONCAT: `true + "!"` → `"true!"`
  - String to number for arithmetic: Error (no implicit conversion)
  - Non-boolean in conditions: Truthy/falsy rules (null/0/"" = false)

#### 1.4 Parser/Compiler Extensions
- Recognize array syntax: `[]`, `[1, 2, 3]`
- Compile `JSON.parse()` to JSON_PARSE opcode
- Handle array indexing: `arr[0]`
- Support `.length` property

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

### Phase 1 Tests
```typescript
// Array creation and manipulation
test('creates empty array', () => {
  const result = compile('let arr = [];');
  expect(result.bytecode).toContainEqual({ op: 'ARRAY_NEW' });
});

// JSON parsing
test('parses JSON array from string', () => {
  const vm = new VM();
  const state = vm.execute([
    { op: OpCode.PUSH, arg: '["a","b"]' },
    { op: OpCode.JSON_PARSE }
  ]);
  expect(state.stack[0]).toEqual({ type: 'array', elements: ['a', 'b'] });
});
```

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