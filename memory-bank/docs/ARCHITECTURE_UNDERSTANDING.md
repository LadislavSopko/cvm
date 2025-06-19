# CVM Architecture Understanding

## Overview
CVM has a clean 3-stage architecture: Parser → Compiler → VM

## 1. Parser (`parser.ts`)
**MISLEADING NAME!** This is actually a **validator**, not a parser.
- Does NOT parse code or generate AST
- Only validates that program has `main()` function
- Returns list of errors
- Should be renamed to `validator.ts`

## 2. Compiler (`compiler.ts`)
This is where the real work happens:
- Uses TypeScript's AST for parsing (via `ts.createSourceFile`)
- Single-pass compilation
- Converts TypeScript AST nodes to bytecode instructions
- Key functions:
  - `compile()` - Entry point
  - `compileStatement()` - Handles statements (if, while, etc.)
  - `compileExpression()` - Handles expressions
  - `state.emit()` - Emits bytecode instructions

### Statement Compilation Pattern
```typescript
function compileStatement(node: ts.Node): void {
  if (ts.isIfStatement(node)) {
    // Handle if statement
  }
  else if (ts.isWhileStatement(node)) {
    // Handle while statement
  }
  else if (ts.isReturnStatement(node)) {
    // TO BE ADDED
  }
  // ... more statement types
}
```

## 3. VM (`vm.ts`)
Stack-based virtual machine:
- Single operand stack (`state.stack`)
- Global variables map (`state.variables`)
- Program counter (`state.pc`)
- NO CALL STACK - only supports single `main()` function

### VM State
```typescript
interface VMState {
  pc: number;
  stack: CVMValue[];
  variables: Map<string, CVMValue>;
  status: VMStatus;
  output: string[];
  ccPrompt?: string;
  error?: string;
  iterators: IteratorContext[];
  // returnValue?: CVMValue; // TO BE ADDED
}
```

### OpCode Execution Pattern
```typescript
switch (instruction.op) {
  case OpCode.PUSH:
    state.stack.push(instruction.arg);
    state.pc++;
    break;
  case OpCode.RETURN:
    // Already exists but incomplete
    break;
  // ... more opcodes
}
```

## Key Limitations
1. **No Function Calls** - Only `main()` is supported
2. **No Call Stack** - Can't call/return from functions
3. **No Local Scopes** - All variables are global

## How to Add New Features

### Adding a New Statement Type (like `return`)
1. Check if opcode exists in `bytecode.ts`
2. Add/fix opcode handler in VM's switch statement
3. Add case in compiler's `compileStatement()`
4. Update any required state interfaces

### Adding a New Expression Type
1. Add opcode to `bytecode.ts`
2. Add handler in VM
3. Add case in compiler's `compileExpression()`

### Adding a New Operator
1. Add opcode to `bytecode.ts`
2. Add VM handler (usually pops operands, pushes result)
3. Update `compileBinaryExpression()` in compiler

## Testing Patterns
- VM tests: Test opcodes directly with bytecode
- Compiler tests: Test AST → bytecode conversion
- Integration tests: Test full TypeScript → execution flow

## Current Task: Implementing Return
1. ✅ RETURN opcode exists but has bug
2. ❌ VMState missing `returnValue` property
3. ❌ Compiler doesn't handle return statements
4. ❌ MCP server doesn't return the value to AI

The RETURN implementation should:
- In `main()`: Set return value and halt program
- Future: When functions exist, pop call frame and continue