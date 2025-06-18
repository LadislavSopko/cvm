# Phase 2 Implementation Plan: Branching with Context Stack

## Overview
Implement branching (if/else, while loops) using a context stack approach that will scale to nested structures and future control flow features.

## Phase 2A: VM Foundations

### 1. Create cvmToNumber helper
**File**: `packages/types/src/lib/cvm-value.ts`
```typescript
export function cvmToNumber(value: CVMValue): number {
  if (isCVMNumber(value)) return value;
  if (isCVMBoolean(value)) return value ? 1 : 0;
  if (isCVMString(value)) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  if (isCVMNull(value)) return 0;
  if (isCVMArray(value)) return value.elements.length;
  return 0;
}
```
**Tests**: Add to `cvm-value.spec.ts` - test each type conversion

### 2. Implement comparison opcodes in VM
**File**: `packages/vm/src/lib/vm.ts`
```typescript
case OpCode.EQ: {
  const b = state.stack.pop();
  const a = state.stack.pop();
  if (a === undefined || b === undefined) {
    state.status = 'error';
    state.error = 'EQ: Stack underflow';
    break;
  }
  // JavaScript-like loose equality
  state.stack.push(a === b || cvmToString(a) === cvmToString(b));
  state.pc++;
  break;
}

case OpCode.LT: {
  const b = state.stack.pop();
  const a = state.stack.pop();
  if (a === undefined || b === undefined) {
    state.status = 'error';
    state.error = 'LT: Stack underflow';
    break;
  }
  state.stack.push(cvmToNumber(a) < cvmToNumber(b));
  state.pc++;
  break;
}
// Similar for NEQ, GT
```
**Tests**: Create `vm-comparison.spec.ts` - test all comparison operations

### 3. Implement jump opcodes in VM
**File**: `packages/vm/src/lib/vm.ts`
```typescript
case OpCode.JUMP: {
  if (typeof instruction.arg !== 'number') {
    state.status = 'error';
    state.error = 'JUMP requires numeric target address';
    break;
  }
  state.pc = instruction.arg;
  break;
}

case OpCode.JUMP_IF_FALSE: {
  const condition = state.stack.pop();
  if (condition === undefined) {
    state.status = 'error';
    state.error = 'JUMP_IF_FALSE: Stack underflow';
    break;
  }
  if (!cvmToBoolean(condition)) {
    state.pc = instruction.arg as number;
  } else {
    state.pc++;
  }
  break;
}
```
**Tests**: Create `vm-jump.spec.ts` - test jump behavior

## Phase 2B: Compiler Infrastructure

### 4. Create JumpContext and CompilerState
**File**: `packages/parser/src/lib/compiler.ts`
```typescript
interface JumpContext {
  type: 'if' | 'loop';
  breakTargets?: number[];      // For loops
  continueTargets?: number[];   // For loops  
  elseTarget?: number;          // For if
  endTargets: number[];         // Common: where to jump after block
  startAddress?: number;        // For loops: loop start
}

class CompilerState {
  bytecode: Instruction[] = [];
  contextStack: JumpContext[] = [];
  
  emitInstruction(op: OpCode, arg?: any): void {
    this.bytecode.push({ op, arg });
  }
  
  emitJump(op: OpCode): number {
    const index = this.bytecode.length;
    this.bytecode.push({ op, arg: -1 });
    return index;
  }
  
  patchJump(index: number, target: number): void {
    this.bytecode[index].arg = target;
  }
  
  currentAddress(): number {
    return this.bytecode.length;
  }
}
```

### 5. Refactor compile() to use CompilerState
**File**: `packages/parser/src/lib/compiler.ts`
- Replace local `bytecode` array with `CompilerState` instance
- Update all `bytecode.push()` calls to use `state.emitInstruction()`
- Pass `state` to `compileStatement` and `compileExpression`

## Phase 2C: Compiler Features

### 6. Add comparison operators to compileExpression
**File**: `packages/parser/src/lib/compiler.ts`
```typescript
else if (ts.isBinaryExpression(node)) {
  switch (node.operatorToken.kind) {
    case ts.SyntaxKind.PlusToken:
      compileExpression(state, node.left);
      compileExpression(state, node.right);
      state.emitInstruction(OpCode.CONCAT);
      break;
    case ts.SyntaxKind.EqualsEqualsToken:
      compileExpression(state, node.left);
      compileExpression(state, node.right);
      state.emitInstruction(OpCode.EQ);
      break;
    case ts.SyntaxKind.ExclamationEqualsToken:
      compileExpression(state, node.left);
      compileExpression(state, node.right);
      state.emitInstruction(OpCode.NEQ);
      break;
    case ts.SyntaxKind.LessThanToken:
      compileExpression(state, node.left);
      compileExpression(state, node.right);
      state.emitInstruction(OpCode.LT);
      break;
    case ts.SyntaxKind.GreaterThanToken:
      compileExpression(state, node.left);
      compileExpression(state, node.right);
      state.emitInstruction(OpCode.GT);
      break;
  }
}
```

### 7. Add IfStatement handling
**File**: `packages/parser/src/lib/compiler.ts`
```typescript
else if (ts.isIfStatement(node)) {
  const ctx: JumpContext = { type: 'if', endTargets: [] };
  state.contextStack.push(ctx);
  
  // Compile condition
  compileExpression(state, node.expression);
  
  // Jump to else/end if false
  ctx.elseTarget = state.emitJump(OpCode.JUMP_IF_FALSE);
  
  // Compile then block
  compileStatement(state, node.thenStatement);
  
  if (node.elseStatement) {
    // Jump over else block
    ctx.endTargets.push(state.emitJump(OpCode.JUMP));
    
    // Patch else target
    state.patchJump(ctx.elseTarget, state.currentAddress());
    
    // Compile else block
    compileStatement(state, node.elseStatement);
  } else {
    // No else - jump directly to end
    ctx.endTargets.push(ctx.elseTarget);
  }
  
  // Patch all end targets
  const endAddress = state.currentAddress();
  ctx.endTargets.forEach(idx => state.patchJump(idx, endAddress));
  
  state.contextStack.pop();
}
```

### 8. Create compileBlock helper
**File**: `packages/parser/src/lib/compiler.ts`
```typescript
function compileBlock(state: CompilerState, block: ts.Block): void {
  block.statements.forEach(stmt => compileStatement(state, stmt));
}
```

### 9. Add WhileStatement handling
**File**: `packages/parser/src/lib/compiler.ts`
```typescript
else if (ts.isWhileStatement(node)) {
  const ctx: JumpContext = { 
    type: 'loop',
    breakTargets: [],
    continueTargets: [],
    endTargets: [],
    startAddress: state.currentAddress()
  };
  state.contextStack.push(ctx);
  
  // Compile condition
  compileExpression(state, node.expression);
  
  // Jump to end if false
  ctx.breakTargets.push(state.emitJump(OpCode.JUMP_IF_FALSE));
  
  // Compile body
  compileStatement(state, node.statement);
  
  // Jump back to start
  state.emitInstruction(OpCode.JUMP, ctx.startAddress);
  
  // Patch break targets
  const endAddress = state.currentAddress();
  ctx.breakTargets.forEach(idx => state.patchJump(idx, endAddress));
  
  state.contextStack.pop();
}
```

## Phase 2D: Testing

### 10-11. VM Tests
- `vm-comparison.spec.ts`: Test EQ, NEQ, LT, GT with various types
- `vm-jump.spec.ts`: Test JUMP and JUMP_IF_FALSE behavior

### 12-13. Integration Tests
- Test complete if/else compilation and execution
- Test while loops with multiple iterations
- Test nested if/while combinations

### 14-15. Example Programs
- `if-cc-demo.ts`: Demonstrate if/else with CC calls
- `while-cc-demo.ts`: Demonstrate while loop with CC calls

## Implementation Order

1. **VM first** (tasks 1-3, 10-11): Get the opcodes working
2. **Compiler infrastructure** (tasks 4-5): Set up context stack
3. **Compiler features** (tasks 6-9): Add language support
4. **Integration** (tasks 12-15): Verify everything works together

## Key Design Decisions

1. **Context Stack**: Enables nested control structures and future break/continue support
2. **JavaScript-like Semantics**: EQ uses loose equality, numeric comparisons use cvmToNumber
3. **Single Pass with Backpatching**: Maintain simplicity while supporting forward jumps
4. **Separate Contexts**: 'if' and 'loop' contexts have different fields for clarity

## Testing Strategy

1. **Unit tests first**: Each opcode tested in isolation
2. **Integration tests**: Complete programs with nested structures
3. **Example programs**: Real-world usage patterns with CC calls