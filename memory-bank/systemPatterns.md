# System Patterns

## System Architecture

CVM uses a layered architecture with clean separation of concerns:

```
┌─────────────────────────────────────┐
│      Claude Desktop (MCP Client)    │
├─────────────────────────────────────┤
│    cvm-server app (stdio transport) │
├─────────────────────────────────────┤
│   MCP Server (protocol interface)   │
├─────────────────────────────────────┤
│     VM Manager (orchestration)      │
├─────────────────────────────────────┤
│  Parser → Compiler → VM → Storage   │
└─────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Custom Bytecode Interpreter
- **Why**: Enables pause/resume at any instruction
- **How**: Stack-based VM with explicit state management
- **Benefits**: Perfect state preservation, deterministic execution

### 2. MCP Server Architecture  
- **Why**: Claude needs standard protocol for tool interaction
- **How**: Passive server that only responds to tool calls
- **Benefits**: Clean integration, no custom protocols needed

### 3. Heap for Reference Types
- **Why**: JavaScript semantics require reference types
- **How**: Separate heap storage with ID-based references
- **Benefits**: Proper array/object behavior, clean serialization

### 4. Handler Pattern for Opcodes
- **Why**: Modularity and testability
- **How**: Each opcode has dedicated handler with interface
- **Benefits**: Easy to add opcodes, isolated testing

### 5. Storage Adapter Pattern
- **Why**: Support different persistence backends
- **How**: Common interface with file/MongoDB implementations
- **Benefits**: Flexibility, easy to add new backends

## Design Patterns in Use

### Visitor Pattern (Compiler)
```typescript
// Separate visitors for statements and expressions
const context: CompilerContext = {
  compileStatement,    // Dispatches to statement visitors
  compileExpression,   // Dispatches to expression visitors
  reportError         // Reports errors with source location
};
```

### Handler Pattern (VM)
```typescript
interface OpcodeHandler {
  stackIn: number;   // Required stack items
  stackOut: number;  // Items pushed to stack
  execute(state: VMState, instruction: Instruction): void;
}
```

### Adapter Pattern (Storage)
```typescript
interface StorageAdapter {
  connect(): Promise<void>;
  saveProgram(program: Program): Promise<void>;
  getProgram(id: string): Promise<Program | null>;
  // ... other methods
}
```

### Factory Pattern (Storage)
```typescript
// Automatically selects backend based on environment
const storage = await createStorageAdapter();
```

## Component Relationships

### Dependency Flow
```
parser (standalone)
   ↓
types (shared definitions)
   ↓
storage (uses types)
   ↓
vm (uses parser, types, storage)
   ↓
mcp-server (uses vm)
   ↓
cvm-server (app layer)
```

### Data Flow
```
Source Code → Parser → AST → Compiler → Bytecode → VM → State → Storage
                                            ↑                      ↓
                                            └──────── Resume ──────┘
```

### Control Flow
```
Claude → MCP Tools → MCP Server → VM Manager → VM
   ↑                                    ↓
   └────── Task/Result ←────────────────┘
```

## Critical Implementation Paths

### Program Execution Path
1. `mcp__cvm__load` → Compile source to bytecode
2. `mcp__cvm__start` → Initialize VM state
3. VM executes until CC() instruction
4. State saved, execution pauses
5. `mcp__cvm__getTask` → Return prompt
6. `mcp__cvm__submitTask` → Resume with result
7. Repeat until completion

### State Serialization Path
1. VM state includes: PC, stack, variables, heap
2. Convert to JSON-serializable format
3. Storage adapter persists to backend
4. On resume: deserialize and restore exact state

### Error Handling Path
1. Operations detect error condition
2. Set state.status = 'error'
3. Set state.error with message
4. Return to caller (no exceptions)
5. Error state persisted for inspection

## Architectural Principles

### 1. Passive Execution
- CVM never pushes tasks
- Claude always pulls when ready
- State machine waits between transitions

### 2. State as First Class
- All state explicitly managed
- State survives any interruption
- State observable at any time

### 3. Clean Boundaries
- Each package has single responsibility
- Dependencies flow one direction
- Interfaces define contracts

### 4. No Magic
- Explicit over implicit
- Predictable behavior
- Debuggable execution

## Extension Points

### Adding New Opcodes
1. Define in `bytecode.ts`
2. Create handler in `handlers/`
3. Add compiler support
4. Write tests

### Adding Storage Backends
1. Implement StorageAdapter interface
2. Add to storage factory
3. Configure via environment

### Adding Language Features
1. Extend parser grammar
2. Add AST node types
3. Implement compiler visitor
4. Create VM handlers

This architecture has proven robust and extensible while maintaining the core principle: CVM is a passive orchestrator that helps Claude work systematically.