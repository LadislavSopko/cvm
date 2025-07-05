# CVM Feature Implementation Plan: Object.keys(), for(;;), switch/case, for...in

## Overview
This plan provides atomic, testable steps for implementing four language features in CVM using TDD methodology. Each step includes exact file paths and test commands.

## Feature 1: Object.keys() Implementation

### Step 1.1: Add OBJECT_KEYS Opcode
**File**: `/home/laco/cvm/packages/parser/src/lib/bytecode.ts`
**Action**: Add `OBJECT_KEYS = 'OBJECT_KEYS',` to OpCode enum after line 113 (after PROPERTY_SET)
**Test**: `npx nx test parser` (should still pass)

### Step 1.2: Write Object.keys() VM Handler Tests
**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/objects-keys.spec.ts` (new file)
**Action**: Create test file with these test cases:
```typescript
import { describe, it, expect } from 'vitest';
import { VM } from '../../vm.js';
import { OpCode } from '@cvm/parser';

describe('OBJECT_KEYS handler', () => {
  it('should return array of object keys', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object {a: 1, b: 2}
    state.heap.allocate({ a: { type: 'number', value: 1 }, b: { type: 'number', value: 2 } });
    state.stack.push({ type: 'object', value: 0 });
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_KEYS });
    
    const result = state.stack.pop()!;
    expect(result.type).toBe('array');
    const keys = state.heap.get(result.value);
    expect(keys).toEqual(['a', 'b']);
  });

  it('should return empty array for empty object', () => {
    // Test empty object
  });

  it('should return null for non-object values', () => {
    // Test null, numbers, strings, etc.
  });
});
```
**Test**: `npx nx test vm -- objects-keys.spec.ts` (should fail - handler not implemented)

### Step 1.3: Implement OBJECT_KEYS Handler
**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/objects.ts`
**Action**: Add handler to objectHandlers export:
```typescript
[OpCode.OBJECT_KEYS]: {
  stackIn: 1,
  stackOut: 1,
  execute(state: VMState) {
    const value = state.stack.pop()!;
    
    if (value.type === 'object' && value.value !== null) {
      const obj = state.heap.get(value.value);
      const keys = Object.keys(obj).map(key => ({ type: 'string' as const, value: key }));
      const arrayId = state.heap.allocate(keys);
      state.stack.push({ type: 'array', value: arrayId });
    } else {
      state.stack.push({ type: 'null', value: null });
    }
  }
}
```
**Test**: `npx nx test vm -- objects-keys.spec.ts` (should pass)

### Step 1.4: Write Compiler Tests for Object.keys()
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/expressions/object-keys.spec.ts` (new file)
**Action**: Create test file:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('Object.keys() compilation', () => {
  it('should compile Object.keys() call', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2 };
        const keys = Object.keys(obj);
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should contain OBJECT_KEYS opcode
    const hasObjectKeys = result.bytecode.some(inst => inst.op === OpCode.OBJECT_KEYS);
    expect(hasObjectKeys).toBe(true);
  });
});
```
**Test**: `npx nx test parser -- object-keys.spec.ts` (should fail - not compiling)

### Step 1.5: Implement Object.keys() in Compiler
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts`
**Action**: Add before the general function call handling (around line 20):
```typescript
// Handle Object.keys()
if (node.callee.type === 'MemberExpression' && 
    node.callee.object.type === 'Identifier' && 
    node.callee.object.name === 'Object' &&
    node.callee.property.type === 'Identifier' && 
    node.callee.property.name === 'keys') {
  
  if (node.arguments.length !== 1) {
    context.reportError('Object.keys() requires exactly one argument', node);
    return;
  }
  
  context.compileExpression(node.arguments[0]);
  context.emit({ op: OpCode.OBJECT_KEYS });
  return;
}
```
**Test**: `npx nx test parser -- object-keys.spec.ts` (should pass)

### Step 1.6: Write VM Integration Test for Object.keys()
**File**: `/home/laco/cvm/packages/vm/src/lib/vm-object-keys.spec.ts` (new file)
**Action**: Create integration test that compiles and runs a program:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('Object.keys() VM integration', () => {
  it('should execute Object.keys() in compiled program', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2, c: 3 };
        const keys = Object.keys(obj);
        return keys;
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue?.type).toBe('array');
    // Verify the keys array contains ["a", "b", "c"]
    const keysArray = state.heap.get(state.returnValue.value);
    expect(keysArray.map(k => k.value)).toEqual(['a', 'b', 'c']);
  });
});
```
**Test**: `npx nx test vm -- vm-object-keys.spec.ts`

### Step 1.7: Update API Documentation
**File**: `/home/laco/cvm/docs/API.md`
**Action**: Add Object.keys() documentation in the appropriate section
**Test**: N/A (documentation)

## Feature 2: Traditional for(;;) Loop Implementation

### Step 2.1: Write For Loop Compiler Tests
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/for-statement.spec.ts` (new file)
**Action**: Create test file:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('for loop compilation', () => {
  it('should compile basic for loop', () => {
    const source = `
      function main() {
        for (let i = 0; i < 5; i++) {
          console.log(i);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have JUMP_IF_FALSE for condition and JUMP for loop back
    const hasConditionalJump = result.bytecode.some(inst => inst.op === OpCode.JUMP_IF_FALSE);
    const hasJump = result.bytecode.some(inst => inst.op === OpCode.JUMP);
    expect(hasConditionalJump).toBe(true);
    expect(hasJump).toBe(true);
  });

  it('should handle for loop with break', () => {
    // Test break statement
  });

  it('should handle for loop with continue', () => {
    // Test continue statement
  });

  it('should handle for loop without init', () => {
    // for (; i < 5; i++)
  });

  it('should handle for loop without condition', () => {
    // for (let i = 0; ; i++) - infinite loop
  });

  it('should handle for loop without update', () => {
    // for (let i = 0; i < 5; )
  });
});
```
**Test**: `npx nx test parser -- for-statement.spec.ts` (should fail - not implemented)

### Step 2.2: Implement For Loop Statement Visitor
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/for-statement.ts` (new file)
**Action**: Create visitor:
```typescript
import { ForStatement } from '../../ast.js';
import { CompilerContext } from '../context.js';
import { OpCode } from '../../bytecode.js';

export function compileForStatement(node: ForStatement, context: CompilerContext): void {
  // 1. Compile init
  if (node.init) {
    if (node.init.type === 'VariableDeclaration') {
      context.compileStatement(node.init);
    } else {
      context.compileExpression(node.init);
      context.emit({ op: OpCode.POP }); // Discard init expression result
    }
  }
  
  // 2. Mark loop start
  const loopStart = context.bytecode.length;
  const exitJumps: number[] = [];
  
  // 3. Compile test condition
  if (node.test) {
    context.compileExpression(node.test);
    const jumpIndex = context.bytecode.length;
    context.emit({ op: OpCode.JUMP_IF_FALSE, arg: -1 }); // Will patch later
    exitJumps.push(jumpIndex);
  }
  
  // 4. Compile body
  context.pushLoop(loopStart);
  context.compileStatement(node.body);
  
  // 5. Continue target (for continue statements)
  const continueTarget = context.bytecode.length;
  context.loops[context.loops.length - 1].continueTarget = continueTarget;
  
  // 6. Compile update
  if (node.update) {
    context.compileExpression(node.update);
    context.emit({ op: OpCode.POP }); // Discard update expression result
  }
  
  // 7. Jump back to start
  context.emit({ op: OpCode.JUMP, arg: loopStart });
  
  // 8. Patch exit jumps
  const exitPoint = context.bytecode.length;
  exitJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
  
  // Patch break jumps
  const loop = context.popLoop();
  loop.breakJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
}
```
**Test**: `npx nx test parser -- for-statement.spec.ts` (should still fail - not registered)

### Step 2.3: Register For Statement in Compiler
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/index.ts`
**Action**: 
1. Import: `import { compileForStatement } from './for-statement.js';`
2. Add to statementVisitors: `ForStatement: compileForStatement,`
**Test**: `npx nx test parser -- for-statement.spec.ts` (should pass)

### Step 2.4: Write VM Integration Test for For Loops
**File**: `/home/laco/cvm/packages/vm/src/lib/vm-for-loops.spec.ts` (new file)
**Action**: Create integration test:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('for loop VM integration', () => {
  it('should execute basic for loop', () => {
    const source = `
      function main() {
        let sum = 0;
        for (let i = 0; i < 5; i++) {
          sum = sum + i;
        }
        return sum; // Should be 0+1+2+3+4 = 10
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toEqual({ type: 'number', value: 10 });
  });

  it('should handle for loop with break', () => {
    const source = `
      function main() {
        let count = 0;
        for (let i = 0; i < 10; i++) {
          if (i === 3) break;
          count++;
        }
        return count; // Should be 3
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toEqual({ type: 'number', value: 3 });
  });
});
```
**Test**: `npx nx test vm -- vm-for-loops.spec.ts`

## Feature 3: Switch/Case Statement Implementation

### Step 3.1: Write Switch Statement Compiler Tests
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/switch-statement.spec.ts` (new file)
**Action**: Create test file:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('switch statement compilation', () => {
  it('should compile basic switch statement', () => {
    const source = `
      function main() {
        const value = 2;
        switch (value) {
          case 1:
            console.log("one");
            break;
          case 2:
            console.log("two");
            break;
          default:
            console.log("other");
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should generate EQ_STRICT comparisons
    const hasStrictEquals = result.bytecode.filter(inst => inst.op === OpCode.EQ_STRICT).length >= 2;
    expect(hasStrictEquals).toBe(true);
  });

  it('should handle switch with fall-through', () => {
    // Test case without break
  });

  it('should handle switch without default', () => {
    // Test switch with only cases
  });

  it('should handle empty switch', () => {
    // switch (x) { }
  });
});
```
**Test**: `npx nx test parser -- switch-statement.spec.ts` (should fail)

### Step 3.2: Implement Switch Statement Visitor
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/switch-statement.ts` (new file)
**Action**: Create visitor (transform to if-else chain):
```typescript
import { SwitchStatement } from '../../ast.js';
import { CompilerContext } from '../context.js';
import { OpCode } from '../../bytecode.js';

export function compileSwitchStatement(node: SwitchStatement, context: CompilerContext): void {
  // Store switch discriminant in temporary variable
  const tempVar = context.generateTempVar();
  
  // Evaluate discriminant once
  context.compileExpression(node.discriminant);
  context.emit({ op: OpCode.STORE, arg: tempVar });
  
  const exitJumps: number[] = [];
  let hasDefault = false;
  let defaultJump: number | null = null;
  
  // Generate comparison chain
  node.cases.forEach((caseNode, index) => {
    if (caseNode.test) {
      // case value:
      context.emit({ op: OpCode.LOAD, arg: tempVar });
      context.compileExpression(caseNode.test);
      context.emit({ op: OpCode.EQ_STRICT });
      
      const skipIndex = context.bytecode.length;
      context.emit({ op: OpCode.JUMP_IF_FALSE, arg: -1 }); // Will patch
      
      // Execute consequent statements
      caseNode.consequent.forEach(stmt => {
        if (stmt.type === 'BreakStatement') {
          const breakIndex = context.bytecode.length;
          context.emit({ op: OpCode.JUMP, arg: -1 });
          exitJumps.push(breakIndex);
        } else {
          context.compileStatement(stmt);
        }
      });
      
      // If no break, fall through to next case
      if (!caseNode.consequent.some(s => s.type === 'BreakStatement')) {
        // Continue to next case
      } else {
        // After break, jump to end
        const jumpIndex = context.bytecode.length;
        context.emit({ op: OpCode.JUMP, arg: -1 });
        exitJumps.push(jumpIndex);
      }
      
      // Patch skip jump
      const nextCase = context.bytecode.length;
      context.bytecode[skipIndex].arg = nextCase;
    } else {
      // default:
      hasDefault = true;
      if (index > 0) {
        // Jump to default from previous case test
        defaultJump = context.bytecode.length - 1;
      }
      
      caseNode.consequent.forEach(stmt => {
        if (stmt.type === 'BreakStatement') {
          const breakIndex = context.bytecode.length;
          context.emit({ op: OpCode.JUMP, arg: -1 });
          exitJumps.push(breakIndex);
        } else {
          context.compileStatement(stmt);
        }
      });
    }
  });
  
  // Patch all exit jumps
  const exitPoint = context.bytecode.length;
  exitJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
}
```
**Test**: `npx nx test parser -- switch-statement.spec.ts` (should still fail)

### Step 3.3: Add Temp Variable Support to Compiler Context
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/context.ts`
**Action**: Add method to CompilerContext class:
```typescript
private tempVarCounter = 0;

generateTempVar(): string {
  return `__temp${this.tempVarCounter++}`;
}
```
**Test**: `npx nx test parser` (ensure no regressions)

### Step 3.4: Register Switch Statement in Compiler
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/index.ts`
**Action**: 
1. Import: `import { compileSwitchStatement } from './switch-statement.js';`
2. Add to statementVisitors: `SwitchStatement: compileSwitchStatement,`
**Test**: `npx nx test parser -- switch-statement.spec.ts` (should pass)

### Step 3.5: Write VM Integration Test for Switch Statements
**File**: `/home/laco/cvm/packages/vm/src/lib/vm-switch-statements.spec.ts` (new file)
**Action**: Create integration test:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('switch statement VM integration', () => {
  it('should execute basic switch statement', () => {
    const source = `
      function main() {
        const value = 2;
        let result = "";
        switch (value) {
          case 1:
            result = "one";
            break;
          case 2:
            result = "two";
            break;
          case 3:
            result = "three";
            break;
          default:
            result = "other";
        }
        return result;
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toEqual({ type: 'string', value: 'two' });
  });

  it('should handle switch with fall-through', () => {
    const source = `
      function main() {
        const code = 2;
        let priority = "";
        switch (code) {
          case 1:
          case 2:
          case 3:
            priority = "low";
            break;
          case 4:
          case 5:
            priority = "high";
            break;
          default:
            priority = "unknown";
        }
        return priority;
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toEqual({ type: 'string', value: 'low' });
  });
});
```
**Test**: `npx nx test vm -- vm-switch-statements.spec.ts`

## Feature 4: for...in Loop Implementation

### Step 4.1: Add OBJECT_ITER Opcodes
**File**: `/home/laco/cvm/packages/parser/src/lib/bytecode.ts`
**Action**: Add after ITER_END:
```typescript
OBJECT_ITER_START = 'OBJECT_ITER_START',
OBJECT_ITER_NEXT = 'OBJECT_ITER_NEXT',
```
**Test**: `npx nx test parser` (should pass)

### Step 4.2: Write Object Iterator Handler Tests
**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/object-iterators.spec.ts` (new file)
**Action**: Create test file:
```typescript
import { describe, it, expect } from 'vitest';
import { VM } from '../../vm.js';
import { OpCode } from '@cvm/parser';

describe('Object iterator handlers', () => {
  it('should start object iteration', () => {
    const vm = new VM();
    const state = vm.createInitialState();
    
    // Create object {a: 1, b: 2}
    const objId = state.heap.allocate({ 
      a: { type: 'number', value: 1 }, 
      b: { type: 'number', value: 2 } 
    });
    state.stack.push({ type: 'object', value: objId });
    
    vm.executeInstruction(state, { op: OpCode.OBJECT_ITER_START });
    
    // Should setup iterator context
    expect(state.iterators.length).toBe(1);
    expect(state.iterators[0].keys).toEqual(['a', 'b']);
    expect(state.iterators[0].index).toBe(0);
  });

  it('should get next key in iteration', () => {
    // Test OBJECT_ITER_NEXT
  });

  it('should handle empty objects', () => {
    // Test iteration over {}
  });
});
```
**Test**: `npx nx test vm -- object-iterators.spec.ts` (should fail)

### Step 4.3: Implement Object Iterator Handlers
**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/object-iterators.ts` (new file)
**Action**: Create handlers:
```typescript
import { OpcodeHandler } from './types.js';
import { OpCode } from '@cvm/parser';
import { VMState } from '../vm.js';

export const objectIteratorHandlers: Record<string, OpcodeHandler> = {
  [OpCode.OBJECT_ITER_START]: {
    stackIn: 1,
    stackOut: 0,
    execute(state: VMState) {
      const value = state.stack.pop()!;
      
      if (value.type === 'object' && value.value !== null) {
        const obj = state.heap.get(value.value);
        const keys = Object.keys(obj);
        
        // Add to iterators with keys array
        state.iterators.push({
          array: null as any, // Not used for object iteration
          keys,
          index: 0,
          length: keys.length
        });
      } else {
        // Push empty iterator for non-objects
        state.iterators.push({
          array: null as any,
          keys: [],
          index: 0,
          length: 0
        });
      }
    }
  },
  
  [OpCode.OBJECT_ITER_NEXT]: {
    stackIn: 0,
    stackOut: 2, // Push key and hasNext
    execute(state: VMState) {
      const iterator = state.iterators[state.iterators.length - 1];
      
      if (iterator.index < iterator.length) {
        const key = iterator.keys![iterator.index];
        state.stack.push({ type: 'string', value: key });
        state.stack.push({ type: 'boolean', value: true });
        iterator.index++;
      } else {
        state.stack.push({ type: 'null', value: null });
        state.stack.push({ type: 'boolean', value: false });
      }
    }
  }
};
```
**Test**: `npx nx test vm -- object-iterators.spec.ts` (should still fail - need to extend types)

### Step 4.4: Extend Iterator Context for Objects
**File**: `/home/laco/cvm/packages/vm/src/lib/vm.ts`
**Action**: Update IteratorContext interface:
```typescript
export interface IteratorContext {
  array: CVMArray | null;  // null for object iteration
  index: number;
  length: number;
  keys?: string[];  // For object iteration
}
```
**Test**: `npx nx test vm -- object-iterators.spec.ts` (should pass after registering handlers)

### Step 4.5: Register Object Iterator Handlers
**File**: `/home/laco/cvm/packages/vm/src/lib/handlers/index.ts`
**Action**: 
1. Import: `import { objectIteratorHandlers } from './object-iterators.js';`
2. Add to handlers: `...objectIteratorHandlers,`
**Test**: `npx nx test vm -- object-iterators.spec.ts` (should pass)

### Step 4.6: Write For-In Compiler Tests
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/for-in-statement.spec.ts` (new file)
**Action**: Create test file:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '../../compiler.js';
import { OpCode } from '../../bytecode.js';

describe('for-in loop compilation', () => {
  it('should compile basic for-in loop', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2 };
        for (const key in obj) {
          console.log(key);
        }
      }
    `;
    
    const result = compile(source);
    expect(result.errors).toHaveLength(0);
    
    // Should have OBJECT_ITER_START and OBJECT_ITER_NEXT
    const hasObjectIterStart = result.bytecode.some(inst => inst.op === OpCode.OBJECT_ITER_START);
    const hasObjectIterNext = result.bytecode.some(inst => inst.op === OpCode.OBJECT_ITER_NEXT);
    expect(hasObjectIterStart).toBe(true);
    expect(hasObjectIterNext).toBe(true);
  });
});
```
**Test**: `npx nx test parser -- for-in-statement.spec.ts` (should fail)

### Step 4.7: Implement For-In Statement Visitor
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/for-in-statement.ts` (new file)
**Action**: Create visitor:
```typescript
import { ForInStatement } from '../../ast.js';
import { CompilerContext } from '../context.js';
import { OpCode } from '../../bytecode.js';

export function compileForInStatement(node: ForInStatement, context: CompilerContext): void {
  // Compile the object expression
  context.compileExpression(node.right);
  
  // Start object iteration
  context.emit({ op: OpCode.OBJECT_ITER_START });
  
  // Loop start
  const loopStart = context.bytecode.length;
  
  // Get next key
  context.emit({ op: OpCode.OBJECT_ITER_NEXT });
  
  // Check if has next (top of stack)
  const exitJump = context.bytecode.length;
  context.emit({ op: OpCode.JUMP_IF_FALSE, arg: -1 }); // Will patch
  
  // Store key in loop variable
  if (node.left.type === 'VariableDeclaration') {
    const declaration = node.left.declarations[0];
    if (declaration.id.type === 'Identifier') {
      context.emit({ op: OpCode.STORE, arg: declaration.id.name });
    }
  } else if (node.left.type === 'Identifier') {
    context.emit({ op: OpCode.STORE, arg: node.left.name });
  }
  
  // Execute loop body
  context.pushLoop(loopStart);
  context.compileStatement(node.body);
  
  // Jump back to start
  context.emit({ op: OpCode.JUMP, arg: loopStart });
  
  // Patch exit jump
  const exitPoint = context.bytecode.length;
  context.bytecode[exitJump].arg = exitPoint;
  
  // End iteration
  context.emit({ op: OpCode.ITER_END });
  
  // Handle break statements
  const loop = context.popLoop();
  loop.breakJumps.forEach(jumpIndex => {
    context.bytecode[jumpIndex].arg = exitPoint;
  });
}
```
**Test**: `npx nx test parser -- for-in-statement.spec.ts` (should still fail)

### Step 4.8: Register For-In Statement
**File**: `/home/laco/cvm/packages/parser/src/lib/compiler/statements/index.ts`
**Action**: 
1. Import: `import { compileForInStatement } from './for-in-statement.js';`
2. Add to statementVisitors: `ForInStatement: compileForInStatement,`
**Test**: `npx nx test parser -- for-in-statement.spec.ts` (should pass)

### Step 4.9: Write VM Integration Test for For-In Loops
**File**: `/home/laco/cvm/packages/vm/src/lib/vm-for-in-loops.spec.ts` (new file)
**Action**: Create integration test:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('for-in loop VM integration', () => {
  it('should iterate over object properties', () => {
    const source = `
      function main() {
        const obj = { a: 1, b: 2, c: 3 };
        let keys = "";
        for (const key in obj) {
          keys = keys + key;
        }
        return keys; // Should be "abc"
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    expect(state.returnValue).toEqual({ type: 'string', value: 'abc' });
  });

  it('should handle empty objects', () => {
    const source = `
      function main() {
        const empty = {};
        let count = 0;
        for (const key in empty) {
          count++;
        }
        return count; // Should be 0
      }
    `;
    
    const compiled = compile(source);
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.returnValue).toEqual({ type: 'number', value: 0 });
  });
});
```
**Test**: `npx nx test vm -- vm-for-in-loops.spec.ts`

## Testing Order Summary

1. **Object.keys()**: Run all Step 1.x tests in order
2. **for(;;) loops**: Run all Step 2.x tests in order  
3. **switch/case**: Run all Step 3.x tests in order
4. **for...in loops**: Run all Step 4.x tests in order (depends on Object.keys concept)

## Final Comprehensive VM Test
**File**: `/home/laco/cvm/packages/vm/src/lib/vm-new-features-comprehensive.spec.ts` (new file)
**Action**: Create comprehensive test using all new features:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('comprehensive new features test', () => {
  it('should use all new features together', () => {
    const source = `
      function main() {
        const data = { x: 10, y: 20, z: 30 };
        
        // Object.keys() with for loop
        const keys = Object.keys(data);
        let keyCount = 0;
        for (let i = 0; i < keys.length; i++) {
          keyCount++;
        }
        
        // for-in loop
        let sum = 0;
        for (const key in data) {
          sum = sum + data[key];
        }
        
        // switch statement
        let result = "";
        switch (keyCount) {
          case 1:
            result = "one";
            break;
          case 2:
            result = "two";
            break;
          case 3:
            result = "three";
            break;
          default:
            result = "many";
        }
        
        return { keyCount: keyCount, sum: sum, result: result };
      }
    `;
    
    const compiled = compile(source);
    expect(compiled.errors).toHaveLength(0);
    
    const vm = new VM();
    const state = vm.execute(compiled.bytecode);
    
    expect(state.status).toBe('complete');
    const returnObj = state.heap.get(state.returnValue.value);
    expect(returnObj.keyCount.value).toBe(3);
    expect(returnObj.sum.value).toBe(60);
    expect(returnObj.result.value).toBe('three');
  });
});
```
**Test**: `npx nx test vm -- vm-new-features-comprehensive.spec.ts`

## Final E2E Testing Step

### Step 5.1: Create E2E Test Program
**File**: `/home/laco/cvm/test/programs/09-comprehensive/test-new-language-features.ts` (new file)
**Action**: Create E2E test program:
```typescript
function main() {
  console.log("Testing new language features...");
  
  // Test 1: Object.keys()
  console.log("\n=== Testing Object.keys() ===");
  const config = { host: "localhost", port: 3000, debug: true };
  const keys = Object.keys(config);
  console.log("Config has " + keys.length + " keys");
  for (const key of keys) {
    console.log("- " + key);
  }
  
  // Test 2: Traditional for loop
  console.log("\n=== Testing for(;;) loop ===");
  let sum = 0;
  for (let i = 1; i <= 5; i++) {
    sum = sum + i;
    console.log("i=" + i + ", sum=" + sum);
  }
  console.log("Final sum: " + sum);
  
  // Test 3: Switch statement with CC
  console.log("\n=== Testing switch/case ===");
  const action = CC("Enter action (start/stop/restart):");
  switch (action) {
    case "start":
      console.log("Starting service...");
      break;
    case "stop":
      console.log("Stopping service...");
      break;
    case "restart":
      console.log("Restarting service...");
      break;
    default:
      console.log("Unknown action: " + action);
  }
  
  // Test 4: for...in loop
  console.log("\n=== Testing for...in loop ===");
  const stats = { files: 42, errors: 0, warnings: 3 };
  for (const key in stats) {
    console.log(key + ": " + stats[key]);
  }
  
  // Test 5: Combined features
  console.log("\n=== Testing combined features ===");
  const choice = CC("Choose test type (1=keys, 2=loop, 3=skip):");
  
  switch (choice) {
    case "1":
      const testObj = { a: 1, b: 2, c: 3 };
      const objKeys = Object.keys(testObj);
      for (let i = 0; i < objKeys.length; i++) {
        console.log("Key " + i + ": " + objKeys[i]);
      }
      break;
    case "2":
      for (let j = 0; j < 3; j++) {
        console.log("Loop iteration: " + j);
      }
      break;
    case "3":
      console.log("Skipping test");
      break;
    default:
      console.log("Invalid choice");
  }
  
  console.log("\n✓ All tests completed!");
  return 0;
}
```

### Step 5.2: Rebuild All Packages
**Action**: Run rebuild commands:
```bash
# From project root
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```
**Test**: Verify builds complete without errors

### Step 5.3: Run E2E Test
**Action**: Execute the test with CC responses:
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/09-comprehensive/test-new-language-features.ts "start" "1"
```
**Expected Output**: Should show all features working correctly with proper outputs

### Step 5.4: Create Response File for Automated Testing
**File**: `/home/laco/cvm/test/integration/responses/test-new-language-features.txt` (new file)
**Action**: Create response file:
```
start
1
```

### Step 5.5: Add to Test Suite
**File**: `/home/loco/cvm/test/programs/09-comprehensive/README.md` (update if exists, create if not)
**Action**: Document the new test:
```markdown
## test-new-language-features.ts

Tests the newly implemented language features:
- Object.keys() method
- Traditional for(;;) loops  
- Switch/case statements
- for...in loops

**CC Responses Required**: 2
1. Action choice (start/stop/restart)
2. Test type (1/2/3)

**Run**: 
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/09-comprehensive/test-new-language-features.ts "start" "1"
```
```

## Notes

- Each step is atomic and independently testable
- Dependencies are ordered: Object.keys() has no deps, for(;;) has no deps, switch/case needs temp vars, for...in benefits from Object.keys() concept
- All file paths are exact based on current codebase structure
- TDD approach: write test first, implement, verify
- No complex refactoring needed - all features extend existing patterns
- E2E test follows CVM testing methodology: rebuild → run → verify