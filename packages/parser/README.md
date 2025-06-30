# @cvm/parser

The parser package is responsible for transforming CVM TypeScript-like source code into bytecode instructions that can be executed by the CVM virtual machine.

## Overview

This package provides:
- **Parser**: Validates CVM language rules and creates an AST using TypeScript's compiler API
- **Compiler**: Transforms the AST into stack-based bytecode using the visitor pattern
- **Bytecode**: Defines all VM instruction opcodes

## Architecture

```
Source Code → Parser → AST → Compiler → Bytecode
```

### Components

1. **Parser** (`parser.ts`)
   - Uses TypeScript's compiler API to parse source code
   - Validates CVM-specific rules (e.g., main function requirements)
   - Detects unsupported features (setTimeout, fetch, require, etc.)

2. **Compiler** (`compiler.ts`)
   - Implements visitor pattern for AST traversal
   - Manages compiler state (variables, labels, loops)
   - Generates stack-based bytecode instructions

3. **Bytecode** (`bytecode.ts`)
   - Defines all OpCode instructions
   - Provides type-safe instruction format

4. **Compiler State** (`compiler-state.ts`)
   - Tracks variables, labels, and control flow
   - Manages loop contexts for break/continue
   - Handles bytecode emission and patching

## Supported Language Features

### ✅ Supported
- Variables (`var`)
- Basic types: string, number, boolean, null, undefined
- Control flow: if/else, while, for...of
- Arrays and array methods (push, length, filter, map)
- Objects and property access
- String operations and methods
- Logical operators: &&, ||, !
- Comparison: ===, !==, <, >, <=, >=
- Arithmetic: +, -, *, /, %
- Type checking: typeof
- Functions (without parameters)
- CC() for cognitive checkpoints

### ❌ Not Supported
- Classes and `new` keyword
- `async`/`await` 
- `import`/`require`
- Traditional for(;;) loops
- Function parameters
- try/catch
- Destructuring
- Spread operator
- Template literals

## Usage

```typescript
import { compile } from '@cvm/parser';

const source = `
function main() {
  var x = 10;
  var result = CC("What is x + 5?");
  return result;
}
`;

const { success, bytecode, errors } = compile(source);

if (success) {
  // bytecode array contains instructions like:
  // [
  //   { op: OpCode.PUSH, operand: 10 },
  //   { op: OpCode.STORE, operand: 'x' },
  //   { op: OpCode.PUSH, operand: 'What is x + 5?' },
  //   { op: OpCode.CALL, operand: 'CC' },
  //   ...
  // ]
}
```

## Key Design Decisions

1. **TypeScript Compiler API**: Leverages TypeScript's mature parser instead of building from scratch
2. **Visitor Pattern**: Clean separation between AST nodes and compilation logic
3. **Stack-Based VM**: All operations work with a stack, enabling pause/resume
4. **No Exceptions**: Compilation returns success/failure with error details

## Testing

The package includes comprehensive test coverage for:
- All language constructs
- Error cases and edge conditions  
- Bytecode generation correctness
- Compiler state management

Run tests:
```bash
npx nx test parser
```

## Dependencies

None (uses TypeScript compiler API which is a devDependency)