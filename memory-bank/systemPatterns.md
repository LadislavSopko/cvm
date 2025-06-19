# System Patterns - CVM Architecture

## Core Architecture

### Component Structure
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CVM Parser    │────▶│    CVM VM        │────▶│  Storage Layer  │
│  (TypeScript    │     │  (Executor +     │     │  (MongoDB/File) │
│   AST → BC)     │     │   VMManager)     │     └─────────────────┘
└─────────────────┘     └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   MCP Server     │
                        │  (JSON-RPC 2.0)  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Claude (AI)    │
                        │ Cognitive Driver │
                        └──────────────────┘
```

### Execution Pattern
1. **start**: CVM begins execution until CC or completion
2. **getTask**: Claude polls for current state (read-only)
3. **submitTask**: Claude sends result, CVM resumes
4. **Repeat**: Until program completes

### Key Design Patterns

#### Type System (CVMValue)
- Union type: `string | number | boolean | CVMArray | null`
- Type guards: `isCVMString()`, `isCVMNumber()`, etc.
- Conversion helpers: `cvmToString()`, `cvmToBoolean()`
- Arrays as objects with type discriminator

#### Storage Abstraction
- Interface-based design (StorageAdapter)
- Two implementations: MongoDB and File
- File storage uses .cvm directory structure
- Output stored separately from execution state

#### Compiler Architecture
- Uses TypeScript AST directly via ts.createSourceFile()
- Single-pass with backpatching for jumps
- Context stack for nested control structures (if/while/foreach)
- CompilerState class manages bytecode emission
- Iterator stack for nested for-of loops
- Smart literal detection for CONCAT vs ADD

#### VM Execution
- Stack-based with CVMValue[] stack
- Each opcode pops operands, executes, pushes results
- Program counter (pc) controls flow
- Jump instructions modify pc directly

## Critical Implementation Paths

### Control Flow Patterns
```
If Statement:
  [condition] → JUMP_IF_FALSE else_addr → [then] → JUMP end → [else] → [end]

While Loop:
  [start] → [condition] → JUMP_IF_FALSE end → [body] → JUMP start → [end]

For-of Loop:
  [array] → ITER_START → [loop_start] → ITER_NEXT → JUMP_IF_FALSE end 
  → STORE var → [body] → JUMP loop_start → [end] → ITER_END

Break/Continue:
  BREAK target_addr  (jumps to loop end)
  CONTINUE target_addr  (jumps to loop start)
```

### Jump Resolution
1. Emit jump with placeholder (-1)
2. Track instruction index
3. Continue compilation
4. Patch jump address when target known

## Security & Resource Management
- No file system access (until Phase 4)
- No network access
- Stack depth limits
- Execution step limits
- Output stored separately (no buffer overflow)

## Development Patterns
- **STRICT TDD**: Test first, always
- **NX Commands**: All builds via nx
- **ES Modules**: Use .js imports everywhere
- **Type Safety**: No any types, explicit checks