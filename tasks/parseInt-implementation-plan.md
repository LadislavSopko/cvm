# parseInt() Implementation Plan for CVM

## Overview
Add native `parseInt()` support to CVM to replace the workaround of using unary `+` operator.

## Why This Matters
- `parseInt()` is natural JavaScript syntax that developers expect
- Current workaround (`+` operator) is not intuitive
- README.md has examples using parseInt() that don't actually work
- API.md documents this as a limitation we can remove

## Implementation Strategy: TDDAB (Test-Driven Development Atomic Blocks)

### TDDAB-1: Add PARSE_INT Opcode
**Goal**: Define the bytecode operation for parseInt

#### Tests First
```typescript
// packages/types/src/lib/types.spec.ts
describe('OpCode enum', () => {
  it('should include PARSE_INT opcode', () => {
    expect(OpCode.PARSE_INT).toBeDefined();
    expect(OpCode.PARSE_INT).toBe('PARSE_INT');
  });
});
```

#### Implementation
1. Edit `/packages/types/src/lib/types.ts`:
   - Add `PARSE_INT = 'PARSE_INT'` after line 73 (after TYPEOF)
   
#### Verification
- Run: `npx nx test types`
- Ensure enum exports correctly

---

### TDDAB-2: Compiler Support for parseInt()
**Goal**: Make compiler recognize and compile parseInt() calls

#### Tests First
```typescript
// packages/parser/src/lib/compiler/expressions/call-expression.spec.ts
describe('parseInt compilation', () => {
  it('should compile parseInt(string)', () => {
    const ast = parseCode('var x = parseInt("42");');
    const bytecode = compile(ast);
    
    expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: "42" });
    expect(bytecode).toContainEqual({ op: OpCode.PARSE_INT });
    expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'x' });
  });
  
  it('should compile parseInt(string, radix)', () => {
    const ast = parseCode('var x = parseInt("FF", 16);');
    const bytecode = compile(ast);
    
    expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: "FF" });
    expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 16 });
    expect(bytecode).toContainEqual({ op: OpCode.PARSE_INT });
    expect(bytecode).toContainEqual({ op: OpCode.STORE, arg: 'x' });
  });
  
  it('should handle parseInt with variable', () => {
    const ast = parseCode('var x = parseInt(userInput);');
    const bytecode = compile(ast);
    
    expect(bytecode).toContainEqual({ op: OpCode.LOAD, arg: "userInput" });
    expect(bytecode).toContainEqual({ op: OpCode.PARSE_INT });
  });
});
```

#### Implementation
1. Edit `/packages/parser/src/lib/compiler/expressions/call-expression.ts`:
   ```typescript
   // Add after CC() handler (around line 96)
   else if (ts.isIdentifier(node.expression) && node.expression.text === 'parseInt') {
     // Compile the string argument
     if (node.arguments.length > 0) {
       compileExpression(node.arguments[0]);
     } else {
       reportError(node, 'parseInt() requires at least one argument');
       return;
     }
     
     // Compile radix if provided (optional second argument)
     if (node.arguments.length > 1) {
       compileExpression(node.arguments[1]);
     } else {
       // Default radix is 10
       state.emit(OpCode.PUSH, 10);
     }
     
     state.emit(OpCode.PARSE_INT);
   }
   ```

#### Verification
- Run: `npx nx test parser`
- Test compilation of various parseInt() patterns

---

### TDDAB-3: VM Handler for PARSE_INT
**Goal**: Execute parseInt operations in the VM

#### Tests First
```typescript
// packages/vm/src/lib/handlers/parse-int.spec.ts
import { OpCode } from '@cvm/types';
import { VM } from '../vm';

describe('PARSE_INT handler', () => {
  let vm: VM;
  
  beforeEach(() => {
    vm = new VM();
  });
  
  it('should parse integer string with default radix', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "42" },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.PARSE_INT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(42);
  });
  
  it('should parse hex string with radix 16', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "FF" },
      { op: OpCode.PUSH, arg: 16 },
      { op: OpCode.PARSE_INT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(255);
  });
  
  it('should return null for invalid input', () => {
    const bytecode = [
      { op: OpCode.PUSH, arg: "not-a-number" },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.PARSE_INT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(null);
  });
  
  it('should handle null/undefined input', () => {
    const bytecode = [
      { op: OpCode.PUSH_UNDEFINED },
      { op: OpCode.PUSH, arg: 10 },
      { op: OpCode.PARSE_INT },
      { op: OpCode.HALT }
    ];
    
    const state = vm.execute(bytecode);
    expect(state.stack[0]).toBe(null);
  });
});
```

#### Implementation
1. Create `/packages/vm/src/lib/handlers/parse-int.ts`:
   ```typescript
   import { OpCode } from '@cvm/types';
   import { HandlerDefinition } from '../handler-registry';
   
   export const parseIntHandler: Record<OpCode, HandlerDefinition> = {
     [OpCode.PARSE_INT]: {
       stackIn: 2,  // Takes string and radix
       stackOut: 1, // Returns number or null
       execute: (state) => {
         const radix = state.stack.pop()!;
         const str = state.stack.pop()!;
         
         // Handle null/undefined
         if (str === null || str === undefined) {
           state.stack.push(null);
           return { success: true };
         }
         
         // Convert to string if needed
         const strValue = String(str);
         
         // Parse with radix
         const radixNum = typeof radix === 'number' ? radix : 10;
         const result = parseInt(strValue, radixNum);
         
         // Return null for NaN (following CVM's no-exception pattern)
         if (isNaN(result)) {
           state.stack.push(null);
         } else {
           state.stack.push(result);
         }
         
         return { success: true };
       }
     }
   };
   ```

2. Register handler in `/packages/vm/src/lib/handler-registry.ts`:
   ```typescript
   import { parseIntHandler } from './handlers/parse-int';
   
   // Add to handlerRegistry
   ...parseIntHandler,
   ```

#### Verification
- Run: `npx nx test vm`
- Test parseInt with various inputs

---

### TDDAB-4: E2E Test Programs
**Goal**: Validate parseInt() works in real CVM programs

#### Tests First
Create `/test/programs/11-parseInt/`:

1. `basic-parseInt.ts`:
   ```typescript
   function main() {
     // Test basic parseInt
     var str1 = "42";
     var num1 = parseInt(str1);
     console.log("parseInt('42') = " + num1);
     
     // Test with radix
     var hex = "FF";
     var num2 = parseInt(hex, 16);
     console.log("parseInt('FF', 16) = " + num2);
     
     // Test with CC() input
     var userInput = CC("Enter a number:");
     var userNum = parseInt(userInput);
     console.log("You entered: " + userNum);
     
     // Test invalid input
     var invalid = "not-a-number";
     var result = parseInt(invalid);
     if (result === null) {
       console.log("Invalid input handled correctly");
     }
   }
   ```

2. `parseInt-edge-cases.ts`:
   ```typescript
   function main() {
     // Leading/trailing spaces
     console.log("parseInt('  42  ') = " + parseInt("  42  "));
     
     // Partial numbers
     console.log("parseInt('42px') = " + parseInt("42px"));
     
     // Different radix values
     console.log("parseInt('1010', 2) = " + parseInt("1010", 2));
     console.log("parseInt('077', 8) = " + parseInt("077", 8));
     
     // Null/undefined
     var nullResult = parseInt(null);
     console.log("parseInt(null) = " + nullResult);
   }
   ```

3. Add test configuration:
   ```json
   // test/programs/11-parseInt/config.json
   {
     "basic-parseInt": {
       "ccResponses": ["123"]
     },
     "parseInt-edge-cases": {
       "ccResponses": []
     }
   }
   ```

#### Verification
- Run: `./test/programs/run-category.sh 11-parseInt`
- All tests should pass

---

### TDDAB-5: Fix Documentation
**Goal**: Update docs to reflect parseInt() support

#### Implementation
1. Fix `/README.md` line 399:
   - The example now works correctly!
   
2. Update `/docs/API.md`:
   - Remove parseInt from "NOT Supported" section
   - Add to supported built-in functions
   - Document behavior (returns null on failure)

3. Update Memory Bank:
   - Add to progress.md
   - Note in activeContext.md

#### Verification
- Review documentation for accuracy
- Ensure examples work

---

### TDDAB-6: Integration Testing
**Goal**: Ensure parseInt() doesn't break existing functionality

#### Tests
1. Run full test suite:
   ```bash
   npx nx run-many --target=test --all
   ```

2. Run all E2E tests:
   ```bash
   ./test/programs/run-all-tests.sh
   ```

3. Test the problematic program:
   ```bash
   npx nx test cvm-server -- fix-domain-tests-factories-v2-issue.ts
   ```

#### Verification
- All existing tests pass
- No regression in functionality
- BTLT process: Build ✅ TypeCheck ✅ Lint ✅ Test ✅

---

## Implementation Order

1. **TDDAB-1**: Add opcode (5 min)
2. **TDDAB-2**: Compiler support (15 min)
3. **TDDAB-3**: VM handler (20 min)
4. **TDDAB-4**: E2E tests (15 min)
5. **TDDAB-5**: Documentation (10 min)
6. **TDDAB-6**: Integration testing (10 min)

**Total estimated time**: ~75 minutes

## Success Criteria

- [ ] parseInt(string) works
- [ ] parseInt(string, radix) works
- [ ] Returns null for invalid input (no exceptions)
- [ ] All existing tests still pass
- [ ] E2E test programs work
- [ ] Documentation updated
- [ ] README.md example now works
- [ ] Memory Bank updated

## Notes

- Follow CVM's no-exception pattern: return null on error
- Support both 1-arg and 2-arg forms
- Default radix is 10 (JavaScript standard)
- Handle edge cases gracefully
- Maintain backward compatibility