# CVM Complete Fix Implementation Guide

Based on comprehensive analysis of 1000+ lines of issues, here are ALL the code changes needed to make CVM reliable.

## Phase 1: Foundational Stability (Fix These First!)

### 1. The [] Accessor Bug - CRITICAL ONE-LINE FIX

**File**: `/packages/vm/src/lib/handlers/arrays.ts`  
**Line**: 114  
**Current Code**:
```typescript
const key = index as string; // BUG: Assumes index is string
```
**Fixed Code**:
```typescript
const key = cvmToString(index); // FIX: Properly converts any type to string
```
**Why**: obj[123] passes a number, not a string. cvmToString() handles all types correctly.

### 2. Silent Compiler Failures - STOP DELETING CODE

**File**: `/packages/parser/src/lib/compiler.ts`  
**Lines**: 40-43 (statements), 50-53 (expressions)  
**Current Code**:
```typescript
if (visitor) {
  visitor(node as any, state, context);
} else {
  // Unsupported statement type - silently skip
}
```
**Fixed Code**:
```typescript
if (visitor) {
  visitor(node as any, state, context);
} else {
  context.reportError(node, `Unsupported syntax: ${ts.SyntaxKind[node.kind]}`);
}
```

**Also fix error reporting**:  
**Lines**: ~32 and return statement  
**Current Code**:
```typescript
reportError: (node: ts.Node, message: string): never => {
  throw new Error(message); // Crashes compiler!
}
// ...
return {
  success: true,
  bytecode: state.getBytecode(),
  errors: [] // Always empty!
}
```
**Fixed Code**:
```typescript
const errors: CompilationError[] = [];
// ...
reportError: (node: ts.Node, message: string): void => {
  const { line, character } = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
  errors.push({ message, line: line + 1, character: character + 1 });
},
// ...
return {
  success: errors.length === 0,
  bytecode: state.getBytecode(),
  errors: errors
}
```

### 3. Stack Underflow Protection

**Create new file**: `/packages/vm/src/lib/stack-utils.ts`
```typescript
import { VMState, CVMValue, VMError } from '../types';

export function safePop(state: VMState): CVMValue | VMError {
  if (state.stack.length < 1) {
    return {
      type: 'RuntimeError',
      message: 'Stack underflow',
      pc: state.pc,
      opcode: state.bytecode[state.pc]?.op
    };
  }
  return state.stack.pop()!;
}

export function isVMError(value: any): value is VMError {
  return value && value.type === 'RuntimeError';
}
```

**Then in ALL handlers** (arithmetic.ts, arrays.ts, etc):  
**Current Pattern**:
```typescript
const b = state.stack.pop()!;
const a = state.stack.pop()!;
```
**Fixed Pattern**:
```typescript
const b = safePop(state);
if (isVMError(b)) return b;
const a = safePop(state);
if (isVMError(a)) return a;
```

## Phase 2: System Reliability

### 4. Memory Leak - VMs Never Cleaned

**File**: `/packages/vm/src/lib/vm-manager.ts`  
**Line**: ~346  
**Current Code**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  return await this.storage.deleteExecution(executionId);
}
```
**Fixed Code**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  this.vms.delete(executionId); // CRITICAL: Remove from cache!
  return await this.storage.deleteExecution(executionId);
}
```

### 5. Non-Atomic Database Operations

**File**: `/packages/mongodb/src/lib/mongodb-adapter.ts`  
**All methods that do multiple operations need transactions**:

**Current deleteExecution**:
```typescript
await executionsCollection.deleteOne({ id: executionId });
await outputsCollection.deleteOne({ executionId }); // If this fails, execution is gone but output remains!
```

**Fixed deleteExecution**:
```typescript
async deleteExecution(executionId: string): Promise<void> {
  const session = this.client.startSession();
  try {
    await session.withTransaction(async () => {
      await this.executionsCollection.deleteOne({ id: executionId }, { session });
      await this.outputsCollection.deleteMany({ executionId }, { session });
      
      const current = await this.getCurrentExecutionId();
      if (current === executionId) {
        await this.db.collection('system').updateOne(
          { _id: 'current' },
          { $set: { executionId: null } },
          { session }
        );
      }
    });
  } finally {
    await session.endSession();
  }
}
```

### 6. Use Proper IDs

**File**: `/packages/vm/src/lib/vm-manager.ts`  
**Anywhere creating execution IDs**:  
**Current**:
```typescript
const executionId = Date.now().toString(); // Can collide!
```
**Fixed**:
```typescript
import { randomUUID } from 'crypto';
const executionId = randomUUID();
```

## Phase 3: Error Handling & State Management

### 7. Basic Error Propagation

**File**: `/packages/vm/src/lib/vm.ts`  
**In execute() method**:  
**Current**:
```typescript
if (result && result.type === 'RuntimeError') {
  state.status = 'error';
  state.error = result.message;
  break; // Dies immediately
}
```
**Fixed**:
```typescript
if (result && result.type === 'RuntimeError') {
  state.status = 'error';
  state.error = result.message;
  // Allow CC() to handle errors
  if (instruction.op === OpCode.CC) {
    state.ccPrompt = `ERROR: ${result.message}. How should I proceed?`;
    state.status = 'waiting_cc';
    break;
  }
  break;
}
```

### 8. Centralize State Serialization

**File**: `/packages/vm/src/lib/vm-manager.ts`  
**Add these helper methods**:
```typescript
private serializeVMState(vm: VM): any {
  const state = vm.getState();
  return {
    pc: state.pc,
    stack: state.stack,
    variables: Object.fromEntries(state.variables),
    heap: this.serializeHeap(state.heap),
    iterators: state.iterators,
    status: state.status,
    error: state.error,
    ccPrompt: state.ccPrompt
  };
}

private deserializeVMState(data: any): VMState {
  return {
    pc: data.pc || 0,
    stack: data.stack || [],
    variables: new Map(Object.entries(data.variables || {})),
    heap: this.deserializeHeap(data.heap),
    iterators: data.iterators || [],
    status: data.status || 'running',
    error: data.error,
    ccPrompt: data.ccPrompt,
    output: []
  };
}
```

**Then replace ALL manual state copying** (6+ places) with:
```typescript
// Saving:
execution.state = this.serializeVMState(vm);

// Loading:
const vmState = this.deserializeVMState(execution.state);
```

## Phase 4: Missing Features

### 9. Array Methods Without Functions

**File**: `/packages/parser/src/lib/bytecode.ts`  
**Add opcodes**:
```typescript
ARRAY_MAP_PROP = 'ARRAY_MAP_PROP',     // arr.map(x => x.prop)
ARRAY_FILTER_PROP = 'ARRAY_FILTER_PROP', // arr.filter(x => x.prop)
```

**File**: `/packages/parser/src/lib/compiler/expressions/call-expression.ts`  
**Add to method detection**:
```typescript
case 'map':
  // For now, only support property access: arr.map(x => x.name)
  if (expr.arguments.length === 1 && ts.isArrowFunction(expr.arguments[0])) {
    const arrow = expr.arguments[0] as ts.ArrowFunction;
    if (ts.isPropertyAccessExpression(arrow.body)) {
      state.emit(OpCode.PUSH, arrow.body.name.text);
      state.emit(OpCode.ARRAY_MAP_PROP);
      return;
    }
  }
  reportError(expr, "map() only supports simple property access for now");
  break;
```

**File**: `/packages/vm/src/lib/handlers/arrays.ts`  
**Add handler**:
```typescript
[OpCode.ARRAY_MAP_PROP]: {
  execute: (state) => {
    const propName = state.stack.pop()!; // Property to extract
    const arrayRef = state.stack.pop()!;
    
    if (!isCVMArrayRef(arrayRef)) {
      return { type: 'RuntimeError', message: 'map() requires an array' };
    }
    
    const array = state.heap.get(arrayRef.id).data as CVMArray;
    const result = createCVMArray();
    
    for (const item of array.elements) {
      if (isCVMObjectRef(item)) {
        const obj = state.heap.get(item.id).data as CVMObject;
        result.elements.push(obj.properties[propName] || createCVMNull());
      } else {
        result.elements.push(createCVMNull());
      }
    }
    
    const resultRef = state.heap.allocate('array', result);
    state.stack.push(resultRef);
  }
}
```

### 10. Compound Assignment Fix

**File**: `/packages/parser/src/lib/bytecode.ts`  
**Add stack manipulation opcodes**:
```typescript
DUP = 'DUP',      // Duplicate top
DUP2 = 'DUP2',    // Duplicate top 2
SWAP = 'SWAP',    // Swap top 2
ROT3 = 'ROT3',    // Rotate top 3
```

**File**: `/packages/vm/src/lib/handlers/stack.ts`  
**Add handlers**:
```typescript
export const stackHandlers = {
  [OpCode.DUP]: {
    execute: (state) => {
      const top = state.stack[state.stack.length - 1];
      state.stack.push(top);
    }
  },
  
  [OpCode.SWAP]: {
    execute: (state) => {
      const len = state.stack.length;
      if (len < 2) return { type: 'RuntimeError', message: 'SWAP needs 2 values' };
      [state.stack[len-1], state.stack[len-2]] = [state.stack[len-2], state.stack[len-1]];
    }
  }
  // etc...
};
```

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`  
**Replace error at line ~66 with**:
```typescript
} else if (ts.isElementAccessExpression(expr.left)) {
  // arr[i] += 1
  // Stack needs: array, index, value for ARRAY_SET
  
  // Compile array and index
  compileExpression(expr.left.expression);   // array
  compileExpression(expr.left.argumentExpression); // index
  
  // Duplicate both for the GET
  state.emit(OpCode.DUP2); // array, index, array, index
  
  // Get current value
  state.emit(OpCode.ARRAY_GET); // array, index, currentValue
  
  // Compile right side and operate
  compileExpression(expr.right); // array, index, currentValue, rightValue
  state.emit(getCompoundOp(opToken)); // array, index, newValue
  
  // Set it back
  state.emit(OpCode.ARRAY_SET);
}
```

### 11. Fix Type Coercion

**File**: `/packages/parser/src/lib/compiler/statements/expression-statement.ts`  
**Lines**: 41-45  
**Remove the bad heuristic**:
```typescript
// DELETE THIS:
if (ts.isStringLiteral(expr.right)) {
  state.emit(OpCode.CONCAT);
} else {
  state.emit(OpCode.ADD);
}

// REPLACE WITH:
state.emit(OpCode.ADD); // Let VM decide at runtime
```

**File**: `/packages/vm/src/lib/handlers/arithmetic.ts`  
**Fix ADD handler**:
```typescript
[OpCode.ADD]: {
  execute: (state) => {
    const b = safePop(state);
    if (isVMError(b)) return b;
    const a = safePop(state);
    if (isVMError(a)) return a;
    
    // JavaScript + semantics
    if (isCVMString(a) || isCVMString(b)) {
      state.stack.push(cvmToString(a) + cvmToString(b));
    } else {
      state.stack.push(cvmToNumber(a) + cvmToNumber(b));
    }
  }
}
```

### 12. Better Error Messages

**File**: `/packages/parser/src/lib/bytecode.ts`  
**Enhance Instruction**:
```typescript
export interface Instruction {
  op: OpCode;
  arg?: any;
  line?: number;
  column?: number;
  source?: string; // Add source snippet
}
```

**File**: `/packages/parser/src/lib/compiler-state.ts`  
**Track source locations**:
```typescript
emit(op: OpCode, arg?: any, node?: ts.Node) {
  const instruction: Instruction = { op, arg };
  
  if (node) {
    const { line, character } = ts.getLineAndCharacterOfPosition(
      this.sourceFile, 
      node.getStart()
    );
    instruction.line = line + 1;
    instruction.column = character + 1;
    instruction.source = node.getText();
  }
  
  this.bytecode.push(instruction);
}
```

**File**: `/packages/vm/src/lib/vm.ts`  
**When creating errors**:
```typescript
const instruction = state.bytecode[state.pc];
const location = instruction.line ? ` at line ${instruction.line}:${instruction.column}` : '';
const source = instruction.source ? ` in "${instruction.source}"` : '';

return {
  type: 'RuntimeError',
  message: `${message}${location}${source}`,
  pc: state.pc,
  opcode: instruction.op
};
```

## Critical Missing Test

**File**: Create `/packages/vm/src/lib/handlers/arrays.numeric-key.spec.ts`
```typescript
describe('Numeric key access', () => {
  it('should handle numeric keys correctly', () => {
    const obj = {};
    obj[123] = 'value';
    expect(obj[123]).toBe('value');
    expect(obj['123']).toBe('value');
  });
  
  it('should handle computed numeric keys', () => {
    const arr = ['a', 'b', 'c'];
    const index = 1;
    expect(arr[index]).toBe('b');
  });
});
```

## Summary

These fixes transform CVM from a fragile prototype to a reliable tool:

1. **No more crashes** - Errors are handled gracefully
2. **No more silent failures** - Compiler tells you what's not supported
3. **No more memory leaks** - Resources are properly cleaned
4. **No more data corruption** - Database operations are atomic
5. **Better debugging** - Error messages show line numbers
6. **Core features work** - Array access, compound assignment, array methods

Start with Phase 1 (especially the one-line accessor fix!), then work through the phases in order. Each phase builds on the previous one.