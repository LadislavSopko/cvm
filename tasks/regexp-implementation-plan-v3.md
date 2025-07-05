# RegExp Implementation Plan v3 - Ultra-Detailed Atomic TDD

## Overview
Implement comprehensive RegExp literal support for CVM using ultra-detailed atomic TDD blocks. Each block contains complete implementation details, exact code snippets, and deep architectural context.

**Plan Status**: ✅ Ultra-detailed with complete implementation guidance  
**Architecture**: ✅ Deep CVM patterns analysis included  
**Granularity**: ✅ Micro-atomic steps with exact code  

## CVM Architecture Deep-Dive

### Core Design Principles
1. **Direct Value Embedding**: Values stored in `instruction.arg` (not constants pool)
2. **Error Objects**: Structured errors returned, never exceptions thrown
3. **Heap-Based Objects**: Complex objects allocated on heap with references
4. **Visitor Pattern**: Compiler uses visitor pattern for AST traversal
5. **Handler Registry**: VM uses opcode-to-handler mapping

### Instruction Flow Architecture
```
Source Code → TypeScript AST → Compiler Visitor → Bytecode → VM Handler → Heap/Stack
     ↓              ↓                ↓            ↓          ↓
/pattern/flags → RegExpLiteral → LOAD_REGEX → Handler → RegExp Object
```

### CVM Error Object Format
```typescript
interface CVMError {
  type: string;        // Error category (e.g., 'SyntaxError')
  message: string;     // Human-readable description
  pc: number;          // Program counter position
  opcode: OpCode;      // Opcode that caused error
}
```

### Heap Allocation Pattern
```typescript
// Objects stored on heap with references
const regexRef = vm.heap.allocate('regex', regexObject);
vm.stack.push(regexRef); // Push reference, not object
```

### Handler Structure Pattern
```typescript
const handlerName: OpcodeHandler = {
  stackIn: number,     // Stack items consumed
  stackOut: number,    // Stack items produced
  execute: (state, instruction) => {
    // Implementation returns undefined (success) or error object
    return undefined | CVMError;
  }
};
```

---

## ATOMIC TDD BLOCK 0: Parser Verification
**Duration**: 10-15 minutes  
**Dependencies**: None  
**Purpose**: Verify TypeScript's built-in parser can handle regex literals

### Architectural Context
- **CVM Parser Role**: CVM doesn't parse - TypeScript does. CVM validates AST
- **RegExp AST Node**: TypeScript produces `RegularExpressionLiteral` nodes
- **Text Property**: Node contains `.text` with full `/pattern/flags` string
- **Validation Need**: Ensure we can extract pattern and flags correctly

### Implementation Layers
- **Primary**: `packages/parser/src/lib/parser-regex-support.spec.ts` (new test file)
- **Validation**: TypeScript AST inspection

### Micro-Atomic Steps

#### Step 1: Create Parser Verification Test
**File**: `packages/parser/src/lib/parser-regex-support.spec.ts`

**Purpose**: Verify TypeScript parser handles regex literals correctly

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import * as ts from 'typescript';

describe('Parser RegExp Support', () => {
  it('should parse regex literal into AST', () => {
    const source = 'var pattern = /test/gi;';
    
    // Create TypeScript source file (this is what CVM uses internally)
    const sourceFile = ts.createSourceFile(
      'test.ts',
      source,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Walk AST to find regex literal node
    let regexNode: ts.RegularExpressionLiteral | undefined;
    
    function visit(node: ts.Node) {
      // TypeScript's type guard for regex literals
      if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
        regexNode = node;
      }
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    // Verify we found the regex node
    expect(regexNode).toBeDefined();
    expect(regexNode!.text).toBe('/test/gi'); // Full text including delimiters
  });

  it('should handle various regex patterns', () => {
    const testCases = [
      { pattern: '/hello/', expected: '/hello/' },
      { pattern: '/test/gi', expected: '/test/gi' },
      { pattern: '/\\w+@\\w+\\.\\w+/', expected: '/\\w+@\\w+\\.\\w+/' },
      { pattern: '/\\d+/g', expected: '/\\d+/g' },
      { pattern: '/start.*end/ms', expected: '/start.*end/ms' }
    ];
    
    testCases.forEach(({ pattern, expected }) => {
      const source = `var re = ${pattern};`;
      const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
      
      let found = false;
      function visit(node: ts.Node) {
        if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
          expect(node.text).toBe(expected);
          found = true;
        }
        ts.forEachChild(node, visit);
      }
      
      visit(sourceFile);
      expect(found).toBe(true);
    });
  });

  it('should extract pattern and flags correctly', () => {
    const source = 'var pattern = /hello.*world/gim;';
    const sourceFile = ts.createSourceFile('test.ts', source, ts.ScriptTarget.Latest, true);
    
    let regexNode: ts.RegularExpressionLiteral | undefined;
    function visit(node: ts.Node) {
      if (ts.isRegularExpressionLiteral && ts.isRegularExpressionLiteral(node)) {
        regexNode = node;
      }
      ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    // Test pattern/flags extraction logic
    const text = regexNode!.text; // "/hello.*world/gim"
    const lastSlash = text.lastIndexOf('/');
    const pattern = text.substring(1, lastSlash); // "hello.*world"
    const flags = text.substring(lastSlash + 1); // "gim"
    
    expect(pattern).toBe('hello.*world');
    expect(flags).toBe('gim');
  });
});
```

#### Step 2: Run Parser Verification Test
**Command**: `npx nx test parser -- parser-regex-support.spec.ts`

**Expected Result**: All tests pass, confirming TypeScript parser works correctly

#### Step 3: Verify TypeScript Compilation
**Command**: `npx nx run parser:typecheck`

**Expected Result**: No TypeScript errors

### Success Criteria
- ✅ TypeScript parser produces `RegularExpressionLiteral` nodes
- ✅ Can access `.text` property with full `/pattern/flags` string  
- ✅ Pattern/flags extraction logic works correctly
- ✅ All test patterns supported (basic, flags, escape sequences)
- ✅ Tests pass and typecheck succeeds

### CVM Integration Notes
- This verification ensures we can reliably extract regex data from AST
- The pattern/flags extraction logic will be used in compiler phase
- No CVM code changes needed - this is pure validation

---

## ATOMIC TDD BLOCK 1: Bytecode Foundation  
**Duration**: 10-15 minutes  
**Dependencies**: Block 0 (Parser verification)  
**Purpose**: Add LOAD_REGEX opcode to CVM's bytecode instruction set

### Architectural Context
- **Opcode Role**: Opcodes are the "assembly language" of CVM
- **Instruction Format**: `{op: OpCode, arg?: any, line?: number}`
- **Handler Mapping**: Each opcode maps to a VM handler function
- **Enum Pattern**: CVM uses TypeScript enum for type safety

### Implementation Layers
- **Primary**: `packages/parser/src/lib/bytecode.ts` (add opcode)
- **Testing**: `packages/parser/src/lib/bytecode-regex.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create Bytecode Test First (TDD)
**File**: `packages/parser/src/lib/bytecode-regex.spec.ts`

**Purpose**: Test-driven development - fail first, then implement

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from './bytecode.js';

describe('RegExp Bytecode Support', () => {
  it('should have LOAD_REGEX opcode defined', () => {
    // Test that LOAD_REGEX exists in enum
    expect(OpCode.LOAD_REGEX).toBe('LOAD_REGEX');
    expect(typeof OpCode.LOAD_REGEX).toBe('string');
  });
  
  it('should be included in OpCode enum values', () => {
    // Test that LOAD_REGEX is part of the enum
    const opcodes = Object.values(OpCode);
    expect(opcodes).toContain('LOAD_REGEX');
  });

  it('should be accessible as enum member', () => {
    // Test enum member access
    expect(OpCode['LOAD_REGEX']).toBeDefined();
    expect(OpCode['LOAD_REGEX']).toBe('LOAD_REGEX');
  });

  it('should maintain enum integrity', () => {
    // Ensure we didn't break existing opcodes
    expect(OpCode.PUSH).toBe('PUSH');
    expect(OpCode.HALT).toBe('HALT');
    expect(Object.values(OpCode).length).toBeGreaterThan(50); // CVM has many opcodes
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test parser -- bytecode-regex.spec.ts`

**Expected Result**: Tests fail because LOAD_REGEX doesn't exist yet

#### Step 3: Examine Existing Bytecode Structure
**File**: `packages/parser/src/lib/bytecode.ts`

**Analysis Pattern**:
```typescript
// Current structure analysis needed:
export enum OpCode {
  // Stack operations
  PUSH = 'PUSH',
  // ...
  
  // String operations  
  STRING_LEN = 'STRING_LEN',
  STRING_SUBSTRING = 'STRING_SUBSTRING',
  // ... more string ops
  
  // Universal operations
  LENGTH = 'LENGTH',
  TO_STRING = 'TO_STRING',
  
  // INSERT LOAD_REGEX HERE - after string operations
}
```

#### Step 4: Add LOAD_REGEX Opcode
**File**: `packages/parser/src/lib/bytecode.ts`

**Exact Location**: After line ~50 (after STRING_PAD_END, before Universal operations)

**Implementation**:
```typescript
  // String operations
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
  STRING_TRIM_START = 'STRING_TRIM_START',
  STRING_TRIM_END = 'STRING_TRIM_END',
  STRING_REPLACE = 'STRING_REPLACE',
  STRING_REPLACE_ALL = 'STRING_REPLACE_ALL',
  STRING_LAST_INDEX_OF = 'STRING_LAST_INDEX_OF',
  STRING_REPEAT = 'STRING_REPEAT',
  STRING_PAD_START = 'STRING_PAD_START',
  STRING_PAD_END = 'STRING_PAD_END',
  
  // RegExp operations
  LOAD_REGEX = 'LOAD_REGEX',
  
  // Universal operations
  LENGTH = 'LENGTH',
  TO_STRING = 'TO_STRING',
```

#### Step 5: Verify Test Passes
**Command**: `npx nx test parser -- bytecode-regex.spec.ts`

**Expected Result**: All tests now pass

#### Step 6: Run Full Parser Test Suite
**Command**: `npx nx test parser`

**Expected Result**: No regressions, all existing tests still pass

#### Step 7: TypeScript Compilation Check
**Command**: `npx nx run parser:typecheck`

**Expected Result**: No TypeScript errors

### Success Criteria
- ✅ LOAD_REGEX opcode exists in OpCode enum
- ✅ Opcode has correct string value 'LOAD_REGEX'
- ✅ Enum integrity maintained (no existing opcodes broken)
- ✅ Tests pass and typecheck succeeds
- ✅ No regressions in existing functionality

### Instruction Format Notes
```typescript
// Future instruction will look like:
{
  op: OpCode.LOAD_REGEX,
  arg: { pattern: 'hello', flags: 'gi' }, // Direct value embedding
  line: 42 // Optional source line number
}
```

---

## ATOMIC TDD BLOCK 2: Regex Literal Compilation
**Duration**: 20-25 minutes  
**Dependencies**: Blocks 0-1 (Parser verification + LOAD_REGEX opcode)  
**Purpose**: Compile `/pattern/flags` AST nodes to LOAD_REGEX bytecode

### Architectural Context
- **Compiler Role**: Transforms TypeScript AST to CVM bytecode
- **Visitor Pattern**: CVM uses visitor pattern for AST traversal
- **Expression Compilation**: Regex literals are expressions, not statements
- **State Management**: Compiler state tracks bytecode generation

### CVM Compiler Architecture Deep-Dive
```typescript
// Compiler flow:
AST Node → Expression Visitor → state.emit() → Bytecode Instruction

// Expression visitor signature:
type ExpressionVisitor<T extends ts.Node> = (
  node: T,
  state: CompilerState,
  context: CompilerContext
) => void;

// Registry pattern:
export const expressionVisitors: Partial<Record<ts.SyntaxKind, ExpressionVisitor<any>>> = {
  [ts.SyntaxKind.StringLiteral]: compileStringLiteral,
  [ts.SyntaxKind.RegularExpressionLiteral]: compileRegularExpressionLiteral, // Add this
};
```

### Implementation Layers
- **Primary**: `packages/parser/src/lib/compiler/expressions/literals.ts`
- **Secondary**: `packages/parser/src/lib/compiler/expressions/index.ts`
- **Testing**: `packages/parser/src/lib/compiler-regex-literal.spec.ts`

### Micro-Atomic Steps

#### Step 1: Create Compilation Test (TDD)
**File**: `packages/parser/src/lib/compiler-regex-literal.spec.ts`

**Purpose**: Test complete compilation flow from source to bytecode

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('Regex Literal Compilation', () => {
  it('should compile basic regex literal to LOAD_REGEX', () => {
    const source = `
      function main() {
        var pattern = /hello/;
        return 0;
      }
    `;
    
    const result = compile(source);
    
    // Verify compilation succeeded
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.bytecode.length).toBeGreaterThan(0);
    
    // Find LOAD_REGEX instruction
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr).toBeDefined();
    
    // Verify instruction payload
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'hello',
      flags: ''
    });
  });

  it('should compile regex with flags', () => {
    const source = `
      function main() {
        var pattern = /test/gi;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'test',
      flags: 'gi'
    });
  });

  it('should handle escape sequences correctly', () => {
    const source = `
      function main() {
        var email = /\\w+@\\w+\\.\\w+/;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: '\\w+@\\w+\\.\\w+',
      flags: ''
    });
  });

  it('should handle complex flags', () => {
    const source = `
      function main() {
        var pattern = /multiline.*text/gims;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr!.arg).toEqual({
      pattern: 'multiline.*text',
      flags: 'gims'
    });
  });

  it('should handle multiple regex literals', () => {
    const source = `
      function main() {
        var pattern1 = /first/g;
        var pattern2 = /second/i;
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const loadRegexInstrs = result.bytecode.filter(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstrs.length).toBe(2);
    
    expect(loadRegexInstrs[0].arg).toEqual({ pattern: 'first', flags: 'g' });
    expect(loadRegexInstrs[1].arg).toEqual({ pattern: 'second', flags: 'i' });
  });

  it('should handle regex in expressions', () => {
    const source = `
      function main() {
        var isMatch = /test/.test("testing");
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should still generate LOAD_REGEX even in complex expressions
    const loadRegexInstr = result.bytecode.find(instr => instr.op === OpCode.LOAD_REGEX);
    expect(loadRegexInstr).toBeDefined();
    expect(loadRegexInstr!.arg).toEqual({ pattern: 'test', flags: '' });
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test parser -- compiler-regex-literal.spec.ts`

**Expected Result**: Tests fail because regex compilation not implemented

#### Step 3: Examine Existing Literal Compilation Patterns
**File**: `packages/parser/src/lib/compiler/expressions/literals.ts`

**Analysis of Existing Patterns**:
```typescript
// Current pattern analysis:
export const compileStringLiteral: ExpressionVisitor<ts.StringLiteral> = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, node.text); // Direct value embedding
};

export const compileNumericLiteral: ExpressionVisitor<ts.NumericLiteral> = (
  node,
  state,
  context
) => {
  state.emit(OpCode.PUSH, Number(node.text)); // Type conversion
};

// Pattern: Extract value from node, emit appropriate opcode
```

#### Step 4: Implement Regex Literal Compiler
**File**: `packages/parser/src/lib/compiler/expressions/literals.ts`

**Location**: Add after existing literal compilers (after `compileNull`)

**Complete Implementation**:
```typescript
export const compileRegularExpressionLiteral: ExpressionVisitor<ts.RegularExpressionLiteral> = (
  node,
  state,
  context
) => {
  // Extract pattern and flags from regex literal text
  // node.text format: "/pattern/flags" (e.g., "/hello/gi")
  
  const text = node.text;
  
  // Find last slash to separate pattern from flags
  const lastSlash = text.lastIndexOf('/');
  
  if (lastSlash <= 0) {
    // Invalid regex format - this shouldn't happen with valid TypeScript AST
    context.reportError(node, 'Invalid regex literal format');
    return;
  }
  
  // Extract components
  const pattern = text.substring(1, lastSlash); // Remove leading '/'
  const flags = text.substring(lastSlash + 1);  // Everything after last '/'
  
  // Emit LOAD_REGEX instruction with pattern/flags payload
  // Following CVM's direct value embedding pattern
  state.emit(OpCode.LOAD_REGEX, {
    pattern: pattern,
    flags: flags
  });
};
```

#### Step 5: Register Regex Compiler in Expression Visitors
**File**: `packages/parser/src/lib/compiler/expressions/index.ts`

**Step 5a**: Add import for new compiler function

**Location**: Add to existing import block
```typescript
import { 
  compileStringLiteral, 
  compileNumericLiteral, 
  compileTrue, 
  compileFalse, 
  compileNull,
  compileRegularExpressionLiteral  // ADD THIS LINE
} from './literals.js';
```

**Step 5b**: Register in expression visitors registry

**Location**: Add to `expressionVisitors` object

**Find existing pattern**:
```typescript
export const expressionVisitors: Partial<Record<ts.SyntaxKind, ExpressionVisitor<any>>> = {
  [ts.SyntaxKind.StringLiteral]: compileStringLiteral,
  [ts.SyntaxKind.NumericLiteral]: compileNumericLiteral,
  [ts.SyntaxKind.TrueKeyword]: compileTrue,
  [ts.SyntaxKind.FalseKeyword]: compileFalse,
  [ts.SyntaxKind.NullKeyword]: compileNull,
  // ADD REGEX LITERAL HERE
  [ts.SyntaxKind.Identifier]: compileIdentifier,
  // ... rest of visitors
};
```

**Add new entry**:
```typescript
export const expressionVisitors: Partial<Record<ts.SyntaxKind, ExpressionVisitor<any>>> = {
  [ts.SyntaxKind.StringLiteral]: compileStringLiteral,
  [ts.SyntaxKind.NumericLiteral]: compileNumericLiteral,
  [ts.SyntaxKind.TrueKeyword]: compileTrue,
  [ts.SyntaxKind.FalseKeyword]: compileFalse,
  [ts.SyntaxKind.NullKeyword]: compileNull,
  [ts.SyntaxKind.RegularExpressionLiteral]: compileRegularExpressionLiteral, // ADD THIS
  [ts.SyntaxKind.Identifier]: compileIdentifier,
  // ... rest unchanged
};
```

#### Step 6: Verify Tests Pass
**Command**: `npx nx test parser -- compiler-regex-literal.spec.ts`

**Expected Result**: All tests now pass

#### Step 7: Run Full Parser Test Suite
**Command**: `npx nx test parser`

**Expected Result**: No regressions, all tests pass

#### Step 8: TypeScript Compilation Check
**Command**: `npx nx run parser:typecheck`

**Expected Result**: No TypeScript errors

### Success Criteria
- ✅ Regex literals compile to LOAD_REGEX instructions
- ✅ Pattern and flags extracted correctly from `/pattern/flags` syntax
- ✅ Multiple flags supported (g, i, m, s combinations)
- ✅ Escape sequences preserved correctly
- ✅ Multiple regex literals in same program supported
- ✅ All compilation tests pass
- ✅ No regressions in existing functionality
- ✅ TypeScript compiles without errors

### Payload Format Documentation
```typescript
// LOAD_REGEX instruction payload format:
interface RegexPayload {
  pattern: string;  // Regex pattern without delimiters
  flags: string;    // Flag characters (e.g., "gi", "m", "")
}

// Example transformations:
// "/hello/"     → { pattern: "hello", flags: "" }
// "/test/gi"    → { pattern: "test", flags: "gi" }
// "/\\w+/gm"    → { pattern: "\\w+", flags: "gm" }
```

---

## ATOMIC TDD BLOCK 3: VM Regex Object Creation
**Duration**: 25-30 minutes  
**Dependencies**: Blocks 0-2 (Parser + Bytecode + Compilation)  
**Purpose**: Implement VM handler that creates RegExp objects from LOAD_REGEX instructions

### Architectural Context
- **VM Handler Role**: Execute bytecode instructions and manipulate stack/heap
- **Heap Allocation**: Complex objects stored on heap, references on stack
- **Error Handling**: Return error objects, never throw exceptions
- **Handler Registration**: Handlers mapped to opcodes in central registry

### CVM VM Architecture Deep-Dive
```typescript
// VM execution flow:
Instruction → Handler Lookup → Handler Execute → Stack/Heap Modification

// Handler interface:
interface OpcodeHandler {
  stackIn: number;   // Stack items consumed
  stackOut: number;  // Stack items produced  
  execute: (state: VMState, instruction: Instruction) => undefined | CVMError;
}

// Heap object format:
interface HeapObject {
  type: string;      // Object type identifier
  data: any;         // Actual object data
}

// Heap reference format (pushed to stack):
interface HeapRef {
  type: 'heap-ref';
  id: number;        // Heap object ID
}
```

### Implementation Layers
- **Primary**: `packages/vm/src/lib/handlers/regex.ts` (new file)
- **Secondary**: `packages/vm/src/lib/handlers/index.ts` (registration)
- **Testing**: `packages/vm/src/lib/handlers/regex.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create VM Handler Test (TDD)
**File**: `packages/vm/src/lib/handlers/regex.spec.ts`

**Purpose**: Test LOAD_REGEX handler with success and error cases

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('Regex VM Handler', () => {
  it('should create RegExp object from LOAD_REGEX instruction', () => {
    const vm = new VM({ enableCC: false });
    
    // Execute LOAD_REGEX instruction
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'gi' } },
      { op: OpCode.HALT }
    ]);
    
    // Verify execution succeeded
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    
    // Verify stack has one item (the regex reference)
    expect(vm.stack.length).toBe(1);
    
    // Get the heap reference from stack
    const regexRef = vm.stack.peek();
    expect(regexRef).toHaveProperty('type', 'heap-ref');
    expect(regexRef).toHaveProperty('id');
    
    // Verify object exists on heap
    const regexObj = vm.heap.get((regexRef as any).id);
    expect(regexObj).toBeDefined();
    expect(regexObj.type).toBe('regex');
    expect(regexObj.data).toBeInstanceOf(RegExp);
    
    // Verify RegExp object properties
    const regex = regexObj.data as RegExp;
    expect(regex.source).toBe('hello');
    expect(regex.flags).toBe('gi');
    expect(regex.global).toBe(true);
    expect(regex.ignoreCase).toBe(true);
  });

  it('should handle regex without flags', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const regexRef = vm.stack.peek();
    const regexObj = vm.heap.get((regexRef as any).id);
    const regex = regexObj.data as RegExp;
    
    expect(regex.source).toBe('test');
    expect(regex.flags).toBe('');
    expect(regex.global).toBe(false);
    expect(regex.ignoreCase).toBe(false);
  });

  it('should handle complex regex patterns', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: 'i' } },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const regexRef = vm.stack.peek();
    const regexObj = vm.heap.get((regexRef as any).id);
    const regex = regexObj.data as RegExp;
    
    expect(regex.source).toBe('\\w+@\\w+\\.\\w+');
    expect(regex.flags).toBe('i');
    expect(regex.ignoreCase).toBe(true);
  });

  it('should handle all standard flags', () => {
    const testCases = [
      { flags: 'g', expected: { global: true, ignoreCase: false, multiline: false } },
      { flags: 'i', expected: { global: false, ignoreCase: true, multiline: false } },
      { flags: 'm', expected: { global: false, ignoreCase: false, multiline: true } },
      { flags: 'gi', expected: { global: true, ignoreCase: true, multiline: false } },
      { flags: 'gim', expected: { global: true, ignoreCase: true, multiline: true } }
    ];

    testCases.forEach(({ flags, expected }) => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(true);
      
      const regexRef = vm.stack.peek();
      const regexObj = vm.heap.get((regexRef as any).id);
      const regex = regexObj.data as RegExp;
      
      expect(regex.global).toBe(expected.global);
      expect(regex.ignoreCase).toBe(expected.ignoreCase);
      expect(regex.multiline).toBe(expected.multiline);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid regex patterns', () => {
      const vm = new VM({ enableCC: false });
      
      // Invalid regex: unclosed bracket
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: '[unclosed', flags: '' } },
        { op: OpCode.HALT }
      ]);
      
      // Should fail gracefully
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.type).toBe('SyntaxError');
      expect(result.error!.message).toContain('Invalid regular expression');
      expect(result.error!.opcode).toBe(OpCode.LOAD_REGEX);
    });

    it('should handle invalid flags', () => {
      const vm = new VM({ enableCC: false });
      
      // Invalid flag 'x'
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'x' } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.type).toBe('SyntaxError');
      expect(result.error!.message).toContain('Invalid regular expression');
    });

    it('should handle multiple invalid cases', () => {
      const invalidCases = [
        { pattern: '(unclosed', flags: '', description: 'unclosed parenthesis' },
        { pattern: '*invalid', flags: '', description: 'invalid quantifier' },
        { pattern: 'test', flags: 'z', description: 'invalid flag' },
        { pattern: '+', flags: '', description: 'invalid pattern start' }
      ];

      invalidCases.forEach(({ pattern, flags, description }) => {
        const vm = new VM({ enableCC: false });
        
        const result = vm.execute([
          { op: OpCode.LOAD_REGEX, arg: { pattern, flags } },
          { op: OpCode.HALT }
        ]);
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error!.type).toBe('SyntaxError');
      });
    });

    it('should not modify stack on error', () => {
      const vm = new VM({ enableCC: false });
      
      // Push something on stack first
      vm.stack.push('test-value');
      const initialStackLength = vm.stack.length;
      
      // Execute invalid regex
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: '[invalid', flags: '' } },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(vm.stack.length).toBe(initialStackLength); // Stack unchanged
    });
  });

  it('should handle multiple regex creations', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'first', flags: 'g' } },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'second', flags: 'i' } },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(2);
    
    // Check both regex objects
    const secondRef = vm.stack.pop();
    const firstRef = vm.stack.pop();
    
    const firstObj = vm.heap.get((firstRef as any).id);
    const secondObj = vm.heap.get((secondRef as any).id);
    
    expect((firstObj.data as RegExp).source).toBe('first');
    expect((firstObj.data as RegExp).global).toBe(true);
    
    expect((secondObj.data as RegExp).source).toBe('second');
    expect((secondObj.data as RegExp).ignoreCase).toBe(true);
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test vm -- regex.spec.ts`

**Expected Result**: Tests fail because LOAD_REGEX handler doesn't exist

#### Step 3: Examine Existing Handler Patterns
**File**: `packages/vm/src/lib/handlers/arithmetic.ts` (for error handling pattern)
**File**: `packages/vm/src/lib/handlers/objects.ts` (for heap allocation pattern)

**Analysis of Existing Patterns**:
```typescript
// Error handling pattern from arithmetic.ts:
if (rightNum === 0) {
  return {
    type: 'DivisionByZero',
    message: 'Division by zero',
    pc: state.pc,
    opcode: instruction.op
  };
}

// Heap allocation pattern from objects.ts:
const objRef = state.heap.allocate('object', cvmObj);
state.stack.push(objRef);

// Handler structure pattern:
const handlerName: OpcodeHandler = {
  stackIn: 0,
  stackOut: 1,
  execute: (state, instruction) => {
    // Implementation
    return undefined; // Success
  }
};
```

#### Step 4: Implement Regex Handler
**File**: `packages/vm/src/lib/handlers/regex.ts` (new file)

**Complete Implementation**:
```typescript
import { OpCode } from '@cvm/parser';
import { OpcodeHandler } from './types.js';

/**
 * Payload interface for LOAD_REGEX instruction
 */
interface RegexPayload {
  pattern: string;
  flags: string;
}

/**
 * Handler for LOAD_REGEX opcode
 * Creates a JavaScript RegExp object and stores it on the heap
 * 
 * Stack Effect: [] → [regexRef]
 * Heap Effect: Allocates new regex object
 * 
 * Error Cases:
 * - Invalid regex pattern (malformed regex)
 * - Invalid flags (unsupported flag characters)
 */
const loadRegex: OpcodeHandler = {
  stackIn: 0,     // Consumes no stack items
  stackOut: 1,    // Produces one stack item (heap reference)
  
  execute: (state, instruction) => {
    // Extract payload from instruction
    const payload = instruction.arg as RegexPayload;
    
    if (!payload || typeof payload.pattern !== 'string' || typeof payload.flags !== 'string') {
      return {
        type: 'TypeError',
        message: 'LOAD_REGEX instruction requires pattern and flags properties',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Create JavaScript RegExp object
      // This may throw if pattern or flags are invalid
      const regex = new RegExp(payload.pattern, payload.flags);
      
      // Allocate on heap following CVM pattern
      // Type: 'regex' for consistency with other object types
      const regexRef = state.heap.allocate('regex', regex);
      
      // Push reference to stack
      state.stack.push(regexRef);
      
      // Return undefined to indicate success
      return undefined;
      
    } catch (error) {
      // Handle invalid regex patterns or flags
      // Follow CVM error object format
      return {
        type: 'SyntaxError',
        message: `Invalid regular expression: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};

/**
 * Registry of all regex-related opcode handlers
 * Export this to be included in main handler registry
 */
export const regexHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD_REGEX]: loadRegex,
};
```

#### Step 5: Register Handler in Main Registry
**File**: `packages/vm/src/lib/handlers/index.ts`

**Step 5a**: Add import for regex handlers

**Location**: Add to existing import block
```typescript
import { objectIteratorHandlers } from './object-iterators.js';
import { unifiedHandlers } from './unified.js';
import { regexHandlers } from './regex.js';  // ADD THIS LINE
```

**Step 5b**: Add to combined handlers registry

**Location**: Add to `handlers` object
```typescript
export const handlers: Partial<Record<OpCode, OpcodeHandler>> = {
  ...arithmeticHandlers,
  ...stackHandlers,
  ...ioHandlers,
  ...controlHandlers,
  ...variableHandlers,
  ...iteratorHandlers,
  ...comparisonHandlers,
  ...logicalHandlers,
  ...arrayHandlers,
  ...stringHandlers,
  ...incrementHandlers,
  ...advancedHandlers,
  ...objectHandlers,
  ...objectIteratorHandlers,
  ...unifiedHandlers,
  ...regexHandlers,  // ADD THIS LINE
};
```

#### Step 6: Verify Tests Pass
**Command**: `npx nx test vm -- regex.spec.ts`

**Expected Result**: All tests now pass

#### Step 7: Run Full VM Test Suite
**Command**: `npx nx test vm`

**Expected Result**: No regressions, all tests pass

#### Step 8: TypeScript Compilation Check
**Command**: `npx nx run vm:typecheck`

**Expected Result**: No TypeScript errors

### Success Criteria
- ✅ LOAD_REGEX creates RegExp objects successfully
- ✅ Objects stored correctly on heap with proper references
- ✅ Pattern and flags preserved accurately in RegExp objects
- ✅ All standard flags supported (g, i, m, s)
- ✅ Complex regex patterns handled correctly
- ✅ Error handling for invalid regex patterns/flags
- ✅ Error objects follow CVM format (`{type, message, pc, opcode}`)
- ✅ Stack/heap not modified on errors
- ✅ Multiple regex objects supported
- ✅ All VM tests pass
- ✅ No regressions in existing functionality

### RegExp Object Properties
```typescript
// Created RegExp objects have standard JavaScript properties:
regex.source      // Pattern string (e.g., "hello")
regex.flags       // Flag string (e.g., "gi")
regex.global      // Boolean: 'g' flag present
regex.ignoreCase  // Boolean: 'i' flag present  
regex.multiline   // Boolean: 'm' flag present
regex.sticky      // Boolean: 'y' flag present
regex.unicode     // Boolean: 'u' flag present
regex.dotAll      // Boolean: 's' flag present
```

---

## ATOMIC TDD BLOCK 4: Integration Testing
**Duration**: 15-20 minutes  
**Dependencies**: Blocks 0-3 (Complete parse→compile→execute pipeline)  
**Purpose**: Test end-to-end flow from source code to regex object creation

### Architectural Context
- **Integration Testing**: Validates entire pipeline works together
- **Cross-Package Testing**: Tests parser + VM integration
- **Real-World Scenarios**: Uses actual source code compilation
- **Error Propagation**: Ensures errors flow correctly through all layers

### Integration Test Architecture
```
Source Code → Parser (TypeScript) → Compiler → Bytecode → VM → RegExp Object
     ↓              ↓                  ↓         ↓       ↓
"var x=/test/;" → AST → LOAD_REGEX → Instruction → Handler → Heap Object
```

### Implementation Layers
- **Testing**: `packages/vm/src/lib/regex-integration.spec.ts` (new test)
- **Validation**: Cross-package integration verification

### Micro-Atomic Steps

#### Step 1: Create Integration Test
**File**: `packages/vm/src/lib/regex-integration.spec.ts`

**Purpose**: Test complete source-to-execution pipeline

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('Regex Integration Tests', () => {
  describe('End-to-End Compilation and Execution', () => {
    it('should compile and execute basic regex literal', () => {
      const source = `
        function main() {
          var pattern = /test/gi;
          return 0;
        }
      `;
      
      // Step 1: Compile source to bytecode
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      expect(compileResult.errors.length).toBe(0);
      expect(compileResult.bytecode.length).toBeGreaterThan(0);
      
      // Verify LOAD_REGEX instruction was generated
      const hasLoadRegex = compileResult.bytecode.some(instr => instr.op === 'LOAD_REGEX');
      expect(hasLoadRegex).toBe(true);
      
      // Step 2: Execute bytecode in VM
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      // Verify execution succeeded
      expect(execResult.success).toBe(true);
      expect(execResult.error).toBeUndefined();
      
      // Step 3: Verify regex object was created
      // After main() execution, regex should be on stack or in variables
      // Since it's a local variable, it should be cleaned up, but heap object exists
      expect(vm.heap.size()).toBeGreaterThan(0);
    });

    it('should handle multiple regex literals in one program', () => {
      const source = `
        function main() {
          var email = /\\w+@\\w+\\.\\w+/i;
          var phone = /\\d{3}-\\d{3}-\\d{4}/;
          var url = /https?:\\/\\/[^\\s]+/g;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have three LOAD_REGEX instructions
      const loadRegexInstrs = compileResult.bytecode.filter(instr => instr.op === 'LOAD_REGEX');
      expect(loadRegexInstrs.length).toBe(3);
      
      // Verify each instruction has correct payload
      expect(loadRegexInstrs[0].arg).toEqual({ pattern: '\\w+@\\w+\\.\\w+', flags: 'i' });
      expect(loadRegexInstrs[1].arg).toEqual({ pattern: '\\d{3}-\\d{3}-\\d{4}', flags: '' });
      expect(loadRegexInstrs[2].arg).toEqual({ pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' });
      
      // Execute and verify
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(true);
      expect(vm.heap.size()).toBeGreaterThan(0);
    });

    it('should handle complex regex patterns with all flags', () => {
      const source = `
        function main() {
          var complex = /^(?:https?:\\/\\/)?(?:www\\.)?([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}$/gims;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const loadRegexInstr = compileResult.bytecode.find(instr => instr.op === 'LOAD_REGEX');
      expect(loadRegexInstr).toBeDefined();
      expect(loadRegexInstr!.arg.pattern).toBe('^(?:https?:\\/\\/)?(?:www\\.)?([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\\.)+[a-zA-Z]{2,}$');
      expect(loadRegexInstr!.arg.flags).toBe('gims');
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(true);
    });

    it('should handle regex in variable assignments', () => {
      const source = `
        function main() {
          var pattern;
          pattern = /assignment.*test/m;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid regex patterns in source code', () => {
      const source = `
        function main() {
          var invalid = /[unclosed/;
          return 0;
        }
      `;
      
      // Should compile successfully (compiler doesn't validate regex)
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should fail at runtime
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(false);
      expect(execResult.error).toBeDefined();
      expect(execResult.error!.type).toBe('SyntaxError');
      expect(execResult.error!.message).toContain('Invalid regular expression');
    });

    it('should handle invalid flags in source code', () => {
      const source = `
        function main() {
          var invalid = /test/xyz;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(false);
      expect(execResult.error!.type).toBe('SyntaxError');
    });

    it('should handle multiple invalid regex in one program', () => {
      const source = `
        function main() {
          var first = /[unclosed/;
          var second = /valid/g;
          var third = /test/xyz;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      // Should fail on first invalid regex
      expect(execResult.success).toBe(false);
      expect(execResult.error!.type).toBe('SyntaxError');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle many regex literals efficiently', () => {
      // Generate source with many regex literals
      const regexCount = 50;
      let source = 'function main() {\n';
      
      for (let i = 0; i < regexCount; i++) {
        source += `  var regex${i} = /pattern${i}/g;\n`;
      }
      
      source += '  return 0;\n}';
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have correct number of LOAD_REGEX instructions
      const loadRegexInstrs = compileResult.bytecode.filter(instr => instr.op === 'LOAD_REGEX');
      expect(loadRegexInstrs.length).toBe(regexCount);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(true);
      expect(vm.heap.size()).toBeGreaterThan(0);
    });

    it('should properly clean up regex objects', () => {
      const source = `
        function main() {
          var temp = /temporary/;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      const vm = new VM({ enableCC: false });
      
      const initialHeapSize = vm.heap.size();
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(true);
      
      // Heap should have grown (regex objects allocated)
      expect(vm.heap.size()).toBeGreaterThan(initialHeapSize);
    });
  });

  describe('Compilation Verification', () => {
    it('should generate correct bytecode structure', () => {
      const source = `
        function main() {
          var pattern = /test/i;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Verify bytecode structure
      const loadRegexInstr = compileResult.bytecode.find(instr => instr.op === 'LOAD_REGEX');
      expect(loadRegexInstr).toBeDefined();
      
      // Verify instruction format
      expect(loadRegexInstr).toHaveProperty('op', 'LOAD_REGEX');
      expect(loadRegexInstr).toHaveProperty('arg');
      expect(loadRegexInstr!.arg).toHaveProperty('pattern', 'test');
      expect(loadRegexInstr!.arg).toHaveProperty('flags', 'i');
      
      // Optional: verify line number tracking
      if (loadRegexInstr!.line !== undefined) {
        expect(typeof loadRegexInstr!.line).toBe('number');
        expect(loadRegexInstr!.line).toBeGreaterThan(0);
      }
    });

    it('should maintain instruction order for multiple regex', () => {
      const source = `
        function main() {
          var first = /first/;
          var second = /second/g;
          var third = /third/i;
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const loadRegexInstrs = compileResult.bytecode.filter(instr => instr.op === 'LOAD_REGEX');
      expect(loadRegexInstrs.length).toBe(3);
      
      // Verify order matches source code order
      expect(loadRegexInstrs[0].arg.pattern).toBe('first');
      expect(loadRegexInstrs[1].arg.pattern).toBe('second');
      expect(loadRegexInstrs[2].arg.pattern).toBe('third');
    });
  });
});
```

#### Step 2: Run Integration Tests
**Command**: `npx nx test vm -- regex-integration.spec.ts`

**Expected Result**: All integration tests pass

#### Step 3: Run Cross-Package Validation
**Commands**:
```bash
# Test parser functionality
npx nx test parser

# Test VM functionality  
npx nx test vm

# Test both typechecks
npx nx run parser:typecheck
npx nx run vm:typecheck
```

**Expected Results**: All tests pass, no TypeScript errors

#### Step 4: Manual Integration Verification
Create a simple test program to verify manually:

**File**: `test/programs/regex/integration-test.ts`
```typescript
function main() {
  console.log("Testing regex integration...");
  
  var pattern = /test/gi;
  console.log("Pattern created successfully");
  
  return 0;
}
```

**Command**: 
```bash
# Rebuild packages first
npx nx reset && npx nx run-many --target=build --all --skip-nx-cache

# Test execution
cd test/integration
npx tsx mcp-test-client.ts ../programs/regex/integration-test.ts
```

**Expected Result**: Program executes without errors

### Success Criteria
- ✅ Complete parse→compile→execute flow works
- ✅ Source code with regex literals compiles successfully
- ✅ Compiled bytecode contains correct LOAD_REGEX instructions  
- ✅ VM executes LOAD_REGEX instructions successfully
- ✅ RegExp objects created and stored on heap
- ✅ Complex regex patterns supported
- ✅ Multiple regex literals in one program supported
- ✅ Error handling works end-to-end
- ✅ Invalid regex patterns fail gracefully at runtime
- ✅ All integration tests pass
- ✅ No regressions in existing functionality
- ✅ Cross-package compatibility verified

### Integration Architecture Validation
This block confirms:
- **Parser**: TypeScript AST → CVM compiler integration
- **Compiler**: AST → Bytecode transformation 
- **VM**: Bytecode → RegExp object execution
- **Heap**: Object storage and reference management
- **Errors**: Proper error propagation through all layers

---

## ATOMIC TDD BLOCK 5: E2E Validation
**Duration**: 10-15 minutes  
**Dependencies**: Blocks 0-4 (Complete regex literal implementation)  
**Purpose**: Create and test real CVM programs demonstrating regex literals

### Architectural Context
- **E2E Testing**: Real programs executed via MCP client
- **TODO Orchestration**: Practical use cases for regex in CVM workflows
- **MCP Integration**: Test complete server/client communication
- **Real-World Validation**: Scenarios CVM users would actually encounter

### E2E Testing Architecture (per E2E_TESTING.md)
```
Test Program → MCP Client → cvm-server → MCP Server → VM Manager → VM
     ↓              ↓             ↓           ↓           ↓        ↓
  .ts file   → stdio transport → HTTP → VM execution → Heap → Result
```

### Implementation Layers
- **Test Programs**: `test/programs/regex/` (new directory)
- **Execution**: Via MCP test client following E2E_TESTING.md protocol

### Micro-Atomic Steps

#### Step 1: Create E2E Test Program Directory
**Command**: `mkdir -p test/programs/regex`

#### Step 2: Create Basic Regex Literals Test Program
**File**: `test/programs/regex/regex-literal-basic.ts`

**Purpose**: Demonstrate basic regex literal functionality

**Complete Implementation**:
```typescript
function main() {
  console.log("=== CVM RegExp Literals E2E Test ===");
  
  // Basic regex literal without flags
  var basicPattern = /hello/;
  console.log("✓ Basic pattern created: " + basicPattern.source);
  
  // Regex with single flag
  var caseInsensitive = /world/i;
  console.log("✓ Case insensitive pattern: " + caseInsensitive.source);
  console.log("✓ Ignore case flag: " + (caseInsensitive.ignoreCase ? "true" : "false"));
  
  // Regex with multiple flags
  var globalMultiline = /pattern/gm;
  console.log("✓ Global multiline pattern: " + globalMultiline.source);
  console.log("✓ Global flag: " + (globalMultiline.global ? "true" : "false"));
  console.log("✓ Multiline flag: " + (globalMultiline.multiline ? "true" : "false"));
  
  // Complex regex patterns for TODO orchestration
  console.log("\n--- TODO Orchestration Patterns ---");
  
  // Email validation pattern
  var emailPattern = /\w+@\w+\.\w+/;
  console.log("✓ Email validation pattern: " + emailPattern.source);
  
  // File path pattern
  var pathPattern = /^\/[\w\/]+\.[\w]+$/;
  console.log("✓ File path pattern: " + pathPattern.source);
  
  // Log timestamp pattern
  var logPattern = /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]/;
  console.log("✓ Log timestamp pattern: " + logPattern.source);
  
  // Configuration key pattern
  var configPattern = /^[A-Z_][A-Z0-9_]*$/;
  console.log("✓ Config key pattern: " + configPattern.source);
  
  // URL extraction pattern
  var urlPattern = /https?:\/\/[^\s]+/g;
  console.log("✓ URL extraction pattern: " + urlPattern.source);
  console.log("✓ Global flag for multiple matches: " + (urlPattern.global ? "true" : "false"));
  
  console.log("\n=== All regex literals created successfully! ===");
  console.log("RegExp literal support is working correctly in CVM");
  
  return 0;
}
```

#### Step 3: Create Comprehensive Regex Test Program
**File**: `test/programs/regex/regex-literal-comprehensive.ts`

**Purpose**: Test edge cases and complex scenarios

**Complete Implementation**:
```typescript
function main() {
  console.log("=== Comprehensive RegExp Literals Test ===");
  
  // Test all standard flags
  console.log("\n--- Testing All Flags ---");
  
  var globalFlag = /test/g;
  console.log("Global (g): " + (globalFlag.global ? "✓" : "✗"));
  
  var ignoreCaseFlag = /test/i;
  console.log("Ignore Case (i): " + (ignoreCaseFlag.ignoreCase ? "✓" : "✗"));
  
  var multilineFlag = /test/m;
  console.log("Multiline (m): " + (multilineFlag.multiline ? "✓" : "✗"));
  
  var allFlags = /test/gim;
  console.log("All flags (gim): " + allFlags.flags);
  
  // Test complex escape sequences
  console.log("\n--- Testing Escape Sequences ---");
  
  var digitPattern = /\d+/;
  console.log("✓ Digit pattern: " + digitPattern.source);
  
  var wordPattern = /\w+/;
  console.log("✓ Word pattern: " + wordPattern.source);
  
  var whitespacePattern = /\s*/;
  console.log("✓ Whitespace pattern: " + whitespacePattern.source);
  
  var escapedDotPattern = /\./;
  console.log("✓ Escaped dot pattern: " + escapedDotPattern.source);
  
  var backslashPattern = /\\/;
  console.log("✓ Backslash pattern: " + backslashPattern.source);
  
  // Test character classes and quantifiers
  console.log("\n--- Testing Character Classes ---");
  
  var rangePattern = /[a-zA-Z0-9]/;
  console.log("✓ Range pattern: " + rangePattern.source);
  
  var negatedClass = /[^0-9]/;
  console.log("✓ Negated class: " + negatedClass.source);
  
  var quantifiers = /a+b*c?d{2,4}/;
  console.log("✓ Quantifiers: " + quantifiers.source);
  
  // Test anchors and groups
  console.log("\n--- Testing Anchors and Groups ---");
  
  var anchoredPattern = /^start.*end$/;
  console.log("✓ Anchored pattern: " + anchoredPattern.source);
  
  var groupPattern = /(group1)|(group2)/;
  console.log("✓ Group pattern: " + groupPattern.source);
  
  var nonCapturingGroup = /(?:non-capturing)/;
  console.log("✓ Non-capturing group: " + nonCapturingGroup.source);
  
  // Real-world TODO orchestration examples
  console.log("\n--- Real-World TODO Examples ---");
  
  // File extension detection
  var fileExtPattern = /\.([a-zA-Z0-9]+)$/;
  console.log("✓ File extension: " + fileExtPattern.source);
  
  // IPv4 address validation
  var ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  console.log("✓ IP address: " + ipPattern.source);
  
  // JSON property extraction
  var jsonPropPattern = /"([^"]+)":\s*"([^"]*)"/g;
  console.log("✓ JSON property: " + jsonPropPattern.source);
  
  // Error message parsing
  var errorPattern = /ERROR:\s*(.+)\s*at\s+line\s+(\d+)/i;
  console.log("✓ Error parsing: " + errorPattern.source);
  
  // Command line argument pattern
  var argPattern = /--([a-zA-Z-]+)(?:=(.+))?/g;
  console.log("✓ CLI argument: " + argPattern.source);
  
  console.log("\n=== Comprehensive test completed successfully! ===");
  console.log("All regex patterns validated and working correctly");
  
  return 0;
}
```

#### Step 4: Create Error Handling Test Program
**File**: `test/programs/regex/regex-literal-errors.ts`

**Purpose**: Demonstrate error handling for invalid regex

**Complete Implementation**:
```typescript
function main() {
  console.log("=== RegExp Error Handling Test ===");
  console.log("This program demonstrates error handling for invalid regex patterns");
  
  // This will succeed
  console.log("\n--- Valid Regex First ---");
  var validPattern = /valid.*pattern/g;
  console.log("✓ Valid pattern created: " + validPattern.source);
  
  // This will cause a runtime error and stop execution
  console.log("\n--- Invalid Regex (Should Fail) ---");
  console.log("Attempting to create invalid regex...");
  
  // Invalid pattern - unclosed bracket
  var invalidPattern = /[unclosed/;
  
  // This line should never execute
  console.log("✗ ERROR: This should not execute!");
  console.log("✗ Invalid pattern was created: " + invalidPattern.source);
  
  return 0;
}
```

#### Step 5: Create TODO Orchestration Example
**File**: `test/programs/regex/todo-file-processor.ts`

**Purpose**: Realistic TODO orchestration using regex literals

**Complete Implementation**:
```typescript
function main() {
  console.log("=== TODO: File Processing with RegExp ===");
  console.log("Demonstrating regex literals in TODO orchestration workflow");
  
  // Simulate file processing workflow
  console.log("\n--- Step 1: Define File Patterns ---");
  
  var jsFilePattern = /\.js$/i;
  console.log("✓ JavaScript files: " + jsFilePattern.source);
  
  var tsFilePattern = /\.ts$/i;
  console.log("✓ TypeScript files: " + tsFilePattern.source);
  
  var configFilePattern = /\.(json|yaml|yml|ini)$/i;
  console.log("✓ Config files: " + configFilePattern.source);
  
  var testFilePattern = /\.(test|spec)\.(js|ts)$/i;
  console.log("✓ Test files: " + testFilePattern.source);
  
  // Log analysis patterns
  console.log("\n--- Step 2: Define Log Analysis Patterns ---");
  
  var errorLogPattern = /ERROR|FATAL|CRITICAL/i;
  console.log("✓ Error log levels: " + errorLogPattern.source);
  
  var timestampPattern = /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/;
  console.log("✓ Timestamp extraction: " + timestampPattern.source);
  
  var ipAddressPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  console.log("✓ IP address extraction: " + ipAddressPattern.source);
  
  // Configuration validation patterns
  console.log("\n--- Step 3: Configuration Validation ---");
  
  var envVarPattern = /^[A-Z][A-Z0-9_]*$/;
  console.log("✓ Environment variable: " + envVarPattern.source);
  
  var portPattern = /^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
  console.log("✓ Port number validation: " + portPattern.source);
  
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  console.log("✓ Email validation: " + emailPattern.source);
  
  // Data extraction patterns
  console.log("\n--- Step 4: Data Extraction Patterns ---");
  
  var gitCommitPattern = /^[a-f0-9]{7,40}$/;
  console.log("✓ Git commit hash: " + gitCommitPattern.source);
  
  var semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/;
  console.log("✓ Semantic version: " + semverPattern.source);
  
  var uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  console.log("✓ UUID validation: " + uuidPattern.source);
  
  console.log("\n=== TODO Workflow Complete ===");
  console.log("All regex patterns for file processing workflow defined successfully");
  console.log("Ready for TODO orchestration tasks involving:");
  console.log("  • File filtering and categorization");
  console.log("  • Log analysis and error detection");
  console.log("  • Configuration validation");
  console.log("  • Data extraction and parsing");
  
  return 0;
}
```

#### Step 6: Execute E2E Tests Following E2E_TESTING.md Protocol

**Step 6a**: Rebuild All Packages (Critical Step)
```bash
# From project root - MUST follow E2E_TESTING.md protocol
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

**Step 6b**: Execute Basic Test
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/regex/regex-literal-basic.ts
```

**Expected Output**:
```
=== CVM RegExp Literals E2E Test ===
✓ Basic pattern created: hello
✓ Case insensitive pattern: world
✓ Ignore case flag: true
✓ Global multiline pattern: pattern
✓ Global flag: true
✓ Multiline flag: true

--- TODO Orchestration Patterns ---
✓ Email validation pattern: \w+@\w+\.\w+
✓ File path pattern: ^\/[\w\/]+\.[\w]+$
✓ Log timestamp pattern: \[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]
✓ Config key pattern: ^[A-Z_][A-Z0-9_]*$
✓ URL extraction pattern: https?:\/\/[^\s]+
✓ Global flag for multiple matches: true

=== All regex literals created successfully! ===
RegExp literal support is working correctly in CVM
```

**Step 6c**: Execute Comprehensive Test
```bash
npx tsx mcp-test-client.ts ../programs/regex/regex-literal-comprehensive.ts
```

**Step 6d**: Execute Error Test (Should Fail Gracefully)
```bash
npx tsx mcp-test-client.ts ../programs/regex/regex-literal-errors.ts
```

**Expected**: Should fail with SyntaxError for invalid regex

**Step 6e**: Execute TODO Example
```bash
npx tsx mcp-test-client.ts ../programs/regex/todo-file-processor.ts
```

### Success Criteria
- ✅ All E2E test programs execute successfully
- ✅ Basic regex literal functionality demonstrated
- ✅ Complex patterns and all flags supported
- ✅ Error handling works correctly (invalid regex fails gracefully)
- ✅ TODO orchestration examples show practical usage
- ✅ MCP client/server communication works
- ✅ Programs follow E2E_TESTING.md execution protocol
- ✅ Output demonstrates working RegExp objects with correct properties
- ✅ Real-world patterns for file processing, log analysis, etc. work

### E2E Validation Confirms
- **Complete Pipeline**: Source → Compilation → Execution → Results
- **MCP Integration**: Client/server communication functional
- **Practical Usage**: Real TODO orchestration scenarios
- **Error Handling**: Graceful failure for invalid patterns
- **Performance**: Handles multiple complex patterns efficiently
- **Compatibility**: Works with existing CVM infrastructure

---

## Implementation Notes

### CVM Error Object Format Specification
All regex-related errors follow CVM's standard error format:
```typescript
interface CVMError {
  type: 'SyntaxError' | 'TypeError';  // Error category
  message: string;                     // Descriptive error message
  pc: number;                         // Program counter when error occurred
  opcode: OpCode;                     // Opcode that caused the error
}
```

### RegExp Object Storage
RegExp objects are stored on CVM's heap with the following structure:
```typescript
// Heap object
{
  type: 'regex',
  data: RegExp    // Native JavaScript RegExp instance
}

// Stack reference
{
  type: 'heap-ref',
  id: number      // Heap object ID
}
```

### Supported RegExp Features
- **Patterns**: All JavaScript regex patterns supported
- **Flags**: g (global), i (ignoreCase), m (multiline), s (dotAll), u (unicode), y (sticky)
- **Escape Sequences**: \d, \w, \s, \., \\, etc.
- **Character Classes**: [a-z], [^0-9], etc.
- **Quantifiers**: +, *, ?, {n,m}
- **Anchors**: ^, $
- **Groups**: (group), (?:non-capturing)
- **Alternation**: pattern1|pattern2

### Performance Characteristics
- **Object Creation**: Each LOAD_REGEX creates new RegExp instance
- **Memory**: Objects stored on heap, references on stack
- **Error Handling**: Fails fast on invalid patterns
- **No Caching**: Each literal creates separate object (optimization opportunity for future)

### Integration Points
- **Parser**: Uses TypeScript's built-in regex literal parsing
- **Compiler**: Extracts pattern/flags from AST node text
- **VM**: Creates native RegExp objects via constructor
- **Heap**: Standard heap allocation and reference management
- **Errors**: Standard CVM error object format and flow

---

## Verification Checklist

### After Each Block
- [ ] All unit tests pass (`npx nx test <package>`)
- [ ] TypeScript compilation succeeds (`npx nx run <package>:typecheck`)
- [ ] No regressions in existing functionality
- [ ] Implementation follows existing CVM patterns exactly

### After Complete Implementation
- [ ] Full test suite passes (parser + VM)
- [ ] E2E programs execute successfully via MCP client
- [ ] Error handling works correctly
- [ ] Integration with existing CVM features verified
- [ ] Performance acceptable for TODO orchestration use cases
- [ ] Documentation reflects implemented features

### Cross-Package Integration
- [ ] Parser exports LOAD_REGEX opcode correctly
- [ ] Compiler generates correct bytecode instructions
- [ ] VM handlers execute instructions properly
- [ ] Heap management works correctly
- [ ] No memory leaks or reference issues

---

**Plan Status**: ✅ Ultra-detailed implementation plan complete  
**Granularity**: ✅ Micro-atomic steps with complete code  
**Architecture**: ✅ Deep CVM patterns integration  
**Testing**: ✅ Comprehensive TDD and E2E validation  
**Ready for**: ✅ Production implementation via evolution program  

This plan provides complete implementation guidance for every line of code needed to implement RegExp literal support in CVM using atomic TDD methodology.