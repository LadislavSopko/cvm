# CVM Handler Architecture

## Overview

The CVM uses a handler pattern for executing bytecode instructions. Each opcode has a dedicated handler that implements the `OpcodeHandler` interface.

## Handler Interface

```typescript
interface OpcodeHandler {
  stackIn: number;   // Number of values popped from stack
  stackOut: number;  // Number of values pushed to stack
  execute: (state: VMState, instruction: Instruction) => void;
}
```

## Handler Organization

Handlers are organized by functionality in separate files:

### Core Operations
- **arithmetic.ts**: Mathematical operations (ADD, SUBTRACT, MULTIPLY, etc.)
- **comparison.ts**: Comparison operations (EQ, LT, GT, etc.)
- **logical.ts**: Boolean operations (AND, OR, NOT)

### Data Types
- **arrays.ts**: Array operations (ARRAY_NEW, ARRAY_PUSH, etc.)
- **objects.ts**: Object operations (OBJECT_NEW, PROPERTY_GET/SET)
- **strings.ts**: String operations (STRING_CONCAT, SUBSTRING, etc.)

### Control Flow
- **control.ts**: Flow control (JUMP, JUMP_IF_FALSE, RETURN, etc.)
- **iterators.ts**: For-of loop support (ITER_START, ITER_NEXT, ITER_END)

### I/O and Variables
- **io.ts**: Input/output operations (CONSOLE_LOG, CALL for CC)
- **variables.ts**: Variable operations (LOAD, STORE)
- **stack.ts**: Stack manipulation (PUSH, POP, DUP)

### Special Handlers
- **unified.ts**: Unified GET/SET operations for all accessor patterns
- **advanced.ts**: Complex operations (TYPEOF, TO_STRING, etc.)

## Handler Pattern Benefits

### 1. Modularity
Each handler is self-contained with clear responsibilities:
```typescript
export const addHandler: OpcodeHandler = {
  stackIn: 2,
  stackOut: 1,
  execute: (state, instruction) => {
    const b = state.stack.pop()!;
    const a = state.stack.pop()!;
    state.stack.push(performAdd(a, b));
  }
};
```

### 2. Type Safety
Handlers use TypeScript for compile-time safety:
```typescript
function performAdd(a: CVMValue, b: CVMValue): CVMValue {
  if (isCVMNumber(a) && isCVMNumber(b)) {
    return a + b;
  }
  // String concatenation fallback
  return cvmToString(a) + cvmToString(b);
}
```

### 3. Testability
Each handler can be tested in isolation:
```typescript
describe('ADD handler', () => {
  it('should add two numbers', () => {
    const state = createState();
    state.stack.push(5, 3);
    addHandler.execute(state, { op: OpCode.ADD });
    expect(state.stack[0]).toBe(8);
  });
});
```

## Adding New Handlers

### 1. Define the Opcode
In `packages/parser/src/lib/bytecode.ts`:
```typescript
export enum OpCode {
  // ... existing opcodes
  MY_NEW_OP = 60,
}
```

### 2. Create Handler File
In `packages/vm/src/lib/handlers/my-feature.ts`:
```typescript
import { OpcodeHandler } from './types.js';

export const myNewOpHandler: OpcodeHandler = {
  stackIn: 1,   // How many values to pop
  stackOut: 1,  // How many values to push
  execute: (state, instruction) => {
    const value = state.stack.pop()!;
    // Implementation
    state.stack.push(result);
  }
};

export const myFeatureHandlers = {
  [OpCode.MY_NEW_OP]: myNewOpHandler,
};
```

### 3. Register Handler
In `packages/vm/src/lib/handlers/index.ts`:
```typescript
import { myFeatureHandlers } from './my-feature.js';

export const handlers = {
  // ... existing handlers
  ...myFeatureHandlers,
};
```

### 4. Write Tests
Create `packages/vm/src/lib/handlers/my-feature.spec.ts`:
```typescript
describe('MY_NEW_OP handler', () => {
  // Test cases
});
```

## Handler Best Practices

### 1. Stack Safety
Always validate stack has required values:
```typescript
// DON'T DO THIS:
const value = state.stack.pop()!;  // Dangerous!

// DO THIS (after stack-utils implementation):
const value = safePop(state);
if (isVMError(value)) {
  handleError(state, value);
  return;
}
```

### 2. Type Checking
Use type guards for type-specific operations:
```typescript
if (isCVMString(value)) {
  // String-specific logic
} else if (isCVMNumber(value)) {
  // Number-specific logic
} else {
  // Handle other types or error
}
```

### 3. Error Handling
Set proper error state instead of throwing:
```typescript
if (invalidCondition) {
  state.status = 'error';
  state.error = 'Descriptive error message';
  return;
}
```

### 4. State Mutations
Only modify state through defined interfaces:
```typescript
// Good: Using state methods
state.stack.push(value);
state.variables.set(name, value);

// Bad: Direct manipulation
state.stack[0] = value;  // Don't do this!
```

## Performance Considerations

### 1. Handler Lookup
Handlers are stored in a single object for O(1) lookup:
```typescript
const handler = handlers[instruction.op];
```

### 2. Stack Operations
Use efficient array methods:
```typescript
// Good: O(1) operations
state.stack.push(value);
state.stack.pop();

// Avoid: O(n) operations in hot paths
state.stack.unshift(value);  // Avoid if possible
```

### 3. Type Conversions
Cache type conversions when possible:
```typescript
// If converting multiple times, store result
const strValue = cvmToString(value);
// Use strValue multiple times
```

## Future Improvements

### 1. Stack Safety Utilities
Implement safePop, safePeek, safePopN for all handlers

### 2. Handler Validation
Add compile-time validation of stackIn/stackOut

### 3. Performance Monitoring
Add metrics for handler execution times

### 4. Handler Composition
Allow handlers to compose for complex operations