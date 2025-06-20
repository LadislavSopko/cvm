# CVM Compiler Refactoring Plan

## Overview
This document outlines the plan to refactor the CVM compiler from a monolithic 700+ line file with nested if/else chains into a modular, maintainable structure using the visitor pattern.

## Current State
- Single file: `/home/laco/cvm/packages/parser/src/lib/compiler.ts` (700+ lines)
- Giant if/else chains for statement and expression compilation
- Difficult to maintain, test, and extend
- All tests passing - safe to refactor

## Goals
1. **Zero functional changes** - Purely structural refactoring
2. **Modular design** - Each node type in its own file
3. **Better testability** - Can unit test individual compilers
4. **Easier maintenance** - Clear separation of concerns
5. **Type safety** - Leverage TypeScript's type system

## CVM Supported Node Types

Based on analysis of the current compiler, CVM supports these TypeScript AST nodes:

### Statements
- `IfStatement` - if/else conditionals
- `WhileStatement` - while loops
- `ForOfStatement` - for-of loops
- `Block` - code blocks { }
- `VariableStatement` - variable declarations
- `ExpressionStatement` - standalone expressions
- `ReturnStatement` - return from main()
- `BreakStatement` - break from loops
- `ContinueStatement` - continue in loops
- `FunctionDeclaration` - only main() is processed

### Expressions
- `StringLiteral` - "hello"
- `NumericLiteral` - 42
- `Identifier` - variable names, true/false/null/undefined
- `ArrayLiteralExpression` - [1, 2, 3]
- `BinaryExpression` - all operators (+, -, *, /, %, ==, !=, <, >, etc.)
- `PrefixUnaryExpression` - !, -, +, ++, --
- `PostfixUnaryExpression` - ++, --
- `CallExpression` - function calls (CC, console.log, methods)
- `PropertyAccessExpression` - obj.prop
- `ElementAccessExpression` - arr[0]
- `ConditionalExpression` - ternary ? :
- `TypeOfExpression` - typeof operator
- `ParenthesizedExpression` - (expr)

### NOT Supported (No Visitors Needed)
- Classes, interfaces, types (TypeScript-specific)
- Functions beyond main()
- try/catch/finally
- switch/case
- for loops (non for-of)
- do-while loops
- throw statements
- import/export
- async/await
- generators
- destructuring
- spread operator
- template literals
- object literals

## Proposed Architecture

### Directory Structure
```
packages/parser/src/lib/
├── compiler.ts                    # Main entry, orchestration
├── compiler-state.ts             # Existing state management (unchanged)
├── bytecode.ts                   # Existing opcodes (unchanged)
├── compiler/
│   ├── index.ts                  # Re-exports all visitors
│   ├── visitor-types.ts          # Shared types for visitors
│   ├── statements/
│   │   ├── index.ts             # Statement visitor registry
│   │   ├── if-statement.ts
│   │   ├── while-statement.ts
│   │   ├── for-of-statement.ts
│   │   ├── block-statement.ts
│   │   ├── variable-statement.ts
│   │   ├── expression-statement.ts
│   │   ├── return-statement.ts
│   │   ├── break-statement.ts
│   │   └── continue-statement.ts
│   └── expressions/
│       ├── index.ts             # Expression visitor registry
│       ├── literals.ts          # String, number, boolean, null, undefined
│       ├── identifier.ts
│       ├── binary-expression.ts
│       ├── unary-expressions.ts  # Both prefix and postfix
│       ├── call-expression.ts
│       ├── array-literal.ts
│       ├── element-access.ts
│       ├── property-access.ts
│       ├── conditional-expression.ts
│       ├── typeof-expression.ts
│       └── parenthesized.ts
```

### Core Types
```typescript
// compiler/visitor-types.ts
import { CompilerState } from '../compiler-state.js';
import * as ts from 'typescript';

export type StatementVisitor<T extends ts.Statement = ts.Statement> = (
  node: T,
  state: CompilerState,
  context: CompilerContext
) => void;

export type ExpressionVisitor<T extends ts.Expression = ts.Expression> = (
  node: T,
  state: CompilerState,
  context: CompilerContext  
) => void;

export interface CompilerContext {
  compileStatement: (node: ts.Node) => void;
  compileExpression: (node: ts.Node) => void;
  reportError: (node: ts.Node, message: string) => never;
}

// Type-safe node type mapping
export interface NodeTypeMap {
  // Statements
  [ts.SyntaxKind.IfStatement]: ts.IfStatement;
  [ts.SyntaxKind.WhileStatement]: ts.WhileStatement;
  [ts.SyntaxKind.ForOfStatement]: ts.ForOfStatement;
  [ts.SyntaxKind.Block]: ts.Block;
  [ts.SyntaxKind.VariableStatement]: ts.VariableStatement;
  [ts.SyntaxKind.ExpressionStatement]: ts.ExpressionStatement;
  [ts.SyntaxKind.ReturnStatement]: ts.ReturnStatement;
  [ts.SyntaxKind.BreakStatement]: ts.BreakStatement;
  [ts.SyntaxKind.ContinueStatement]: ts.ContinueStatement;
  
  // Expressions
  [ts.SyntaxKind.StringLiteral]: ts.StringLiteral;
  [ts.SyntaxKind.NumericLiteral]: ts.NumericLiteral;
  [ts.SyntaxKind.Identifier]: ts.Identifier;
  [ts.SyntaxKind.ArrayLiteralExpression]: ts.ArrayLiteralExpression;
  [ts.SyntaxKind.BinaryExpression]: ts.BinaryExpression;
  [ts.SyntaxKind.PrefixUnaryExpression]: ts.PrefixUnaryExpression;
  [ts.SyntaxKind.PostfixUnaryExpression]: ts.PostfixUnaryExpression;
  [ts.SyntaxKind.CallExpression]: ts.CallExpression;
  [ts.SyntaxKind.PropertyAccessExpression]: ts.PropertyAccessExpression;
  [ts.SyntaxKind.ElementAccessExpression]: ts.ElementAccessExpression;
  [ts.SyntaxKind.ConditionalExpression]: ts.ConditionalExpression;
  [ts.SyntaxKind.TypeOfExpression]: ts.TypeOfExpression;
  [ts.SyntaxKind.ParenthesizedExpression]: ts.ParenthesizedExpression;
  
  // Keywords as expressions
  [ts.SyntaxKind.TrueKeyword]: ts.Node;
  [ts.SyntaxKind.FalseKeyword]: ts.Node;
  [ts.SyntaxKind.NullKeyword]: ts.Node;
}
```

### Visitor Registry Pattern
```typescript
// compiler/statements/index.ts
import * as ts from 'typescript';
import { StatementVisitor } from '../visitor-types.js';
import { compileIfStatement } from './if-statement.js';
import { compileWhileStatement } from './while-statement.js';
// ... other imports

export const statementVisitors: Record<ts.SyntaxKind, StatementVisitor> = {
  [ts.SyntaxKind.IfStatement]: compileIfStatement,
  [ts.SyntaxKind.WhileStatement]: compileWhileStatement,
  [ts.SyntaxKind.ForOfStatement]: compileForOfStatement,
  [ts.SyntaxKind.Block]: compileBlockStatement,
  [ts.SyntaxKind.VariableStatement]: compileVariableStatement,
  [ts.SyntaxKind.ExpressionStatement]: compileExpressionStatement,
  [ts.SyntaxKind.ReturnStatement]: compileReturnStatement,
  [ts.SyntaxKind.BreakStatement]: compileBreakStatement,
  [ts.SyntaxKind.ContinueStatement]: compileContinueStatement,
};
```

### Example Visitor Implementation
```typescript
// compiler/statements/if-statement.ts
import * as ts from 'typescript';
import { OpCode } from '../../bytecode.js';
import { StatementVisitor } from '../visitor-types.js';

export const compileIfStatement: StatementVisitor<ts.IfStatement> = (
  node,
  state,
  { compileExpression, compileStatement }
) => {
  // Compile condition
  compileExpression(node.expression);
  
  // Emit JUMP_IF_FALSE with placeholder
  const jumpIfFalseIndex = state.emit(OpCode.JUMP_IF_FALSE, -1);
  
  // ... rest of if compilation logic
};
```

## Implementation Phases

### Phase 1: Setup Infrastructure (Day 1)
1. Create directory structure
2. Create `visitor-types.ts` with shared types
3. Create empty visitor registries
4. Update `compiler.ts` to support both old and new patterns during migration

### Phase 2: Extract Expression Visitors (Days 2-3)
Order of extraction (simplest to most complex):
1. **Literals** (`literals.ts`)
   - StringLiteral
   - NumericLiteral  
   - TrueKeyword, FalseKeyword, NullKeyword
   - Run tests after extraction

2. **Simple Expressions**
   - Identifier (`identifier.ts`)
   - ArrayLiteralExpression (`array-literal.ts`)
   - ParenthesizedExpression (just recurse)
   - Run tests after each

3. **Property Access**
   - PropertyAccessExpression (`property-access.ts`)
   - ElementAccessExpression (`element-access.ts`)
   - Run tests

4. **Operators**
   - UnaryExpression (`unary-expression.ts`)
   - BinaryExpression (`binary-expression.ts`)
   - ConditionalExpression (`conditional-expression.ts`)
   - Run tests

5. **Complex Expressions**
   - CallExpression (`call-expression.ts`)
   - TypeOfExpression (`typeof-expression.ts`)
   - Run tests

### Phase 3: Extract Statement Visitors (Days 4-5)
Order of extraction:
1. **Simple Statements**
   - Block (`block-statement.ts`)
   - VariableStatement (`variable-statement.ts`)
   - ExpressionStatement (`expression-statement.ts`)
   - ReturnStatement (`return-statement.ts`)
   - Run tests after each

2. **Control Flow**
   - IfStatement (`if-statement.ts`)
   - WhileStatement (`while-statement.ts`)
   - Run tests

3. **Complex Statements**
   - ForOfStatement (`for-of-statement.ts`)
   - BreakStatement (`break-statement.ts`)
   - ContinueStatement (`continue-statement.ts`)
   - Run tests

### Phase 4: Cleanup (Day 6)
1. Remove old if/else chains from `compiler.ts`
2. Finalize visitor registry pattern
3. Add error handling for unsupported node types
4. Run full test suite
5. Update documentation

## Migration Strategy

### Parallel Pattern During Migration
```typescript
// compiler.ts during migration
function compileExpression(node: ts.Node): void {
  // Try new visitor first
  const visitor = expressionVisitors[node.kind];
  if (visitor) {
    visitor(node as any, state, { compileExpression, compileStatement });
    return;
  }
  
  // Fall back to old if/else pattern
  if (ts.isStringLiteral(node)) {
    // ... old code
  }
  // ... rest of old pattern
}
```

### Testing Strategy
1. **No new tests during refactoring** - Existing tests verify behavior
2. **Run tests after EVERY extraction** - Ensure no regressions
3. **Use `nx test parser --watch`** - Continuous feedback
4. **Check coverage** - Ensure all paths still tested

### Rollback Plan
- Git commit after each successful extraction
- Can revert individual visitor extractions if needed
- Old pattern remains until Phase 4

## Type-Safe Dispatch Implementation

### After Phase 4 (removing old code), implement type-safe dispatch:
```typescript
// compiler.ts
import { NodeTypeMap } from './compiler/visitor-types.js';
import { statementVisitors } from './compiler/statements/index.js';
import { expressionVisitors } from './compiler/expressions/index.js';

function compileStatement(node: ts.Statement): void {
  const visitor = statementVisitors[node.kind];
  if (visitor) {
    // Type assertion is safe because we control the registry
    visitor(node as any, state, context);
  } else {
    context.reportError(node, `Unsupported statement: ${ts.SyntaxKind[node.kind]}`);
  }
}

function compileExpression(node: ts.Expression): void {
  const visitor = expressionVisitors[node.kind];
  if (visitor) {
    visitor(node as any, state, context);
  } else {
    context.reportError(node, `Unsupported expression: ${ts.SyntaxKind[node.kind]}`);
  }
}
```

## Success Criteria
1. All existing tests pass
2. No functional changes to compiled bytecode
3. Each visitor in its own file
4. No more giant if/else chains
5. Easier to add new node types
6. Type-safe visitor dispatch
7. Consistent error handling

## Future Benefits
1. **Extensibility**: Easy to add new TypeScript features
2. **Debugging**: Can add logging/debugging to specific visitors
3. **Optimization**: Can optimize individual node compilations
4. **Type Safety**: Each visitor typed to its specific node type
5. **Unit Testing**: Can test visitors in isolation

## Risks and Mitigations
1. **Risk**: Breaking existing functionality
   - **Mitigation**: Run tests after every change, commit often
   
2. **Risk**: Missing edge cases in extraction
   - **Mitigation**: Keep old code until new code tested
   
3. **Risk**: Performance regression
   - **Mitigation**: Visitor lookup is O(1), should be faster

## Notes
- This refactoring enables future block scoping implementation
- Makes the codebase more approachable for contributors
- Sets foundation for more advanced compiler features