# CVM Internals and Debugging Reference

**Purpose**: Complete technical reference for debugging CVM programs based on actual CVM source code implementation.

## CVM Mission and Paradigm

### What CVM Is Designed For

**CVM (Cognitive Virtual Machine) is an algorithmic TODO manager for Claude.** It transforms complex multi-step tasks into guided, stateful programs that prevent Claude from losing context during long workflows.

### The Core Problem CVM Solves

**Traditional Approach:**
```
User: "Analyze these 1000 files and generate reports"
Claude: *Starts task* → *Gets overwhelmed* → *Loses context* → *Incomplete work*
```

**CVM Approach:**
```typescript
// Program guides Claude step-by-step
function main() {
  const files = fs.listFiles("./data");
  
  for (const file of files) {
    // CC() creates a TODO for Claude - VM waits patiently
    const analysis = CC("Analyze file: " + file.name + " - extract key metrics");
    
    // VM continues only after Claude completes the task
    const report = CC("Generate report for " + file.name + " based on: " + analysis);
    
    fs.writeFile("reports/" + file.name + ".md", report);
  }
}
```

### The Execution Paradigm: "Claude as CPU"

**Revolutionary Inversion of Control:**
- **Traditional**: Program calls AI → AI responds → Program continues
- **CVM**: Program pauses → AI pulls task → AI works/thinks/discusses → AI submits → Program continues

### Key Characteristics

1. **Infinite Patience**: CVM waits forever at CC() calls - no timeouts, no pressure
2. **Perfect State Preservation**: Variables, progress, context never lost between CC() calls  
3. **Human-AI Collaboration**: User can interrupt at any CC() point to discuss or redirect
4. **Guided Workflows**: Program structure prevents Claude from wandering off-task
5. **Resumable Execution**: Can pause, close terminal, come back tomorrow - execution continues exactly where it left off

### What CVM Programs Look Like

```typescript
function main() {
  console.log("=== Multi-Step Task Orchestration ===");
  
  // Phase 1: Data Collection
  const files = CC("Find all .ts files in src/ directory that need refactoring");
  
  // Phase 2: Analysis (guided by program structure)  
  for (const file of JSON.parse(files)) {
    const issues = CC("Analyze " + file + " - identify code smells and improvement opportunities");
    const priority = CC("Rate priority of fixes for " + file + " (1-10) based on: " + issues);
    
    // VM ensures every file gets processed - no skipping!
    if (+priority >= 7) {
      const fixes = CC("Generate specific refactoring plan for " + file);
      fs.writeFile("refactoring/" + file + ".plan", fixes);
    }
  }
  
  // Phase 3: Implementation Planning  
  const summary = CC("Create master refactoring roadmap from all high-priority plans");
  
  console.log("Task orchestration complete - roadmap saved");
}
```

### CVM vs Traditional Programming

| Aspect | Traditional Programming | CVM Programming |
|--------|----------------------|-----------------|
| **Execution** | Deterministic, automated | Interactive, human-guided |
| **Purpose** | Compute results | Orchestrate human tasks |
| **Timeouts** | Milliseconds/seconds | Infinite patience |
| **State** | Ephemeral during execution | Persistent across sessions |
| **Interruption** | Crashes or hangs | Natural collaboration points |
| **Complexity** | Limited by memory/compute | Unlimited via human cognition |

### When to Use CVM

**Perfect For:**
- Multi-step analysis workflows (analyze 100s of files)
- Complex decision trees requiring human judgment
- Tasks requiring context preservation across sessions
- Workflows where each step builds on previous results
- Quality assurance processes with no shortcuts allowed

**Not For:**
- Simple computations (use regular code)
- Real-time processing
- Fully automated tasks without human input
- Simple API calls or data transformations

### The "GPS for Claude" Analogy

CVM is like GPS navigation for complex tasks:
- **GPS knows the route** (CVM program structure)
- **You drive step by step** (Claude executes CC() calls)  
- **GPS waits for you** (CVM pauses at CC() instructions)
- **Can handle detours** (User can interrupt and discuss)
- **Never loses the destination** (Program structure maintains goal)

## Table of Contents

1. [CVM Architecture Overview](#1-cvm-architecture-overview)
2. [Actual Bytecode Instruction Set](#2-actual-bytecode-instruction-set)  
3. [VM Execution Model](#3-vm-execution-model)
4. [State Management Implementation](#4-state-management-implementation)
5. [CC() Implementation Details](#5-cc-implementation-details)
6. [File System Structure](#6-file-system-structure)
7. [Handler Architecture](#7-handler-architecture)
8. [State Serialization](#8-state-serialization)
9. [Debugging Workflow](#9-debugging-workflow)
10. [Common Issues & Solutions](#10-common-issues--solutions)

---

## 1. CVM Architecture Overview

### 1.1 Package Structure (from source)

```
packages/
├── parser/          # TypeScript → AST → Bytecode compilation
│   ├── bytecode.ts  # OpCode enum and Instruction interface
│   └── compiler.ts  # AST to bytecode compilation
├── vm/              # Stack-based virtual machine execution
│   ├── vm.ts        # Core VM execution engine
│   ├── vm-manager.ts # High-level execution management
│   └── handlers/    # Opcode implementations
├── storage/         # State persistence (file & MongoDB)
├── types/           # Shared type definitions
├── mcp-server/      # Model Context Protocol integration
└── mongodb/         # Database connectivity
```

### 1.2 Execution Flow (from VMManager)

1. **Load**: `loadProgram()` → compile TypeScript → save Program to storage
2. **Start**: `startExecution()` → create Execution record → initialize VM state
3. **Run**: VM executes bytecode instructions sequentially
4. **CC() Pause**: Handler sets status to 'waiting_cc', saves state
5. **Resume**: `resume()` pushes CC result to stack, continues execution
6. **Complete**: VM reaches HALT or error, final state saved

---

## 2. Actual Bytecode Instruction Set

**From `/packages/parser/src/lib/bytecode.ts`:**

### 2.1 Stack Operations
```typescript
PUSH = 'PUSH',              // Push literal value to stack
PUSH_UNDEFINED = 'PUSH_UNDEFINED', // Push undefined to stack
POP = 'POP',                // Remove top stack item
DUP = 'DUP',                // Duplicate top item
DUP2 = 'DUP2',              // Duplicate top 2 items
SWAP = 'SWAP',              // Swap top 2 stack items
```

### 2.2 Variable Operations
```typescript
LOAD = 'LOAD',              // Load variable to stack
STORE = 'STORE',            // Store stack top to variable
```

### 2.3 Arithmetic Operations
```typescript
ADD = 'ADD',                // Add two values
SUB = 'SUB',                // Subtract
MUL = 'MUL',                // Multiply
DIV = 'DIV',                // Divide
MOD = 'MOD',                // Modulo
```

### 2.4 Unary Operations
```typescript
UNARY_MINUS = 'UNARY_MINUS', // Negate value
UNARY_PLUS = 'UNARY_PLUS',   // Convert to number (+value)
INC = 'INC',                 // Increment (++)
DEC = 'DEC',                 // Decrement (--)
```

### 2.5 Comparison Operations
```typescript
EQ = 'EQ',                   // ==
NEQ = 'NEQ',                 // !=
LT = 'LT',                   // <
GT = 'GT',                   // >
LTE = 'LTE',                 // <=
GTE = 'GTE',                 // >=
EQ_STRICT = 'EQ_STRICT',     // ===
NEQ_STRICT = 'NEQ_STRICT',   // !==
```

### 2.6 Control Flow
```typescript
JUMP = 'JUMP',               // Unconditional jump
JUMP_IF = 'JUMP_IF',         // Jump if truthy
JUMP_IF_FALSE = 'JUMP_IF_FALSE', // Jump if falsy
JUMP_IF_TRUE = 'JUMP_IF_TRUE',   // Jump if truthy
CALL = 'CALL',               // Function call
RETURN = 'RETURN',           // Return from function
BREAK = 'BREAK',             // Break from loop
CONTINUE = 'CONTINUE',       // Continue loop
```

### 2.7 Array Operations
```typescript
ARRAY_NEW = 'ARRAY_NEW',     // Create new array
ARRAY_PUSH = 'ARRAY_PUSH',   // Push to array
ARRAY_GET = 'ARRAY_GET',     // Get array element
ARRAY_SET = 'ARRAY_SET',     // Set array element
ARRAY_LEN = 'ARRAY_LEN',     // Get array length
ARRAY_SLICE = 'ARRAY_SLICE', // Slice array
ARRAY_JOIN = 'ARRAY_JOIN',   // Join array to string
ARRAY_INDEX_OF = 'ARRAY_INDEX_OF', // Find index of element
```

### 2.8 String Operations
```typescript
STRING_LEN = 'STRING_LEN',
STRING_SUBSTRING = 'STRING_SUBSTRING',
STRING_INDEXOF = 'STRING_INDEXOF',
STRING_SPLIT = 'STRING_SPLIT',
STRING_SLICE = 'STRING_SLICE',
STRING_CHARAT = 'STRING_CHARAT',
STRING_TOUPPERCASE = 'STRING_TOUPPERCASE',
STRING_TOLOWERCASE = 'STRING_TOLOWERCASE',
STRING_INCLUDES = 'STRING_INCLUDES',
STRING_ENDS_WITH = 'STRING_ENDS_WITH',
STRING_STARTS_WITH = 'STRING_STARTS_WITH',
STRING_TRIM = 'STRING_TRIM',
STRING_REPLACE = 'STRING_REPLACE',
STRING_REPLACE_ALL = 'STRING_REPLACE_ALL',
// ... more string operations
```

### 2.9 RegExp Operations
```typescript
LOAD_REGEX = 'LOAD_REGEX',   // Create RegExp object
REGEX_TEST = 'REGEX_TEST',   // Test pattern against string
STRING_MATCH = 'STRING_MATCH', // Match string against regex
STRING_REPLACE_REGEX = 'STRING_REPLACE_REGEX', // Replace with regex
```

### 2.10 Object Operations
```typescript
OBJECT_CREATE = 'OBJECT_CREATE', // Create new object
PROPERTY_GET = 'PROPERTY_GET',   // Get object property
PROPERTY_SET = 'PROPERTY_SET',   // Set object property
OBJECT_KEYS = 'OBJECT_KEYS',     // Get object keys
JSON_STRINGIFY = 'JSON_STRINGIFY', // Stringify object
```

### 2.11 File System Operations
```typescript
FS_LIST_FILES = 'FS_LIST_FILES', // List directory contents
FS_READ_FILE = 'FS_READ_FILE',   // Read file contents
FS_WRITE_FILE = 'FS_WRITE_FILE', // Write file contents
```

### 2.12 Iterator Operations
```typescript
ITER_START = 'ITER_START',       // Start array iteration
ITER_NEXT = 'ITER_NEXT',         // Get next iterator value
ITER_END = 'ITER_END',           // Check if iteration complete
OBJECT_ITER_START = 'OBJECT_ITER_START', // Start object iteration
OBJECT_ITER_NEXT = 'OBJECT_ITER_NEXT',   // Get next object key
```

### 2.13 Special Operations
```typescript
CC = 'CC',                   // Cognitive call (pause execution)
PRINT = 'PRINT',             // Console.log output
HALT = 'HALT',               // End program execution
TO_STRING = 'TO_STRING',     // Convert value to string
CONCAT = 'CONCAT',           // String concatenation
LENGTH = 'LENGTH',           // Universal length operation
TYPEOF = 'TYPEOF',           // Get type of value
JSON_PARSE = 'JSON_PARSE',   // Parse JSON string
```

---

## 3. VM Execution Model

### 3.1 VMState Structure (from vm.ts)

```typescript
export interface VMState {
  pc: number;                    // Program counter
  stack: CVMValue[];             // Execution stack
  variables: Map<string, CVMValue>; // Variable storage
  status: VMStatus;              // 'running'|'waiting_cc'|'complete'|'error'
  output: string[];              // Console output
  ccPrompt?: string;             // Current CC() prompt
  error?: string;                // Error message
  iterators: IteratorContext[];  // For-loop iteration state
  returnValue?: CVMValue;        // Return value from main()
  fileSystem?: FileSystemService; // File system access
  heap: VMHeap;                  // Object/array storage
}
```

### 3.2 Execution Loop (from vm.ts)

```typescript
// Main execution loop
while (state.status === 'running' && state.pc < bytecode.length) {
  const instruction = bytecode[state.pc];
  const handler = handlers[instruction.op];
  
  // Validate stack requirements
  if (state.stack.length < handler.stackIn) {
    state.status = 'error';
    state.error = `${OpCode[instruction.op]}: Stack underflow`;
    break;
  }
  
  // Execute handler
  const executionError = handler.execute(state, instruction);
  if (executionError) {
    state.status = 'error';
    state.error = executionError.message;
    break;
  }
  
  // Advance PC (unless handler controls it)
  if (!handler.controlsPC) {
    state.pc++;
  }
}
```

### 3.3 Handler Interface (from handlers/types.ts)

```typescript
export interface OpcodeHandler {
  execute: (state: VMState, instruction: Instruction) => VMError | void;
  stackIn: number;    // Values popped from stack
  stackOut: number;   // Values pushed to stack
  controlsPC?: boolean; // Whether handler manages PC
}
```

---

## 4. State Management Implementation

### 4.1 Heap Structure (from vm-heap.ts)

```typescript
export interface VMHeap {
  objects: Record<number, HeapObject>;
  nextId: number;
}

interface HeapObject {
  type: 'array' | 'object' | 'regex';
  data: CVMArray | CVMObject | any;
}
```

### 4.2 CVMValue Types (from types/cvm-value.ts)

```typescript
export type CVMValue = string | boolean | number | CVMArray | CVMObject | 
                      CVMArrayRef | CVMObjectRef | null | CVMUndefined;

export interface CVMArray {
  type: 'array';
  elements: CVMValue[];
  properties?: Record<string, CVMValue>;
}

export interface CVMObject {
  type: 'object';
  properties: Record<string, CVMValue>;
}

export interface CVMArrayRef {
  type: 'array-ref';
  id: number;  // Reference to heap object
}

export interface CVMObjectRef {
  type: 'object-ref'; 
  id: number;  // Reference to heap object
}
```

### 4.3 Execution States (from types/types.ts)

```typescript
export interface Execution {
  id: string;
  programId: string;
  state: 'READY' | 'RUNNING' | 'AWAITING_COGNITIVE_RESULT' | 'COMPLETED' | 'ERROR';
  pc: number;
  stack: CVMValue[];
  variables: Record<string, CVMValue>;
  iterators?: IteratorState[];
  heap?: {
    objects: Record<number, { type: 'array' | 'object'; data: CVMValue }>;
    nextId: number;
  };
  error?: string;
  ccPrompt?: string;
  returnValue?: CVMValue;
  created: Date;
  updated?: Date;
}
```

---

## 5. CC() Implementation Details

### 5.1 CC Handler (from handlers/io.ts)

```typescript
[OpCode.CC]: {
  stackIn: 1,        // Pops prompt from stack
  stackOut: 0,       // Pushes nothing (result added on resume)
  controlsPC: true,  // CC controls execution flow
  execute: (state, instruction) => {
    const prompt = state.stack.pop()!;
    state.ccPrompt = cvmToString(prompt);
    state.status = 'waiting_cc';
    // PC not incremented - done on resume
  }
}
```

### 5.2 Resume Process (from vm.ts)

```typescript
resume(state: VMState, ccResult: string, bytecode: Instruction[]): VMState {
  if (state.status !== 'waiting_cc') {
    throw new Error('Cannot resume: VM not waiting for CC');
  }
  
  // Push CC result and continue execution
  const newState = {
    ...state,
    stack: [...state.stack, ccResult],  // Add result to stack
    status: 'running' as VMStatus,
    ccPrompt: undefined,
    pc: state.pc + 1                    // Advance past CC instruction
  };
  
  return this.execute(bytecode, newState, state.fileSystem);
}
```

### 5.3 CC() State Transitions

```
Before CC(): 
  PC: 15, Stack: ["What's next?"], Status: 'running'
  
During CC():
  PC: 15, Stack: [], Status: 'waiting_cc', ccPrompt: "What's next?"
  
After resume("answer"):
  PC: 16, Stack: ["answer"], Status: 'running', ccPrompt: undefined
```

---

## 6. File System Structure

### 6.1 Storage Implementation (from storage/file-adapter.ts)

```typescript
// Directory structure created by FileStorageAdapter
.cvm/
├── programs/         # Program files
│   └── {id}.json    # Compiled bytecode + source
├── executions/       # Execution state files  
│   └── {id}.json    # Complete VM state snapshot
├── outputs/          # Console output files
│   └── {id}.output  # All console.log() output
└── metadata.json     # Current execution tracking
```

### 6.2 Program File Format

```json
{
  "id": "program-name",
  "name": "program-name",
  "source": "function main() { ... }",
  "bytecode": [
    {"op": "PUSH", "arg": 1},
    {"op": "STORE", "arg": "counter"},  
    {"op": "CC"},
    {"op": "HALT"}
  ],
  "created": "2025-08-06T07:44:57.696Z"
}
```

### 6.3 Execution File Format (Actual Schema)

```json
{
  "id": "execution-id",
  "programId": "program-id",
  "state": "AWAITING_COGNITIVE_RESULT",
  "pc": 15,
  "stack": ["user-input"],
  "variables": {
    "counter": 5,
    "result": "success"
  },
  "heap": {
    "objects": {
      "1": {
        "type": "array",
        "data": {"type": "array", "elements": [1,2,3]}
      }
    },
    "nextId": 2
  },
  "iterators": [],
  "ccPrompt": "What comes next?",
  "created": "2025-08-06T07:45:00.863Z"
}
```

---

## 7. Handler Architecture

### 7.1 Handler Categories (from handlers/index.ts)

```typescript
export const handlers: Partial<Record<OpCode, OpcodeHandler>> = {
  ...arithmeticHandlers,    // ADD, SUB, MUL, DIV, MOD
  ...stackHandlers,         // PUSH, POP, DUP, SWAP
  ...ioHandlers,           // PRINT, CC
  ...controlHandlers,      // JUMP, JUMP_IF_FALSE, etc.
  ...variableHandlers,     // LOAD, STORE
  ...iteratorHandlers,     // ITER_START, ITER_NEXT, ITER_END
  ...comparisonHandlers,   // EQ, LT, GT, etc.
  ...logicalHandlers,      // AND, OR, NOT
  ...arrayHandlers,        // ARRAY_NEW, ARRAY_PUSH, etc.
  ...stringHandlers,       // STRING_LEN, STRING_SPLIT, etc.
  ...objectHandlers,       // OBJECT_CREATE, PROPERTY_GET, etc.
  ...regexHandlers,        // LOAD_REGEX, REGEX_TEST, etc.
  ...unifiedHandlers,      // GET, SET (unified access)
};
```

### 7.2 Handler Validation

Each handler specifies:
- `stackIn`: Required stack depth before execution
- `stackOut`: Stack items pushed after execution  
- `controlsPC`: Whether handler manages program counter
- `execute`: Implementation function

VM validates stack depth before calling handlers.

---

## 8. State Serialization

### 8.1 Variable Serialization (VMManager)

```typescript
// Variables stored as Map<string, CVMValue> internally
// Serialized as Record<string, CVMValue> in JSON

// Conversion during save:
variables: Object.fromEntries(vmState.variables)

// Conversion during load:
variables: new Map(Object.entries(execution.variables))
```

### 8.2 Heap Serialization

```typescript
// Heap objects stored with numeric IDs
// References stored as CVMArrayRef/CVMObjectRef with id field
// Full object data stored in heap.objects[id]

{
  "heap": {
    "objects": {
      "1": {
        "type": "array",
        "data": {"type": "array", "elements": [1, 2, 3]}
      }
    },
    "nextId": 2
  }
}
```

---

## 9. Debugging Workflow

### 9.1 Interactive Debugging Process

```typescript
// 1. Load program 
const program = await Read('/path/to/program.ts');
await mcp__cvm__loadFile('debug-program', '/path/to/program.ts');

// 2. Start execution
await mcp__cvm__start('debug-program', 'debug-execution');

// 3. Step through CC() calls
while (true) {
  const task = await mcp__cvm__getTask('debug-execution');
  if (task === 'Execution completed') break;
  
  // Inspect state before responding
  const state = await Read('.cvm/executions/debug-execution.json');
  const output = await Read('.cvm/outputs/debug-execution.output');
  
  // Analyze: PC position, stack contents, variables, heap
  console.log(`PC: ${state.pc}, Stack: ${JSON.stringify(state.stack)}`);
  
  // Submit dry-run response
  await mcp__cvm__submitTask('debug-execution', 'dry-run-response');
}
```

### 9.2 Adding Debug Logging

```typescript
// Strategic console.log placement in CVM programs:
function main() {
  console.log("DEBUG: Program start");
  let counter = 1;
  
  while (counter < 5) {
    console.log("DEBUG: Loop iteration, counter=" + counter);
    
    const prompt = "Current number is " + counter + ". What's next?";
    console.log("DEBUG: About to call CC with: " + prompt);
    
    const result = CC(prompt);
    console.log("DEBUG: CC returned: " + result);
    
    const oldCounter = counter;
    counter = +result;
    console.log("DEBUG: Updated counter from " + oldCounter + " to " + counter);
  }
  
  console.log("DEBUG: Program complete");
}
```

### 9.3 State Analysis Checklist

**Program Counter (PC):**
- Is PC at expected bytecode instruction?
- Does PC advance correctly after each instruction?
- Are jump targets correct?

**Stack State:**
- Does stack have expected depth before operations?
- Are values on stack of correct type?
- Is stack cleaned up properly?

**Variables:**
- Are variables initialized before use?
- Do variable updates persist?
- Are variable types correct?

**Heap Objects:**
- Are object references valid?
- Is heap growing unexpectedly?
- Are object properties accessible?

---

## 10. Common Issues & Solutions

### 10.1 Stack Underflow

**Signature in state:**
```json
{
  "error": "ADD: Stack underflow",
  "stack": [],
  "pc": 15
}
```

**Root Cause:** Operation expects values on stack but stack is empty
**Solution:** Check bytecode generation - missing PUSH instructions

### 10.2 Variable Not Found

**Signature:** VM attempts LOAD on undefined variable
**Detection:** Check `variables` object in state file
**Solution:** Ensure variable is STOREd before LOADing

### 10.3 Invalid Jump Target

**Signature:**
```json
{
  "error": "Invalid jump target: 150",
  "pc": 25
}
```

**Root Cause:** Jump instruction points beyond bytecode array
**Solution:** Check compiler loop/condition generation

### 10.4 Heap Reference Errors

**Signature:** CVMArrayRef/CVMObjectRef points to non-existent heap ID
**Detection:** Cross-reference ref.id with heap.objects keys
**Solution:** Check object creation and reference assignment

### 10.5 CC() Prompt Issues

**Signature:**
```json
{
  "ccPrompt": "Current number is undefined. What's next?",
  "stack": []
}
```

**Root Cause:** String interpolation failed - variable undefined
**Solution:** Add console.log to trace variable values before CC()

---

## 11. Pino Logging System

CVM uses Pino for structured JSON logging to enable debugging of complex execution flows, particularly for investigating issues like "Invalid jump target: -1" bugs.

### 11.1 Configuration

- **Default log file**: `.cvm/cvm-debug.log`
- **Default log level**: `info`
- **Overrides**: 
  - `CVM_LOG_FILE`: Custom log file path
  - `CVM_LOG_LEVEL`: Custom log level (trace, debug, info, warn, error, fatal)

### 11.2 Log Levels

- **trace (10)**: Most verbose, includes all execution details
- **debug (20)**: Debug information for development
- **info (30)**: Standard operational messages (default)
- **warn (40)**: Warning messages
- **error (50)**: Error conditions
- **fatal (60)**: Fatal errors causing shutdown

### 11.3 Usage Examples

```bash
# Default logging (info level to .cvm/cvm-debug.log)
npx tsx mcp-test-client.ts "../programs/01-basics/variables-and-output.ts"

# Debug logging
CVM_LOG_LEVEL=debug npx tsx mcp-test-client.ts "../programs/test.ts"

# Custom log file
CVM_LOG_FILE=./custom-debug.log npx tsx mcp-test-client.ts "../programs/test.ts"

# Combined
CVM_LOG_LEVEL=debug CVM_LOG_FILE=./trace.log npx tsx mcp-test-client.ts "../programs/test.ts"
```

### 11.4 Log Format

Structured JSON format with:
- `level`: Numeric log level (20=debug, 30=info, 40=warn, 50=error)
- `time`: Unix timestamp in milliseconds
- `pid`: Process ID
- `hostname`: Server hostname
- `msg`: Log message
- Additional structured data fields for context

Example log entry:
```json
{"level":30,"time":1754479731962,"pid":194041,"hostname":"LACOWIN11","msg":"CVM Server main() function started"}
```

### 11.5 Implementation Details

- **Location**: `packages/types/src/lib/logger.ts`
- **Import**: `import { logger } from '@cvm/types'`
- **File Destination**: Uses `pino.destination()` for async file I/O
- **MCP Compatibility**: Logs to files since stdout is used for MCP protocol

### 11.6 Debugging Workflow with Pino

1. Set appropriate log level based on issue complexity
2. Run CVM operation that reproduces the issue
3. Analyze structured logs in the designated log file
4. Use log data to trace execution flow and identify problems

---

## CRITICAL: CVM Logging Standards - UNDERSTAND THIS CONCEPT

**FORBIDDEN**: `console.log`, `console.error`, `console.warn`, `console.debug`
**REQUIRED**: Use ONLY the logger from `@cvm/types`

### FUNDAMENTAL CONCEPT - LOGGER WRITES TO FILES ONLY
- **Logger output**: Goes to `.cvm/cvm-debug.log` file ONLY
- **NOT** to console, stdout, stderr, or any system output
- **To see debug logs**: Read the log file: `cat .cvm/cvm-debug.log`
- **To capture logs**: DON'T redirect stdout/stderr - read the log file!

### Log Level Usage:
- **info**: Production messages (3-4 max): "Server starting", "Server stopping" 
- **debug**: Development debugging information → **WRITES TO FILE**
- **trace**: Detailed execution tracing (most verbose) → **WRITES TO FILE**

### Examples:
```typescript
// ❌ WRONG - NEVER USE
console.log("Debug info");
console.error("Error occurred");

// ✅ CORRECT - WRITES TO .cvm/cvm-debug.log FILE
import { logger } from '@cvm/types';
logger.info("CVM Server starting");
logger.debug("Compiling statement", { kind: nodeName, line: line + 1 });
logger.trace("VM executing", { pc, opcode, stackSize: state.stack.length });
```

### How to See Logger Output:
```bash
# Run CVM operation
CVM_LOG_LEVEL=debug ./test/programs/run-test.sh program.ts

# View logger output from FILE (not console!)
cat .cvm/cvm-debug.log
tail -50 .cvm/cvm-debug.log  
grep "debug" .cvm/cvm-debug.log
```

**Why this matters**: Logger uses Pino file-based structured JSON logging. Console methods go to stdout/stderr. Logger goes to FILES. They are completely separate systems!

## Golden Rules for CVM Debugging

1. **Trust the State Files** - They contain absolute truth about VM execution
2. **Use ONLY logger** - Never use console.log/error - use logger.debug/trace
3. **Use Pino Structured Logs** - Leverage JSON logs for execution flow analysis
4. **Step Through Interactively** - Use getTask/submitTask for complex programs
5. **Check Stack Depth** - Verify handler requirements match actual stack
6. **Trace PC Movement** - Ensure program counter advances correctly
7. **Validate References** - Ensure heap object IDs are valid
8. **Monitor Variable Evolution** - Track how variables change over iterations

The CVM implementation is deterministic and traceable. Every aspect of execution is captured in the state files. Debug by following the evidence, not assumptions.