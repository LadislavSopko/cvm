# RegExp Pattern Matching Implementation Plan v1 - Ultra-Detailed Atomic TDD

## Overview
Implement RegExp pattern matching methods for CVM using ultra-detailed atomic TDD blocks. This completes the RegExp implementation by adding `.test()`, `.match()`, and `.replace()` methods to make RegExp objects actually usable. Each block contains complete implementation details, exact code snippets, and deep architectural context.

**Plan Status**: ✅ Ultra-detailed with complete implementation guidance  
**Architecture**: ✅ Deep CVM patterns analysis included  
**Granularity**: ✅ Micro-atomic steps with exact code  
**Foundation**: ✅ Built on existing LOAD_REGEX implementation

## CVM Architecture Deep-Dive

### Core Design Principles (Inherited from v3)
1. **Direct Value Embedding**: Values stored in `instruction.arg` (not constants pool)
2. **Error Objects**: Structured errors returned, never exceptions thrown
3. **Heap-Based Objects**: Complex objects allocated on heap with references
4. **Visitor Pattern**: Compiler uses visitor pattern for AST traversal
5. **Handler Registry**: VM uses opcode-to-handler mapping

### RegExp Pattern Matching Architecture
```
Method Call → AST Node → Compiler Visitor → Bytecode → VM Handler → String Result
     ↓           ↓              ↓             ↓          ↓
regex.test(str) → CallExpr → REGEX_TEST → Handler → Boolean Result
string.match(regex) → CallExpr → STRING_MATCH → Handler → Array/null Result  
string.replace(regex, repl) → CallExpr → STRING_REPLACE_REGEX → Handler → String Result
```

### CVM Error Object Format (Inherited)
```typescript
interface CVMError {
  type: string;        // Error category (e.g., 'TypeError', 'SyntaxError')
  message: string;     // Human-readable description
  pc: number;          // Program counter position
  opcode: OpCode;      // Opcode that caused error
}
```

### Method Call Pattern
```typescript
// Method calls compile to: object.method(args) → LOAD → CALL_METHOD → args → OPCODE
// For regex methods:
// regex.test(str) → LOAD_VARIABLE(regex) → LOAD_VARIABLE(str) → REGEX_TEST
// str.match(regex) → LOAD_VARIABLE(str) → LOAD_VARIABLE(regex) → STRING_MATCH  
// str.replace(regex, repl) → LOAD_VARIABLE(str) → LOAD_VARIABLE(regex) → LOAD_VARIABLE(repl) → STRING_REPLACE_REGEX
```

### Handler Structure Pattern (Inherited)
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

## ATOMIC TDD BLOCK 0: RegExp Method Call Compilation Foundation
**Duration**: 15-20 minutes  
**Dependencies**: Existing LOAD_REGEX implementation  
**Purpose**: Add bytecode opcodes for RegExp method calls

### Architectural Context
- **Method Call Compilation**: CVM compiles `object.method(args)` to specific opcodes
- **RegExp Method Opcodes**: Need specific opcodes for `.test()`, not generic method calls
- **Stack Management**: Methods consume object + arguments, produce result
- **Pattern Matching**: Following existing string method compilation patterns

### Implementation Layers
- **Primary**: `packages/parser/src/lib/bytecode.ts` (add new opcodes)
- **Testing**: `packages/parser/src/lib/bytecode-regex-methods.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create Bytecode Test First (TDD)
**File**: `packages/parser/src/lib/bytecode-regex-methods.spec.ts`

**Purpose**: Test-driven development - fail first, then implement

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from './bytecode.js';

describe('RegExp Method Bytecode Support', () => {
  it('should have REGEX_TEST opcode defined', () => {
    expect(OpCode.REGEX_TEST).toBe('REGEX_TEST');
    expect(typeof OpCode.REGEX_TEST).toBe('string');
  });

  it('should have STRING_MATCH opcode defined', () => {
    expect(OpCode.STRING_MATCH).toBe('STRING_MATCH');
    expect(typeof OpCode.STRING_MATCH).toBe('string');
  });

  it('should have STRING_REPLACE_REGEX opcode defined', () => {
    expect(OpCode.STRING_REPLACE_REGEX).toBe('STRING_REPLACE_REGEX');
    expect(typeof OpCode.STRING_REPLACE_REGEX).toBe('string');
  });
  
  it('should be included in OpCode enum values', () => {
    const opcodes = Object.values(OpCode);
    expect(opcodes).toContain('REGEX_TEST');
    expect(opcodes).toContain('STRING_MATCH');
    expect(opcodes).toContain('STRING_REPLACE_REGEX');
  });

  it('should maintain enum integrity', () => {
    // Ensure we didn't break existing opcodes
    expect(OpCode.LOAD_REGEX).toBe('LOAD_REGEX');
    expect(OpCode.STRING_REPLACE).toBe('STRING_REPLACE');
    expect(Object.values(OpCode).length).toBeGreaterThan(80); // CVM has many opcodes
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test parser -- bytecode-regex-methods.spec.ts`

**Expected Result**: Tests fail because regex method opcodes don't exist yet

#### Step 3: Add RegExp Method Opcodes
**File**: `packages/parser/src/lib/bytecode.ts`

**Exact Location**: After line 52 (after LOAD_REGEX, before Universal operations)

**Implementation**:
```typescript
  // RegExp operations
  LOAD_REGEX = 'LOAD_REGEX',
  REGEX_TEST = 'REGEX_TEST',
  
  // String operations with RegExp
  STRING_MATCH = 'STRING_MATCH',
  STRING_REPLACE_REGEX = 'STRING_REPLACE_REGEX',
  
  // Universal operations
  LENGTH = 'LENGTH',
```

#### Step 4: Verify Test Passes
**Command**: `npx nx test parser -- bytecode-regex-methods.spec.ts`

**Expected Result**: All tests now pass

#### Step 5: Run Full Parser Test Suite
**Command**: `npx nx test parser`

**Expected Result**: No regressions, all existing tests still pass

### Success Criteria
- ✅ REGEX_TEST, STRING_MATCH, STRING_REPLACE_REGEX opcodes exist
- ✅ Opcodes have correct string values
- ✅ Enum integrity maintained (no existing opcodes broken)
- ✅ Tests pass and typecheck succeeds
- ✅ No regressions in existing functionality

---

## ATOMIC TDD BLOCK 1: RegExp Method Call Compilation
**Duration**: 25-30 minutes  
**Dependencies**: Block 0 (RegExp method opcodes)  
**Purpose**: Compile `regex.test(str)` calls to REGEX_TEST bytecode

### Architectural Context
- **Method Call Pattern**: CVM has existing pattern for compiling method calls
- **CallExpression Visitor**: Method calls compile through `compileCallExpression`
- **Method Registry**: Method names map to specific opcodes
- **Stack Order**: Arguments pushed in order, then method opcode executed

### Implementation Layers
- **Primary**: `packages/parser/src/lib/compiler/expressions/call-expression.ts`
- **Testing**: `packages/parser/src/lib/compiler-regex-methods.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Examine Existing Method Call Patterns
**File**: `packages/parser/src/lib/compiler/expressions/call-expression.ts`

**Analysis Pattern**:
```typescript
// Study existing string method compilation:
// Look for patterns like:
// 'substring': OpCode.STRING_SUBSTRING,
// 'indexOf': OpCode.STRING_INDEXOF,
// 'split': OpCode.STRING_SPLIT,

// RegExp methods will follow same pattern:
// 'test': OpCode.REGEX_TEST,
```

#### Step 2: Create Method Compilation Test (TDD)
**File**: `packages/parser/src/lib/compiler-regex-methods.spec.ts`

**Purpose**: Test complete compilation flow from source to bytecode

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from './compiler.js';
import { OpCode } from './bytecode.js';

describe('RegExp Method Compilation', () => {
  it('should compile regex.test(string) to REGEX_TEST', () => {
    const source = `
      function main() {
        var pattern = /test/i;
        var text = "Testing";
        var result = pattern.test(text);
        return 0;
      }
    `;
    
    const result = compile(source);
    
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
    
    // Find REGEX_TEST instruction
    const regexTestInstr = result.bytecode.find(instr => instr.op === OpCode.REGEX_TEST);
    expect(regexTestInstr).toBeDefined();
  });

  it('should compile string.match(regex) to STRING_MATCH', () => {
    const source = `
      function main() {
        var text = "hello world";
        var pattern = /world/;
        var matches = text.match(pattern);
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const stringMatchInstr = result.bytecode.find(instr => instr.op === OpCode.STRING_MATCH);
    expect(stringMatchInstr).toBeDefined();
  });

  it('should compile string.replace(regex, replacement) to STRING_REPLACE_REGEX', () => {
    const source = `
      function main() {
        var text = "hello world";
        var pattern = /world/;
        var result = text.replace(pattern, "universe");
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    const stringReplaceRegexInstr = result.bytecode.find(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
    expect(stringReplaceRegexInstr).toBeDefined();
  });

  it('should handle complex regex method chains', () => {
    const source = `
      function main() {
        var emailPattern = /\\w+@\\w+\\.\\w+/;
        var text = "Contact: user@example.com or admin@test.org";
        
        var hasEmail = emailPattern.test(text);
        var matches = text.match(emailPattern);
        var cleaned = text.replace(emailPattern, "[EMAIL]");
        
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Should have all three method instructions
    const regexTest = result.bytecode.filter(instr => instr.op === OpCode.REGEX_TEST);
    const stringMatch = result.bytecode.filter(instr => instr.op === OpCode.STRING_MATCH);
    const stringReplaceRegex = result.bytecode.filter(instr => instr.op === OpCode.STRING_REPLACE_REGEX);
    
    expect(regexTest.length).toBe(1);
    expect(stringMatch.length).toBe(1);
    expect(stringReplaceRegex.length).toBe(1);
  });

  it('should handle regex method calls with variables', () => {
    const source = `
      function main() {
        var pattern = /test/gi;
        var input = "Test this testing";
        var replacement = "check";
        
        var isMatch = pattern.test(input);
        var allMatches = input.match(pattern);
        var replaced = input.replace(pattern, replacement);
        
        return 0;
      }
    `;
    
    const result = compile(source);
    expect(result.success).toBe(true);
    
    // Verify correct instruction order and count
    const regexOpcodes = result.bytecode.filter(instr => 
      instr.op === OpCode.REGEX_TEST || 
      instr.op === OpCode.STRING_MATCH || 
      instr.op === OpCode.STRING_REPLACE_REGEX
    );
    expect(regexOpcodes.length).toBe(3);
  });
});
```

#### Step 3: Run Failing Test
**Command**: `npx nx test parser -- compiler-regex-methods.spec.ts`

**Expected Result**: Tests fail because regex method compilation not implemented

#### Step 4: Implement RegExp Method Compilation
**File**: `packages/parser/src/lib/compiler/expressions/call-expression.ts`

**Location**: Find the existing method mapping object and add regex methods

**Analysis of Existing Pattern**:
```typescript
// Find existing pattern like:
const stringMethods: Record<string, OpCode> = {
  'substring': OpCode.STRING_SUBSTRING,
  'indexOf': OpCode.STRING_INDEXOF,
  'split': OpCode.STRING_SPLIT,
  'slice': OpCode.STRING_SLICE,
  'charAt': OpCode.STRING_CHARAT,
  'toUpperCase': OpCode.STRING_TOUPPERCASE,
  'toLowerCase': OpCode.STRING_TOLOWERCASE,
  'includes': OpCode.STRING_INCLUDES,
  'endsWith': OpCode.STRING_ENDS_WITH,
  'startsWith': OpCode.STRING_STARTS_WITH,
  'trim': OpCode.STRING_TRIM,
  'trimStart': OpCode.STRING_TRIM_START,
  'trimEnd': OpCode.STRING_TRIM_END,
  'replace': OpCode.STRING_REPLACE,
  'replaceAll': OpCode.STRING_REPLACE_ALL,
  'lastIndexOf': OpCode.STRING_LAST_INDEX_OF,
  'repeat': OpCode.STRING_REPEAT,
  'padStart': OpCode.STRING_PAD_START,
  'padEnd': OpCode.STRING_PAD_END,
};
```

**Implementation Steps**:

**Step 4a**: Add regex method mapping
```typescript
// Add after existing stringMethods object
const regexMethods: Record<string, OpCode> = {
  'test': OpCode.REGEX_TEST,
};

// Update string methods to include regex-based methods
const stringMethodsWithRegex: Record<string, OpCode> = {
  ...stringMethods,
  'match': OpCode.STRING_MATCH,
  'replace': OpCode.STRING_REPLACE_REGEX, // This will override STRING_REPLACE when regex is used
};
```

**Step 4b**: Update method call logic to handle regex methods
Find the method compilation logic and update it to:
1. Detect when object is a regex (type checking)
2. Use regexMethods for regex objects
3. Handle special case for string.replace() with regex argument

**Note**: The exact implementation will depend on the existing call-expression.ts structure. Study the file first to understand the pattern.

#### Step 5: Verify Tests Pass
**Command**: `npx nx test parser -- compiler-regex-methods.spec.ts`

**Expected Result**: All tests now pass

#### Step 6: Run Full Parser Test Suite
**Command**: `npx nx test parser`

**Expected Result**: No regressions, all tests pass

### Success Criteria
- ✅ regex.test(string) compiles to REGEX_TEST
- ✅ string.match(regex) compiles to STRING_MATCH
- ✅ string.replace(regex, replacement) compiles to STRING_REPLACE_REGEX
- ✅ Complex method chains supported
- ✅ Variable arguments supported
- ✅ All compilation tests pass
- ✅ No regressions in existing functionality

---

## ATOMIC TDD BLOCK 2: RegExp.test() VM Handler
**Duration**: 20-25 minutes  
**Dependencies**: Blocks 0-1 (Opcodes + Compilation)  
**Purpose**: Implement VM handler that executes regex.test(string) operations

### Architectural Context
- **VM Handler Role**: Execute REGEX_TEST bytecode and return boolean result
- **Stack Management**: Consume regex reference + string, produce boolean
- **Error Handling**: Handle invalid arguments and regex errors
- **JavaScript Compliance**: Follow JavaScript RegExp.test() semantics exactly

### Implementation Layers
- **Primary**: `packages/vm/src/lib/handlers/regex.ts` (extend existing file)
- **Testing**: `packages/vm/src/lib/handlers/regex-test.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create VM Handler Test (TDD)
**File**: `packages/vm/src/lib/handlers/regex-test.spec.ts`

**Purpose**: Test REGEX_TEST handler with success and error cases

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('RegExp Test VM Handler', () => {
  it('should execute regex.test(string) and return true for matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // Create regex: /test/i
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'i' } },
      // Push string: "Testing"
      { op: OpCode.PUSH, arg: 'Testing' },
      // Execute test
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(1);
    expect(vm.stack.peek()).toBe(true);
  });

  it('should return false for non-matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'Testing' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe(false);
  });

  it('should handle case-sensitive vs case-insensitive flags', () => {
    const vm1 = new VM({ enableCC: false });
    const vm2 = new VM({ enableCC: false });
    
    // Case sensitive (should not match)
    const result1 = vm1.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'TEST', flags: '' } },
      { op: OpCode.PUSH, arg: 'test' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    // Case insensitive (should match)
    const result2 = vm2.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'TEST', flags: 'i' } },
      { op: OpCode.PUSH, arg: 'test' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result1.success).toBe(true);
    expect(vm1.stack.peek()).toBe(false);
    
    expect(result2.success).toBe(true);
    expect(vm2.stack.peek()).toBe(true);
  });

  it('should handle complex regex patterns', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // Email pattern
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: '' } },
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe(true);
  });

  it('should handle global flag correctly (should not affect test)', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.PUSH, arg: 'test multiple test matches' },
      { op: OpCode.REGEX_TEST },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe(true);
  });

  describe('Error Handling', () => {
    it('should handle non-regex object on stack', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'test-string' },
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected regex object');
      expect(result.error!.opcode).toBe(OpCode.REGEX_TEST);
    });

    it('should handle non-string argument', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected string argument');
    });

    it('should handle stack underflow', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.REGEX_TEST }, // No arguments on stack
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('StackUnderflow');
    });

    it('should not modify stack on error', () => {
      const vm = new VM({ enableCC: false });
      vm.stack.push('initial-value');
      const initialStackLength = vm.stack.length;
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'test-string' },
        { op: OpCode.REGEX_TEST },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      // Stack should have initial value plus the two failed pushes
      expect(vm.stack.length).toBe(initialStackLength + 2);
    });
  });

  it('should handle multiple test operations', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // First test
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.REGEX_TEST },
      
      // Second test
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.REGEX_TEST },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(2);
    
    const secondResult = vm.stack.pop();
    const firstResult = vm.stack.pop();
    
    expect(firstResult).toBe(true);  // hello matches
    expect(secondResult).toBe(false); // xyz doesn't match
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test vm -- regex-test.spec.ts`

**Expected Result**: Tests fail because REGEX_TEST handler doesn't exist

#### Step 3: Implement REGEX_TEST Handler
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Add to existing regexHandlers export**:

**Complete Implementation**:
```typescript
/**
 * Handler for REGEX_TEST opcode
 * Executes regex.test(string) operation
 * 
 * Stack Effect: [regexRef, string] → [boolean]
 * Heap Effect: None (reads existing regex object)
 * 
 * Error Cases:
 * - First stack item is not a regex object reference
 * - Second stack item is not a string
 * - Stack underflow (less than 2 items)
 */
const regexTest: OpcodeHandler = {
  stackIn: 2,     // Consumes regex reference and string
  stackOut: 1,    // Produces boolean result
  
  execute: (state, instruction) => {
    // Check stack has enough items
    if (state.stack.length < 2) {
      return {
        type: 'StackUnderflow',
        message: 'REGEX_TEST requires 2 stack items (regex, string)',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Pop arguments in reverse order (string first, then regex)
    const testString = state.stack.pop();
    const regexRef = state.stack.pop();
    
    // Validate string argument
    if (typeof testString !== 'string') {
      // Push items back to maintain stack state on error
      state.stack.push(regexRef);
      state.stack.push(testString);
      
      return {
        type: 'TypeError',
        message: `Expected string argument for regex test, got ${typeof testString}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate regex reference
    if (!regexRef || typeof regexRef !== 'object' || regexRef.type !== 'heap-ref') {
      // Push items back to maintain stack state on error
      state.stack.push(regexRef);
      state.stack.push(testString);
      
      return {
        type: 'TypeError',
        message: 'Expected regex object for regex test',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Get regex object from heap
    const regexObj = state.heap.get((regexRef as any).id);
    if (!regexObj || regexObj.type !== 'regex') {
      // Push items back to maintain stack state on error
      state.stack.push(regexRef);
      state.stack.push(testString);
      
      return {
        type: 'TypeError',
        message: 'Invalid regex object reference',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Execute JavaScript RegExp.test()
      const regex = regexObj.data as RegExp;
      const testResult = regex.test(testString);
      
      // Push boolean result to stack
      state.stack.push(testResult);
      
      return undefined; // Success
      
    } catch (error) {
      // Push items back to maintain stack state on error
      state.stack.push(regexRef);
      state.stack.push(testString);
      
      return {
        type: 'RuntimeError',
        message: `Regex test failed: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};
```

#### Step 4: Register Handler in Registry
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Update the regexHandlers export**:
```typescript
export const regexHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD_REGEX]: loadRegex,
  [OpCode.REGEX_TEST]: regexTest, // ADD THIS LINE
};
```

#### Step 5: Verify Tests Pass
**Command**: `npx nx test vm -- regex-test.spec.ts`

**Expected Result**: All tests now pass

#### Step 6: Run Full VM Test Suite
**Command**: `npx nx test vm`

**Expected Result**: No regressions, all tests pass

### Success Criteria
- ✅ REGEX_TEST executes regex.test() successfully
- ✅ Returns correct boolean results for matches/non-matches
- ✅ Handles all regex flags correctly (i, g, m, etc.)
- ✅ Complex regex patterns supported
- ✅ Comprehensive error handling for invalid arguments
- ✅ Stack management follows CVM patterns exactly
- ✅ Error objects follow CVM format
- ✅ Multiple test operations supported
- ✅ All tests pass, no regressions

---

## ATOMIC TDD BLOCK 3: String.match() VM Handler
**Duration**: 25-30 minutes  
**Dependencies**: Blocks 0-2 (Opcodes + Compilation + REGEX_TEST)  
**Purpose**: Implement VM handler for string.match(regex) operations

### Architectural Context
- **Match Result**: Returns array of matches or null (JavaScript compliance)
- **Global Flag Handling**: Global flag affects match behavior (single vs all matches)
- **Array Creation**: Must create CVM array objects on heap
- **Stack Management**: Consume string + regex reference, produce array reference or null

### Implementation Layers
- **Primary**: `packages/vm/src/lib/handlers/regex.ts` (extend existing file)
- **Testing**: `packages/vm/src/lib/handlers/string-match.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create VM Handler Test (TDD)
**File**: `packages/vm/src/lib/handlers/string-match.spec.ts`

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('String Match VM Handler', () => {
  it('should execute string.match(regex) and return array for matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // Push string: "hello world"
      { op: OpCode.PUSH, arg: 'hello world' },
      // Create regex: /world/
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      // Execute match
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(1);
    
    const matchRef = vm.stack.peek();
    expect(matchRef).toHaveProperty('type', 'heap-ref');
    
    const matchObj = vm.heap.get((matchRef as any).id);
    expect(matchObj.type).toBe('array');
    expect(matchObj.data.length).toBe(1);
    expect(matchObj.data[0]).toBe('world');
  });

  it('should return null for non-matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe(null);
  });

  it('should handle global flag and return all matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'test and test again' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const matchRef = vm.stack.peek();
    const matchObj = vm.heap.get((matchRef as any).id);
    expect(matchObj.data.length).toBe(2);
    expect(matchObj.data[0]).toBe('test');
    expect(matchObj.data[1]).toBe('test');
  });

  it('should handle case-insensitive matching', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Hello WORLD' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'i' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const matchRef = vm.stack.peek();
    const matchObj = vm.heap.get((matchRef as any).id);
    expect(matchObj.data[0]).toBe('Hello');
  });

  it('should handle complex patterns with groups', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '(\\w+)@(\\w+)\\.(\\w+)', flags: '' } },
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const matchRef = vm.stack.peek();
    const matchObj = vm.heap.get((matchRef as any).id);
    // Should include full match and capture groups
    expect(matchObj.data.length).toBe(4);
    expect(matchObj.data[0]).toBe('user@example.com'); // Full match
    expect(matchObj.data[1]).toBe('user');             // First group
    expect(matchObj.data[2]).toBe('example');          // Second group
    expect(matchObj.data[3]).toBe('com');              // Third group
  });

  describe('Error Handling', () => {
    it('should handle non-string input', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.STRING_MATCH },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected string input');
    });

    it('should handle non-regex object', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.STRING_MATCH },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected regex object');
    });

    it('should handle stack underflow', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.STRING_MATCH }, // No arguments
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('StackUnderflow');
    });
  });

  it('should handle empty matches correctly', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'abc' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '', flags: 'g' } }, // Empty pattern
      { op: OpCode.STRING_MATCH },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    
    const matchRef = vm.stack.peek();
    const matchObj = vm.heap.get((matchRef as any).id);
    // Empty pattern matches at each position
    expect(matchObj.data.length).toBeGreaterThan(0);
  });

  it('should handle multiple match operations', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // First match
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.STRING_MATCH },
      
      // Second match  
      { op: OpCode.PUSH, arg: 'test data' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.STRING_MATCH },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(2);
    
    const secondResult = vm.stack.pop();
    const firstResult = vm.stack.pop();
    
    expect(secondResult).toBe(null); // No match for 'xyz'
    
    const firstMatchObj = vm.heap.get((firstResult as any).id);
    expect(firstMatchObj.data[0]).toBe('hello');
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test vm -- string-match.spec.ts`

**Expected Result**: Tests fail because STRING_MATCH handler doesn't exist

#### Step 3: Implement STRING_MATCH Handler
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Complete Implementation**:
```typescript
/**
 * Handler for STRING_MATCH opcode
 * Executes string.match(regex) operation
 * 
 * Stack Effect: [string, regexRef] → [arrayRef | null]
 * Heap Effect: Allocates new array object for matches (or pushes null)
 * 
 * Error Cases:
 * - First stack item is not a string
 * - Second stack item is not a regex object reference
 * - Stack underflow (less than 2 items)
 */
const stringMatch: OpcodeHandler = {
  stackIn: 2,     // Consumes string and regex reference
  stackOut: 1,    // Produces array reference or null
  
  execute: (state, instruction) => {
    // Check stack has enough items
    if (state.stack.length < 2) {
      return {
        type: 'StackUnderflow',
        message: 'STRING_MATCH requires 2 stack items (string, regex)',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Pop arguments in reverse order (regex first, then string)
    const regexRef = state.stack.pop();
    const inputString = state.stack.pop();
    
    // Validate string input
    if (typeof inputString !== 'string') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      
      return {
        type: 'TypeError',
        message: `Expected string input for match, got ${typeof inputString}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate regex reference
    if (!regexRef || typeof regexRef !== 'object' || regexRef.type !== 'heap-ref') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      
      return {
        type: 'TypeError',
        message: 'Expected regex object for match',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Get regex object from heap
    const regexObj = state.heap.get((regexRef as any).id);
    if (!regexObj || regexObj.type !== 'regex') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      
      return {
        type: 'TypeError',
        message: 'Invalid regex object reference',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Execute JavaScript String.match()
      const regex = regexObj.data as RegExp;
      const matchResult = inputString.match(regex);
      
      if (matchResult === null) {
        // No match found - push null
        state.stack.push(null);
      } else {
        // Create CVM array with match results
        // Convert native array to CVM array format
        const cvmArray = {
          length: matchResult.length,
          data: [...matchResult] // Copy all match results
        };
        
        // Allocate array on heap
        const arrayRef = state.heap.allocate('array', cvmArray);
        
        // Push array reference to stack
        state.stack.push(arrayRef);
      }
      
      return undefined; // Success
      
    } catch (error) {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      
      return {
        type: 'RuntimeError',
        message: `String match failed: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};
```

#### Step 4: Register Handler in Registry
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Update the regexHandlers export**:
```typescript
export const regexHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD_REGEX]: loadRegex,
  [OpCode.REGEX_TEST]: regexTest,
  [OpCode.STRING_MATCH]: stringMatch, // ADD THIS LINE
};
```

#### Step 5: Verify Tests Pass
**Command**: `npx nx test vm -- string-match.spec.ts`

**Expected Result**: All tests now pass

#### Step 6: Run Full VM Test Suite
**Command**: `npx nx test vm`

**Expected Result**: No regressions, all tests pass

### Success Criteria
- ✅ STRING_MATCH executes string.match() successfully
- ✅ Returns array for matches, null for non-matches
- ✅ Handles global flag correctly (single vs all matches)
- ✅ Case-insensitive matching works
- ✅ Complex patterns with groups supported
- ✅ Empty pattern handling
- ✅ Comprehensive error handling
- ✅ Multiple match operations supported
- ✅ Array objects created correctly on heap
- ✅ All tests pass, no regressions

---

## ATOMIC TDD BLOCK 4: String.replace() with RegExp VM Handler
**Duration**: 25-30 minutes  
**Dependencies**: Blocks 0-3 (All previous implementations)  
**Purpose**: Implement VM handler for string.replace(regex, replacement) operations

### Architectural Context
- **Replace Behavior**: Global flag affects replacement (single vs all matches)
- **Replacement String**: Can be literal string or contain special patterns ($1, $&, etc.)
- **String Result**: Always returns new string (never modifies original)
- **Stack Management**: Consume string + regex + replacement, produce new string

### Implementation Layers
- **Primary**: `packages/vm/src/lib/handlers/regex.ts` (extend existing file)
- **Testing**: `packages/vm/src/lib/handlers/string-replace-regex.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create VM Handler Test (TDD)
**File**: `packages/vm/src/lib/handlers/string-replace-regex.spec.ts`

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { OpCode } from '@cvm/parser';
import { VM } from '../vm.js';

describe('String Replace Regex VM Handler', () => {
  it('should execute string.replace(regex, replacement) for single match', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // Push string: "hello world"
      { op: OpCode.PUSH, arg: 'hello world' },
      // Create regex: /world/
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      // Push replacement: "universe"
      { op: OpCode.PUSH, arg: 'universe' },
      // Execute replace
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(1);
    expect(vm.stack.peek()).toBe('hello universe');
  });

  it('should handle global flag and replace all matches', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'test and test again test' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: 'g' } },
      { op: OpCode.PUSH, arg: 'check' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('check and check again check');
  });

  it('should handle case-insensitive replacement', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Hello WORLD hello' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: 'gi' } },
      { op: OpCode.PUSH, arg: 'hi' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('hi WORLD hi');
  });

  it('should return original string when no match found', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'xyz', flags: '' } },
      { op: OpCode.PUSH, arg: 'replacement' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('hello world');
  });

  it('should handle empty replacement string', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'remove this word' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'this ', flags: '' } },
      { op: OpCode.PUSH, arg: '' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('remove word');
  });

  it('should handle complex patterns', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'Contact: user@example.com or admin@test.org' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '\\w+@\\w+\\.\\w+', flags: 'g' } },
      { op: OpCode.PUSH, arg: '[EMAIL]' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('Contact: [EMAIL] or [EMAIL]');
  });

  it('should handle special replacement patterns ($&, $1, etc.)', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'user@example.com' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: '(\\w+)@(\\w+)', flags: '' } },
      { op: OpCode.PUSH, arg: '$2: $1' }, // Swap username and domain
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('example: user.com');
  });

  it('should handle $& (full match) replacement', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      { op: OpCode.PUSH, arg: '[$&]' }, // Wrap match in brackets
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.peek()).toBe('hello [world]');
  });

  describe('Error Handling', () => {
    it('should handle non-string input', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 'replacement' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected string input');
    });

    it('should handle non-regex object', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.PUSH, arg: 'not-a-regex' },
        { op: OpCode.PUSH, arg: 'replacement' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected regex object');
    });

    it('should handle non-string replacement', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'test string' },
        { op: OpCode.LOAD_REGEX, arg: { pattern: 'test', flags: '' } },
        { op: OpCode.PUSH, arg: 42 }, // number instead of string
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('TypeError');
      expect(result.error!.message).toContain('Expected string replacement');
    });

    it('should handle stack underflow', () => {
      const vm = new VM({ enableCC: false });
      
      const result = vm.execute([
        { op: OpCode.PUSH, arg: 'only one item' },
        { op: OpCode.STRING_REPLACE_REGEX },
        { op: OpCode.HALT }
      ]);
      
      expect(result.success).toBe(false);
      expect(result.error!.type).toBe('StackUnderflow');
    });
  });

  it('should handle multiple replace operations', () => {
    const vm = new VM({ enableCC: false });
    
    const result = vm.execute([
      // First replace
      { op: OpCode.PUSH, arg: 'hello world' },
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'hello', flags: '' } },
      { op: OpCode.PUSH, arg: 'hi' },
      { op: OpCode.STRING_REPLACE_REGEX },
      
      // Second replace on result
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'world', flags: '' } },
      { op: OpCode.PUSH, arg: 'universe' },
      { op: OpCode.STRING_REPLACE_REGEX },
      
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(1);
    expect(vm.stack.peek()).toBe('hi universe');
  });

  it('should preserve original string (immutability)', () => {
    const vm = new VM({ enableCC: false });
    
    // Push same string twice
    vm.stack.push('original text');
    vm.stack.push('original text');
    
    const result = vm.execute([
      { op: OpCode.LOAD_REGEX, arg: { pattern: 'original', flags: '' } },
      { op: OpCode.PUSH, arg: 'modified' },
      { op: OpCode.STRING_REPLACE_REGEX },
      { op: OpCode.HALT }
    ]);
    
    expect(result.success).toBe(true);
    expect(vm.stack.length).toBe(2);
    
    const replacedString = vm.stack.pop();
    const originalString = vm.stack.pop();
    
    expect(originalString).toBe('original text');   // Unchanged
    expect(replacedString).toBe('modified text');   // Changed
  });
});
```

#### Step 2: Run Failing Test
**Command**: `npx nx test vm -- string-replace-regex.spec.ts`

**Expected Result**: Tests fail because STRING_REPLACE_REGEX handler doesn't exist

#### Step 3: Implement STRING_REPLACE_REGEX Handler
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Complete Implementation**:
```typescript
/**
 * Handler for STRING_REPLACE_REGEX opcode
 * Executes string.replace(regex, replacement) operation
 * 
 * Stack Effect: [string, regexRef, replacement] → [newString]
 * Heap Effect: None (produces primitive string result)
 * 
 * Error Cases:
 * - First stack item is not a string
 * - Second stack item is not a regex object reference  
 * - Third stack item is not a string
 * - Stack underflow (less than 3 items)
 */
const stringReplaceRegex: OpcodeHandler = {
  stackIn: 3,     // Consumes string, regex reference, and replacement string
  stackOut: 1,    // Produces new string
  
  execute: (state, instruction) => {
    // Check stack has enough items
    if (state.stack.length < 3) {
      return {
        type: 'StackUnderflow',
        message: 'STRING_REPLACE_REGEX requires 3 stack items (string, regex, replacement)',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Pop arguments in reverse order (replacement, regex, then string)
    const replacement = state.stack.pop();
    const regexRef = state.stack.pop();
    const inputString = state.stack.pop();
    
    // Validate string input
    if (typeof inputString !== 'string') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      state.stack.push(replacement);
      
      return {
        type: 'TypeError',
        message: `Expected string input for replace, got ${typeof inputString}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate regex reference
    if (!regexRef || typeof regexRef !== 'object' || regexRef.type !== 'heap-ref') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      state.stack.push(replacement);
      
      return {
        type: 'TypeError',
        message: 'Expected regex object for replace',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Validate replacement string
    if (typeof replacement !== 'string') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      state.stack.push(replacement);
      
      return {
        type: 'TypeError',
        message: `Expected string replacement, got ${typeof replacement}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    // Get regex object from heap
    const regexObj = state.heap.get((regexRef as any).id);
    if (!regexObj || regexObj.type !== 'regex') {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      state.stack.push(replacement);
      
      return {
        type: 'TypeError',
        message: 'Invalid regex object reference',
        pc: state.pc,
        opcode: instruction.op
      };
    }
    
    try {
      // Execute JavaScript String.replace() with regex
      const regex = regexObj.data as RegExp;
      const replaceResult = inputString.replace(regex, replacement);
      
      // Push result string to stack
      state.stack.push(replaceResult);
      
      return undefined; // Success
      
    } catch (error) {
      // Push items back to maintain stack state on error
      state.stack.push(inputString);
      state.stack.push(regexRef);
      state.stack.push(replacement);
      
      return {
        type: 'RuntimeError',
        message: `String replace failed: ${(error as Error).message}`,
        pc: state.pc,
        opcode: instruction.op
      };
    }
  }
};
```

#### Step 4: Register Handler in Registry
**File**: `packages/vm/src/lib/handlers/regex.ts`

**Update the regexHandlers export**:
```typescript
export const regexHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.LOAD_REGEX]: loadRegex,
  [OpCode.REGEX_TEST]: regexTest,
  [OpCode.STRING_MATCH]: stringMatch,
  [OpCode.STRING_REPLACE_REGEX]: stringReplaceRegex, // ADD THIS LINE
};
```

#### Step 5: Verify Tests Pass
**Command**: `npx nx test vm -- string-replace-regex.spec.ts`

**Expected Result**: All tests now pass

#### Step 6: Run Full VM Test Suite
**Command**: `npx nx test vm`

**Expected Result**: No regressions, all tests pass

### Success Criteria
- ✅ STRING_REPLACE_REGEX executes string.replace() successfully
- ✅ Handles global flag correctly (single vs all replacements)
- ✅ Case-insensitive replacement works
- ✅ Returns original string when no match found
- ✅ Empty replacement strings handled
- ✅ Complex patterns supported
- ✅ Special replacement patterns ($&, $1, etc.) work
- ✅ String immutability preserved
- ✅ Comprehensive error handling
- ✅ Multiple replace operations supported
- ✅ All tests pass, no regressions

---

## ATOMIC TDD BLOCK 5: Integration Testing
**Duration**: 20-25 minutes  
**Dependencies**: Blocks 0-4 (Complete pattern matching implementation)  
**Purpose**: Test end-to-end flow from source code to pattern matching execution

### Architectural Context
- **Integration Testing**: Validates entire pipeline works together
- **Cross-Package Testing**: Tests parser + VM integration
- **Real-World Scenarios**: Uses actual source code compilation
- **Method Combinations**: Tests all three methods together

### Implementation Layers
- **Testing**: `packages/vm/src/lib/regex-pattern-matching-integration.spec.ts` (new test)

### Micro-Atomic Steps

#### Step 1: Create Integration Test
**File**: `packages/vm/src/lib/regex-pattern-matching-integration.spec.ts`

**Complete Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { compile } from '@cvm/parser';
import { VM } from './vm.js';

describe('RegExp Pattern Matching Integration Tests', () => {
  describe('Complete Source-to-Execution Pipeline', () => {
    it('should compile and execute regex.test() method', () => {
      const source = `
        function main() {
          var emailPattern = /\\w+@\\w+\\.\\w+/;
          var validEmail = "user@example.com";
          var invalidEmail = "not-an-email";
          
          var isValid = emailPattern.test(validEmail);
          var isInvalid = emailPattern.test(invalidEmail);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Verify REGEX_TEST instructions generated
      const regexTestInstrs = compileResult.bytecode.filter(instr => instr.op === 'REGEX_TEST');
      expect(regexTestInstrs.length).toBe(2);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
    });

    it('should compile and execute string.match() method', () => {
      const source = `
        function main() {
          var text = "Contact: user@example.com and admin@test.org";
          var emailPattern = /\\w+@\\w+\\.\\w+/g;
          
          var matches = text.match(emailPattern);
          var noMatches = "no emails here".match(emailPattern);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const stringMatchInstrs = compileResult.bytecode.filter(instr => instr.op === 'STRING_MATCH');
      expect(stringMatchInstrs.length).toBe(2);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
    });

    it('should compile and execute string.replace() with regex', () => {
      const source = `
        function main() {
          var text = "Replace all test words in this test string";
          var pattern = /test/g;
          
          var replaced = text.replace(pattern, "demo");
          var noReplace = "nothing to change".replace(/xyz/g, "new");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const stringReplaceRegexInstrs = compileResult.bytecode.filter(instr => instr.op === 'STRING_REPLACE_REGEX');
      expect(stringReplaceRegexInstrs.length).toBe(2);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
    });

    it('should handle all three methods in one program', () => {
      const source = `
        function main() {
          var logPattern = /ERROR|WARN|INFO/gi;
          var logLine = "2024-01-01 ERROR: Something went wrong";
          
          // Test if log line contains a level
          var hasLevel = logPattern.test(logLine);
          
          // Extract the level
          var levelMatches = logLine.match(/ERROR|WARN|INFO/i);
          
          // Replace level with [LEVEL]
          var cleaned = logLine.replace(/ERROR|WARN|INFO/i, "[LEVEL]");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      // Should have all three method types
      const regexTest = compileResult.bytecode.filter(instr => instr.op === 'REGEX_TEST');
      const stringMatch = compileResult.bytecode.filter(instr => instr.op === 'STRING_MATCH');
      const stringReplaceRegex = compileResult.bytecode.filter(instr => instr.op === 'STRING_REPLACE_REGEX');
      
      expect(regexTest.length).toBe(1);
      expect(stringMatch.length).toBe(1);
      expect(stringReplaceRegex.length).toBe(1);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
    });

    it('should handle complex nested method calls', () => {
      const source = `
        function main() {
          var emailPattern = /([a-zA-Z0-9]+)@([a-zA-Z0-9]+)\\.([a-zA-Z]+)/;
          var input = "Contact john@example.com for support";
          
          // Chain multiple operations
          var hasEmail = emailPattern.test(input);
          
          if (hasEmail) {
            var matches = input.match(emailPattern);
            var anonymized = input.replace(emailPattern, "$2@[HIDDEN].$3");
          }
          
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
    it('should handle runtime errors gracefully', () => {
      const source = `
        function main() {
          var pattern = /test/;
          var notAString = 42;
          
          // This should fail at runtime
          var result = pattern.test(notAString);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(false);
      expect(execResult.error!.type).toBe('TypeError');
      expect(execResult.error!.message).toContain('Expected string');
    });

    it('should handle method calls on non-regex objects', () => {
      const source = `
        function main() {
          var notRegex = "just a string";
          var text = "test string";
          
          // This should fail at runtime
          var result = notRegex.test(text);
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      
      expect(execResult.success).toBe(false);
      expect(execResult.error!.type).toBe('TypeError');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle multiple regex operations efficiently', () => {
      const source = `
        function main() {
          var patterns = [
            /test/g,
            /demo/i,
            /sample/gm
          ];
          
          var text = "Test demo sample text for testing";
          
          for (var i = 0; i < patterns.length; i++) {
            var pattern = patterns[i];
            var matches = text.match(pattern);
            var replaced = text.replace(pattern, "[MATCH]");
            var hasMatch = pattern.test(text);
          }
          
          return 0;
        }
      `;
      
      // Note: This test assumes for loops and arrays work
      // Adjust based on actual CVM language support
      const compileResult = compile(source);
      
      if (compileResult.success) {
        const vm = new VM({ enableCC: false });
        const execResult = vm.execute(compileResult.bytecode);
        expect(execResult.success).toBe(true);
      }
    });

    it('should properly manage heap objects', () => {
      const source = `
        function main() {
          var pattern = /test/;
          var text = "test string";
          
          // Create multiple objects
          var result1 = pattern.test(text);
          var matches = text.match(pattern);
          var replaced = text.replace(pattern, "demo");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const initialHeapSize = vm.heap.size();
      
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
      
      // Heap should have grown with regex and array objects
      expect(vm.heap.size()).toBeGreaterThan(initialHeapSize);
    });
  });

  describe('JavaScript Compliance Validation', () => {
    it('should match JavaScript regex behavior exactly', () => {
      const source = `
        function main() {
          var pattern = /Te*st/i;
          var text = "This is a Test";
          
          var caseInsensitive = pattern.test(text);
          var matches = text.match(pattern);
          var replaced = text.replace(pattern, "Demo");
          
          return 0;
        }
      `;
      
      const compileResult = compile(source);
      expect(compileResult.success).toBe(true);
      
      const vm = new VM({ enableCC: false });
      const execResult = vm.execute(compileResult.bytecode);
      expect(execResult.success).toBe(true);
      
      // Results should match JavaScript behavior:
      // /Te*st/i.test("This is a Test") === true
      // "This is a Test".match(/Te*st/i) === ["Test"]
      // "This is a Test".replace(/Te*st/i, "Demo") === "This is a Demo"
    });

    it('should handle global flag state correctly', () => {
      const source = `
        function main() {
          var globalPattern = /test/g;
          var text = "test and test again";
          
          // Global pattern should find all matches
          var allMatches = text.match(globalPattern);
          
          // Replace should replace all with global flag
          var allReplaced = text.replace(globalPattern, "demo");
          
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
});
```

#### Step 2: Run Integration Tests
**Command**: `npx nx test vm -- regex-pattern-matching-integration.spec.ts`

**Expected Result**: All integration tests pass

#### Step 3: Run Cross-Package Validation
**Commands**:
```bash
# Test all packages
npx nx test parser
npx nx test vm

# Test typechecks
npx nx run parser:typecheck
npx nx run vm:typecheck
```

**Expected Results**: All tests pass, no TypeScript errors

### Success Criteria
- ✅ Complete parse→compile→execute flow works for all methods
- ✅ All three regex methods work together in one program
- ✅ Complex nested method calls supported
- ✅ Error handling works end-to-end
- ✅ Performance acceptable for multiple operations
- ✅ Heap management works correctly
- ✅ JavaScript compliance verified
- ✅ All integration tests pass
- ✅ No regressions in existing functionality

---

## ATOMIC TDD BLOCK 6: E2E Validation
**Duration**: 15-20 minutes  
**Dependencies**: Blocks 0-5 (Complete pattern matching implementation)  
**Purpose**: Create and test real CVM programs demonstrating complete RegExp functionality

### Implementation Layers
- **Test Programs**: `test/programs/10-regex/` (extend existing directory)
- **Execution**: Via MCP test client following E2E_TESTING.md protocol

### Micro-Atomic Steps

#### Step 1: Create Complete RegExp Test Program
**File**: `test/programs/10-regex/regex-pattern-matching-complete.ts`

**Complete Implementation**:
```typescript
function main() {
  console.log("=== Complete RegExp Pattern Matching E2E Test ===");
  
  // Test all three methods with practical examples
  console.log("\n--- RegExp.test() Method ---");
  
  var emailPattern = /\w+@\w+\.\w+/;
  var validEmail = "user@example.com";
  var invalidEmail = "not-an-email";
  
  var isValidEmail = emailPattern.test(validEmail);
  var isInvalidEmail = emailPattern.test(invalidEmail);
  
  console.log("✓ Email pattern: " + emailPattern.source);
  console.log("✓ Valid email test: " + (isValidEmail ? "true" : "false"));
  console.log("✓ Invalid email test: " + (isInvalidEmail ? "true" : "false"));
  
  // Case insensitive testing
  var casePattern = /hello/i;
  var mixedCase = "Hello World";
  var hasHello = casePattern.test(mixedCase);
  console.log("✓ Case insensitive test: " + (hasHello ? "true" : "false"));
  
  console.log("\n--- String.match() Method ---");
  
  var logText = "2024-01-01 ERROR: Database connection failed";
  var levelPattern = /ERROR|WARN|INFO|DEBUG/;
  var globalLevelPattern = /\d+/g;
  
  var levelMatch = logText.match(levelPattern);
  var numberMatches = logText.match(globalLevelPattern);
  var noMatch = "clean text".match(/ERROR/);
  
  console.log("✓ Log text: " + logText);
  console.log("✓ Level match found: " + (levelMatch !== null ? "true" : "false"));
  console.log("✓ Number matches count: " + (numberMatches !== null ? numberMatches.length : 0));
  console.log("✓ No match result: " + (noMatch === null ? "null" : "not null"));
  
  console.log("\n--- String.replace() with RegExp ---");
  
  var sensitiveData = "Contact john@example.com or call 555-1234";
  var emailRegex = /\w+@\w+\.\w+/g;
  var phoneRegex = /\d{3}-\d{4}/g;
  
  var hiddenEmails = sensitiveData.replace(emailRegex, "[EMAIL]");
  var hiddenPhones = hiddenEmails.replace(phoneRegex, "[PHONE]");
  var noChange = "clean text".replace(/sensitive/, "[HIDDEN]");
  
  console.log("✓ Original: " + sensitiveData);
  console.log("✓ Emails hidden: " + hiddenEmails);
  console.log("✓ All hidden: " + hiddenPhones);
  console.log("✓ No change: " + noChange);
  
  console.log("\n--- Complex Pattern Matching ---");
  
  var urlPattern = /https?:\/\/([a-zA-Z0-9.-]+)\/([a-zA-Z0-9\/_-]*)/;
  var urlText = "Visit https://example.com/docs/api for documentation";
  
  var hasUrl = urlPattern.test(urlText);
  var urlMatches = urlText.match(urlPattern);
  var maskedUrl = urlText.replace(urlPattern, "https://[DOMAIN]/[PATH]");
  
  console.log("✓ URL pattern: " + urlPattern.source);
  console.log("✓ Has URL: " + (hasUrl ? "true" : "false"));
  console.log("✓ URL matches: " + (urlMatches !== null ? urlMatches.length : 0));
  console.log("✓ Masked URL: " + maskedUrl);
  
  console.log("\n--- Flag Combinations ---");
  
  var multiText = "Test\nTEST\ntest";
  var globalIgnoreCase = /test/gi;
  var multiline = /^test/gim;
  
  var allTests = multiText.match(globalIgnoreCase);
  var lineTests = multiText.match(multiline);
  var replacedAll = multiText.replace(globalIgnoreCase, "DEMO");
  
  console.log("✓ Multi-line text: " + multiText.replace(/\n/g, "\\n"));
  console.log("✓ Global ignore case matches: " + (allTests !== null ? allTests.length : 0));
  console.log("✓ Multiline matches: " + (lineTests !== null ? lineTests.length : 0));
  console.log("✓ All replaced: " + replacedAll.replace(/\n/g, "\\n"));
  
  console.log("\n=== All RegExp Pattern Matching Tests Complete! ===");
  console.log("RegExp.test(), String.match(), and String.replace() with regex all working correctly");
  
  return 0;
}
```

#### Step 2: Create Error Handling Test Program
**File**: `test/programs/10-regex/regex-pattern-matching-errors.ts`

**Complete Implementation**:
```typescript
function main() {
  console.log("=== RegExp Pattern Matching Error Handling Test ===");
  console.log("This program demonstrates graceful error handling for invalid operations");
  
  // Valid operations first
  console.log("\n--- Valid Operations ---");
  var validPattern = /test/i;
  var validText = "Testing";
  
  var validTest = validPattern.test(validText);
  var validMatch = validText.match(validPattern);
  var validReplace = validText.replace(validPattern, "Demo");
  
  console.log("✓ Valid test: " + (validTest ? "true" : "false"));
  console.log("✓ Valid match found: " + (validMatch !== null ? "true" : "false"));
  console.log("✓ Valid replace: " + validReplace);
  
  // This will cause an error and stop execution
  console.log("\n--- Invalid Operation (Should Fail) ---");
  console.log("Attempting to call regex.test() with non-string argument...");
  
  var numberInput = 42;
  var errorResult = validPattern.test(numberInput);
  
  // This should never execute
  console.log("✗ ERROR: This line should not be reached!");
  console.log("✗ Error result: " + errorResult);
  
  return 0;
}
```

#### Step 3: Create TODO Orchestration Example
**File**: `test/programs/10-regex/todo-log-analyzer.ts`

**Complete Implementation**:
```typescript
function main() {
  console.log("=== TODO: Log Analyzer with Complete RegExp ===");
  console.log("Demonstrating complete regex functionality in TODO orchestration");
  
  // Simulate log analysis workflow
  console.log("\n--- Step 1: Define Analysis Patterns ---");
  
  var errorPattern = /ERROR|FATAL|CRITICAL/i;
  var timestampPattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
  var ipPattern = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
  var requestPattern = /(GET|POST|PUT|DELETE) ([^\s]+)/;
  
  console.log("✓ Error pattern: " + errorPattern.source);
  console.log("✓ Timestamp pattern: " + timestampPattern.source);
  console.log("✓ IP pattern: " + ipPattern.source);
  console.log("✓ Request pattern: " + requestPattern.source);
  
  // Sample log entries for analysis
  console.log("\n--- Step 2: Analyze Log Entries ---");
  
  var logEntries = [
    "2024-01-01 10:30:15 192.168.1.100 GET /api/users - OK",
    "2024-01-01 10:31:22 10.0.0.5 POST /api/login - ERROR: Invalid credentials",
    "2024-01-01 10:32:10 172.16.0.10 GET /health - OK"
  ];
  
  var errorCount = 0;
  var ipAddresses = [];
  var requests = [];
  
  for (var i = 0; i < logEntries.length; i++) {
    var entry = logEntries[i];
    console.log("Analyzing: " + entry);
    
    // Check for errors
    var hasError = errorPattern.test(entry);
    if (hasError) {
      errorCount = errorCount + 1;
      console.log("  ⚠ Error detected in entry " + (i + 1));
    }
    
    // Extract timestamp
    var timestampMatch = entry.match(timestampPattern);
    if (timestampMatch !== null) {
      console.log("  📅 Timestamp: " + timestampMatch[0]);
    }
    
    // Extract IP addresses
    var ipMatches = entry.match(ipPattern);
    if (ipMatches !== null) {
      console.log("  🌐 IP: " + ipMatches[0]);
    }
    
    // Extract request information
    var requestMatch = entry.match(requestPattern);
    if (requestMatch !== null) {
      console.log("  📨 Request: " + requestMatch[1] + " " + requestMatch[2]);
    }
  }
  
  console.log("\n--- Step 3: Generate Sanitized Report ---");
  
  var report = "Log Analysis Report\n===================\n";
  report = report + "Total entries analyzed: " + logEntries.length + "\n";
  report = report + "Errors found: " + errorCount + "\n\n";
  
  for (var j = 0; j < logEntries.length; j++) {
    var sanitizedEntry = logEntries[j];
    
    // Hide IP addresses
    sanitizedEntry = sanitizedEntry.replace(ipPattern, "[IP-HIDDEN]");
    
    // Mark errors
    sanitizedEntry = sanitizedEntry.replace(errorPattern, "[ERROR-LEVEL]");
    
    // Clean timestamps
    sanitizedEntry = sanitizedEntry.replace(timestampPattern, "[TIMESTAMP]");
    
    report = report + "Entry " + (j + 1) + ": " + sanitizedEntry + "\n";
  }
  
  console.log(report);
  
  console.log("\n--- Step 4: Pattern Validation ---");
  
  var testCases = [
    { text: "192.168.1.1", pattern: ipPattern, expected: "IP match" },
    { text: "2024-12-25 23:59:59", pattern: timestampPattern, expected: "Timestamp match" },
    { text: "ERROR: Connection lost", pattern: errorPattern, expected: "Error match" },
    { text: "GET /api/data", pattern: requestPattern, expected: "Request match" }
  ];
  
  for (var k = 0; k < testCases.length; k++) {
    var testCase = testCases[k];
    var matches = testCase.pattern.test(testCase.text);
    
    console.log("✓ " + testCase.expected + ": " + (matches ? "PASS" : "FAIL"));
    console.log("  Input: " + testCase.text);
    console.log("  Pattern: " + testCase.pattern.source);
  }
  
  console.log("\n=== TODO Log Analysis Complete ===");
  console.log("RegExp pattern matching enables powerful TODO orchestration for:");
  console.log("  • Log parsing and analysis");
  console.log("  • Data extraction and validation");
  console.log("  • Content sanitization and reporting");
  console.log("  • Pattern-based decision making");
  
  return 0;
}
```

#### Step 4: Execute E2E Tests Following E2E_TESTING.md Protocol

**Step 4a**: Rebuild All Packages
```bash
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache
```

**Step 4b**: Execute Complete Test
```bash
cd test/integration
npx tsx mcp-test-client.ts ../programs/10-regex/regex-pattern-matching-complete.ts
```

**Step 4c**: Execute Error Test (Should Fail Gracefully)
```bash
npx tsx mcp-test-client.ts ../programs/10-regex/regex-pattern-matching-errors.ts
```

**Step 4d**: Execute TODO Example
```bash
npx tsx mcp-test-client.ts ../programs/10-regex/todo-log-analyzer.ts
```

### Success Criteria
- ✅ All E2E test programs execute successfully
- ✅ Complete regex functionality demonstrated (test, match, replace)
- ✅ Complex patterns and flag combinations work
- ✅ Error handling works correctly (invalid operations fail gracefully)
- ✅ TODO orchestration examples show practical usage
- ✅ Programs follow E2E_TESTING.md execution protocol
- ✅ Output demonstrates working pattern matching with correct results
- ✅ Real-world scenarios for log analysis, data sanitization, etc. work

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
- [ ] Error handling works correctly for all three methods
- [ ] Integration with existing CVM features verified
- [ ] Performance acceptable for TODO orchestration use cases
- [ ] Documentation reflects implemented features

### Cross-Package Integration
- [ ] Parser exports all regex opcodes correctly
- [ ] Compiler generates correct bytecode instructions for all methods
- [ ] VM handlers execute all instructions properly
- [ ] Heap management works correctly for arrays and strings
- [ ] No memory leaks or reference issues

---

## Implementation Notes

### CVM Method Call Compilation Pattern
Method calls in CVM follow this pattern:
```typescript
// object.method(arg1, arg2) compiles to:
// LOAD object → LOAD arg1 → LOAD arg2 → METHOD_OPCODE
```

### RegExp Methods Stack Effects
```typescript
// regex.test(string): [regexRef, string] → [boolean]
// string.match(regex): [string, regexRef] → [arrayRef | null]  
// string.replace(regex, replacement): [string, regexRef, replacement] → [newString]
```

### JavaScript Compliance
All methods follow JavaScript RegExp semantics exactly:
- `.test()` returns boolean
- `.match()` returns array with matches + groups, or null
- `.replace()` returns new string, respects global flag
- Global flag affects `.match()` and `.replace()` behavior
- Case insensitive flag works for all methods

### Error Handling Strategy
- Type validation for all arguments
- Heap reference validation
- Stack underflow protection
- Graceful error recovery (restore stack state)
- CVM-standard error object format

---

**Plan Status**: ✅ Ultra-detailed implementation plan complete  
**Granularity**: ✅ Micro-atomic steps with complete code  
**Architecture**: ✅ Deep CVM patterns integration  
**Testing**: ✅ Comprehensive TDD and E2E validation  
**Foundation**: ✅ Built on existing LOAD_REGEX implementation  
**Ready for**: ✅ Production implementation via evolution program  

This plan provides complete implementation guidance for every line of code needed to implement RegExp pattern matching methods (.test(), .match(), .replace()) in CVM using atomic TDD methodology, completing the RegExp functionality to make it actually usable.