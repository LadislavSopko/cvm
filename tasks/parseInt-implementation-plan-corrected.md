# parseInt() Implementation Plan for CVM

## Overview
Add native `parseInt()` support to CVM as an additional built-in function alongside existing operators.

## Why This Matters
- `parseInt()` is standard JavaScript syntax that developers expect
- Provides radix-based number parsing (hex, binary, octal) that `+` operator cannot do
- README.md has examples using parseInt() that don't currently work
- API.md documents this as missing functionality we can add

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
1. Edit `packages/types/src/lib/types.ts`:
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
    expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
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
    expect(bytecode).toContainEqual({ op: OpCode.PUSH, arg: 10 });
    expect(bytecode).toContainEqual({ op: OpCode.PARSE_INT });
  });
});
```

#### Implementation
1. Edit `packages/parser/src/lib/compiler/expressions/call-expression.ts`:
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
1. Create `packages/vm/src/lib/handlers/parse-int.ts`:
   ```typescript
   import { OpCode } from '@cvm/types';
   import { HandlerDefinition } from '../handler-registry';
   import { safePop, isVMError } from '../vm-utils';
   
   export const parseIntHandler: Record<OpCode, HandlerDefinition> = {
     [OpCode.PARSE_INT]: {
       stackIn: 2,  // Takes string and radix
       stackOut: 1, // Returns number or null
       execute: (state, instruction) => {
         const radix = safePop(state, instruction.op);
         if (isVMError(radix)) return radix;
         
         const str = safePop(state, instruction.op);
         if (isVMError(str)) return str;
         
         // Handle null/undefined
         if (str === null || str === undefined) {
           state.stack.push(null);
           return undefined;
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
         
         return undefined;
       }
     }
   };
   ```

2. Register handler in `packages/vm/src/lib/handler-registry.ts`:
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
Add to existing `test/programs/03-built-ins/`:

1. `parseInt-basic.ts`:
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

#### Verification
- Run: `./test/programs/run-category.sh 03-built-ins`
- All tests should pass

---

### TDDAB-5: Update Documentation
**Goal**: Update docs to reflect parseInt() support

#### Implementation
1. Fix `README.md` line 399:
   - The example now works correctly!
   
2. Update `docs/API.md`:
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
**Goal**: Verify parseInt() integrates properly with existing CVM functionality

#### Implementation
1. **Create integration test program** in `test/programs/03-built-ins/parseInt-integration.ts`:
   ```typescript
   function main() {
     // Test both + operator and parseInt() work together
     var str = "42";
     var viaPlus = +str;           // Unary + (type coercion)
     var viaParseInt = parseInt(str); // parseInt (parsing)
     
     console.log("Using +: " + viaPlus);
     console.log("Using parseInt: " + viaParseInt);
     
     // Test parseInt with other built-ins
     var jsonStr = '{"num": "123"}';
     var obj = JSON.parse(jsonStr);
     var parsedNum = parseInt(obj.num);
     console.log("parseInt from JSON: " + parsedNum);
     
     // Test parseInt with CC()
     var userInput = CC("Enter hex number:");
     var hexValue = parseInt(userInput, 16);
     console.log("Hex value: " + hexValue);
     
     // Test parseInt in control flow
     var numbers = ["10", "20", "30"];
     for (var i = 0; i < numbers.length; i++) {
       var num = parseInt(numbers[i]);
       if (num > 15) {
         console.log("Number " + num + " is greater than 15");
       }
     }
   }
   ```
   
2. **Verify README.md example works**: Line 399 currently has non-working parseInt()
   - Test that documented examples now execute correctly
   
3. **Test edge case compatibility**:
   - parseInt() with heap objects (arrays, objects)  
   - parseInt() in control flow (if/while/for loops)
   - parseInt() with file operations and CC() calls

#### Verification
- Run integration test: `./test/programs/run-category.sh 03-built-ins`
- Run full BTLT: Build ✅ TypeCheck ✅ Lint ✅ Test ✅  
- Run all E2E tests: `./test/programs/run-all-tests.sh`
- Verify no performance regression in existing tests

---

## Implementation Order

1. **TDDAB-1**: Add opcode (5 min)
2. **TDDAB-2**: Compiler support (15 min)
3. **TDDAB-3**: VM handler (20 min)  
4. **TDDAB-4**: E2E tests (15 min)
5. **TDDAB-5**: Documentation (10 min)
6. **TDDAB-6**: Integration testing (20 min)

**Total estimated time**: ~85 minutes

## Success Criteria

- [ ] parseInt(string) works
- [ ] parseInt(string, radix) works  
- [ ] Returns null for invalid input (no exceptions)
- [ ] Works alongside existing + operator (no conflicts)
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
- parseInt() is ADDITIONAL to + operator, not a replacement