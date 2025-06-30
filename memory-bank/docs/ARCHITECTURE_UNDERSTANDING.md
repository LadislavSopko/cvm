# CVM Architecture Understanding

## Overview
CVM has a layered architecture with clean separation of concerns:

```
┌─────────────────────────────────────────┐
│         MCP Server Layer                │  ← Claude interacts here
├─────────────────────────────────────────┤
│         VM Manager Layer                │  ← High-level orchestration
├─────────────────────────────────────────┤
│      Parser → Compiler → VM             │  ← Core execution pipeline
└─────────────────────────────────────────┘
```

## 1. Parser (`parser.ts`)
**Actually a validator + basic AST walker:**
- Uses TypeScript's `createSourceFile` to parse code
- Validates CVM-specific requirements (has main(), no params, etc.)
- Checks for unsupported functions (setTimeout, fetch, etc.)
- Returns errors and basic bytecode placeholder
- Main function: `parseProgram(source: string): ParseResult`

## 2. Compiler (`compiler.ts`)
**The real compilation engine:**
- Uses TypeScript AST from `ts.createSourceFile`
- Implements visitor pattern for statements and expressions
- Single-pass compilation to bytecode
- Key components:
  - `compile()` - Main entry point
  - `CompilerState` - Manages bytecode emission and labels
  - Statement visitors in `compiler/statements/`
  - Expression visitors in `compiler/expressions/`
  - Error reporting with line/column information

### Visitor Pattern Architecture
```typescript
const context: CompilerContext = {
  compileStatement,    // Dispatches to statement visitors
  compileExpression,   // Dispatches to expression visitors
  reportError         // Reports errors with source location
};
```

## 3. VM (`vm.ts`)
**Stack-based virtual machine with heap:**
- Execution state includes stack, variables, heap, and iterators
- Handler-based opcode execution (see `handlers/` directory)
- Supports reference types via heap (arrays, objects)
- Key features:
  - Stack validation before each operation
  - Iterator contexts for for...of loops
  - CC (Cognitive Compute) pause/resume
  - File system operations (sandboxed)
  - Return value support

### VM State (Current)
```typescript
interface VMState {
  pc: number;                    // Program counter
  stack: CVMValue[];            // Operand stack
  variables: Map<string, CVMValue>;  // Variable storage
  status: VMStatus;             // running, waiting_cc, complete, error
  output: string[];             // Console output
  ccPrompt?: string;            // Current CC prompt
  error?: string;               // Error message
  iterators: IteratorContext[]; // For...of loop state
  returnValue?: CVMValue;       // ✅ Return value exists!
  fileSystem?: FileSystemService;
  heap: VMHeap;                 // Reference type storage
}
```

## 4. VM Manager (`vm-manager.ts`)
**High-level orchestration layer:**
- Manages program compilation and storage
- Handles execution lifecycle
- Integrates with storage adapters (file, MongoDB)
- Provides clean API for MCP server
- Key methods:
  - `loadProgram()` - Compile and store
  - `startExecution()` - Begin execution
  - `continueExecution()` - Resume after CC
  - `getExecutionStatus()` - Check state

## 5. Handler Architecture
**Modular opcode implementation:**
- Each opcode group has its own handler file
- Handlers define stack requirements and execution
- Located in `vm/src/lib/handlers/`:
  - `arithmetic.ts` - Math operations
  - `arrays.ts` - Array operations
  - `objects.ts` - Object operations
  - `control.ts` - Flow control (JUMP, HALT, RETURN)
  - `io.ts` - Input/output (CC, PRINT)
  - `variables.ts` - Variable operations
  - `logical.ts` - Boolean operations
  - `strings.ts` - String methods
  - `unified.ts` - GET/SET property access

## Key Design Decisions

### 1. Heap for Reference Types
- Arrays and objects stored in heap with numeric IDs
- Stack holds references (IDs), not actual objects
- Enables proper mutation semantics
- Serializable for pause/resume

### 2. Handler Pattern
- Each opcode has a handler with:
  - `stackIn`: Required stack depth
  - `stackOut`: Stack effect
  - `execute`: Implementation
- Centralized validation in VM

### 3. Visitor Pattern for Compilation
- Clean separation of AST traversal and bytecode generation
- Easy to add new language features
- Consistent error reporting

### 4. Storage Abstraction
- Programs and executions stored via adapters
- Supports file system and MongoDB
- Easy to add new storage backends

## Current Capabilities

### ✅ Working Features
- All control flow (if/else, while, for...of)
- Variables with proper scoping
- Arrays with methods (push, length, indexing)
- Objects with property access
- String methods and operations
- JSON parsing/stringification
- File system operations
- Return statements
- CC (Cognitive Compute) pause/resume
- Type checking (typeof)
- Ternary operator
- Logical operators (&&, ||, !)
- Comparison operators
- Unary operators (++, --, !, -, +)

### ❌ Not Implemented
- Function parameters
- Function calls (only main() supported)
- Traditional for(;;) loops
- Try/catch error handling
- Classes and new
- Async/await (use CC instead)
- Import/export
- Spread operator
- Destructuring

## Adding New Features

### Adding a Statement Type
1. Create handler in `compiler/statements/`
2. Add to statement visitor map
3. Implement bytecode generation
4. Add tests

### Adding an Expression Type
1. Create handler in `compiler/expressions/`
2. Add to expression visitor map
3. Implement bytecode generation
4. Add tests

### Adding an Opcode
1. Add to `OpCode` enum in `bytecode.ts`
2. Create/update handler in `vm/handlers/`
3. Add to handlers map
4. Update compiler to emit opcode
5. Add tests

## Testing Strategy
- **Unit tests**: Individual opcode handlers
- **Compiler tests**: AST → bytecode verification
- **VM tests**: Bytecode execution
- **Integration tests**: Full source → execution
- **E2E tests**: MCP server interaction