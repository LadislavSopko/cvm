# CVM [] Accessor TDD Fixing Plan

## Deep TDD Fixing Plan for CVM [] Accessor Architecture

### Phase 1: Discovery & Coverage Analysis (Day 1, 2-4 hours)

#### 1.1 Test Coverage Analysis
```bash
# Generate current test coverage
npx nx test vm --coverage --coverage-reporter=html
npx nx test types --coverage --coverage-reporter=html
```

**Goals:**
- Identify untested code paths in accessor handlers
- Find gaps in CVMValue type system testing
- Map current test assumptions vs reality

#### 1.2 Failing Test Creation (TDD Red Phase)
Create tests that expose the architectural flaws:

```typescript
// tests/accessor-reality-check.spec.ts
describe('CVM Accessor Reality Check - These Should FAIL', () => {
  it('object property access should work', () => {
    // This will fail - proves obj["key"] is broken
    const result = executeProgram(`
      const obj = { "testkey": "testvalue" };
      const value = obj["testkey"];
      CC(value);
    `);
    expect(result).toBe("testvalue"); // WILL FAIL - returns undefined
  });

  it('array element access should work', () => {
    // This will fail - proves array[0] is broken  
    const result = executeProgram(`
      const arr = ["first", "second"];
      const value = arr[0];
      CC(value);
    `);
    expect(result).toBe("first"); // WILL FAIL - returns undefined
  });

  it('array assignment should work', () => {
    // This will fail - proves array[i] = value is broken
    const result = executeProgram(`
      const arr = [];
      arr[0] = "test";
      CC(arr[0]);
    `);
    expect(result).toBe("test"); // WILL FAIL - returns undefined
  });
});
```

### Phase 2: Layer-by-Layer Architecture Analysis (Day 1-2, 4-6 hours)

#### 2.1 CVMValue Type System Layer
**Files**: `packages/types/src/lib/cvm-value.ts`
- ✅ **Working**: Type guards (`isCVMString`, `isCVMNumber`)
- ✅ **Working**: Conversion helpers (`cvmToString`, `cvmToNumber`)
- ❌ **Problem**: Not used in accessor handlers

#### 2.2 Handler Implementation Layer  
**Files**: `packages/vm/src/lib/handlers/arrays.ts`
- ❌ **Critical**: Lines 114, 139, 187, 211 bypass type system
- ❌ **Missing**: Primitive extraction before operations
- ❌ **Missing**: Proper CVMValue unwrapping

#### 2.3 VM Execution Layer
**Files**: `packages/vm/src/lib/vm.ts`
- ❌ **Unknown**: How opcodes map to handlers
- ❌ **Unknown**: Stack type consistency guarantees
- ❌ **Unknown**: Reference resolution timing

#### 2.4 Compiler Layer  
**Files**: `packages/parser/src/lib/compiler/`
- ❌ **Unknown**: How `obj["key"]` becomes opcodes
- ❌ **Unknown**: Type information preservation
- ❌ **Unknown**: When CVMValue wrapping happens

### Phase 3: TDD Implementation Strategy (Day 2-5, 12-16 hours)

#### 3.1 Red-Green-Refactor Cycles

**Cycle 1: Object Property Access (4 hours)**
```typescript
// RED: Write failing test
it('should access object property with string key', () => {
  const vm = new VM();
  const result = vm.execute([
    { op: OpCode.OBJECT_NEW },
    { op: OpCode.PUSH, arg: "key" },
    { op: OpCode.PUSH, arg: "value" },
    { op: OpCode.PROPERTY_SET },
    { op: OpCode.PUSH, arg: "key" },
    { op: OpCode.ARRAY_GET },  // This is the broken handler
    { op: OpCode.HALT }
  ]);
  expect(result.stack[0]).toBe("value");
});

// GREEN: Fix arrays.ts line 114
const key = isCVMString(index) ? index : cvmToString(index);

// REFACTOR: Extract helper function
function extractStringKey(index: CVMValue): string {
  return isCVMString(index) ? index : cvmToString(index);
}
```

**Cycle 2: Array Element Access (4 hours)**
```typescript
// RED: Write failing test  
it('should access array element with numeric index', () => {
  // Similar pattern for array[0] access
});

// GREEN: Fix arrays.ts line 139
const idx = isCVMNumber(index) ? index : cvmToNumber(index);
const element = array.elements[idx] ?? createCVMUndefined();

// REFACTOR: Extract helper
function extractNumericIndex(index: CVMValue): number {
  const num = isCVMNumber(index) ? index : cvmToNumber(index);
  return Number.isFinite(num) ? num : -1;
}
```

**Cycle 3: Assignment Operations (4 hours)**
```typescript
// RED: Write failing tests for obj["key"] = value and array[0] = value
// GREEN: Fix lines 187, 211 with proper primitive extraction
// REFACTOR: Create unified accessor helpers
```

**Cycle 4: Integration & Edge Cases (4 hours)**
```typescript
// RED: Write tests for string indexing, nested access, edge cases
// GREEN: Implement missing functionality  
// REFACTOR: Consolidate patterns
```

#### 3.2 Layer Integration Testing

**Test Each Layer Boundary:**
```typescript
describe('CVMValue Type System Integration', () => {
  it('should convert CVMValue to primitive correctly', () => {
    // Test type system layer
  });
  
  it('should handle primitives and CVMValues consistently', () => {
    // Test handler layer integration
  });
  
  it('should maintain type safety across VM operations', () => {
    // Test VM execution layer
  });
});
```

### Phase 4: Coverage-Driven Completion (Day 5-6, 4-6 hours)

#### 4.1 Coverage Gap Analysis
```bash
# After each fix cycle, check coverage
npx nx test vm --coverage
```

**Target Coverage Goals:**
- `arrays.ts`: 95%+ line coverage
- `cvm-value.ts`: 100% type guard coverage  
- Integration paths: 90%+ branch coverage

#### 4.2 Missing Functionality Implementation
Based on coverage analysis, implement:
- String indexing: `"hello"[0]`
- Array length manipulation: `array["length"] = 0`
- Cross-type error handling
- Nested accessor chains

### Phase 5: Architecture Validation (Day 6-7, 4 hours)

#### 5.1 End-to-End Integration Tests
```typescript
describe('CVM Complete Accessor Functionality', () => {
  it('should handle complex nested access patterns', () => {
    const result = executeProgram(`
      const data = {
        users: [
          { name: "Alice", age: 30 },
          { name: "Bob", age: 25 }
        ]
      };
      const firstUserName = data["users"][0]["name"];
      CC(firstUserName);
    `);
    expect(result).toBe("Alice");
  });
});
```

#### 5.2 Performance & Memory Testing
```typescript
describe('CVM Accessor Performance', () => {
  it('should handle large object/array operations efficiently', () => {
    // Create 1000+ element tests
    // Measure memory usage
    // Verify no memory leaks
  });
});
```

## Concrete Implementation Steps

### Day 1: Setup & Discovery
1. **Morning (2 hours)**: Run coverage analysis
   ```bash
   npx nx test vm --coverage --coverage-reporter=html
   npx nx test types --coverage --coverage-reporter=html
   ```
2. **Afternoon (2-4 hours)**: Create failing reality-check tests
   - Write tests that expose obj["key"] failures
   - Write tests that expose array[0] failures
   - Write tests that expose assignment failures
3. **Evening**: Map compiler → VM → handler flow
   - Identify all affected files
   - Document current architecture layers

### Day 2: Core Fixes Start
1. **Morning (4 hours)**: Fix object property access (TDD Cycle 1)
   - RED: Write failing test for obj["key"] access
   - GREEN: Fix arrays.ts line 114 with proper primitive extraction
   - REFACTOR: Extract helper function
2. **Afternoon (4 hours)**: Fix array element access (TDD Cycle 2)
   - RED: Write failing test for array[0] access  
   - GREEN: Fix arrays.ts line 139 with proper primitive extraction
   - REFACTOR: Extract helper function
3. **Evening**: Update primitive extraction helpers

### Day 3: Assignment Operations
1. **Morning (4 hours)**: Fix object property assignment (TDD Cycle 3)
   - RED: Write failing test for obj["key"] = value
   - GREEN: Fix arrays.ts line 187 with proper primitive extraction
   - REFACTOR: Create unified accessor helpers
2. **Afternoon (4 hours)**: Fix array element assignment
   - RED: Write failing test for array[0] = value
   - GREEN: Fix arrays.ts line 211 with proper primitive extraction
   - REFACTOR: Consolidate patterns
3. **Evening**: Add stack safety checks

### Day 4: Missing Features
1. **Morning (4 hours)**: Implement string indexing
   - RED: Write failing test for "hello"[0]
   - GREEN: Add string indexing support to ARRAY_GET
   - REFACTOR: Handle string targets properly
2. **Afternoon (2 hours)**: Add array length manipulation
   - RED: Write failing test for array["length"] = 0
   - GREEN: Implement length property handling
3. **Evening (2 hours)**: Improve error handling
   - Standardize error messages
   - Add proper stack underflow checks

### Day 5: Integration & Refinement
1. **Morning (4 hours)**: End-to-end integration tests
   - Complex nested access patterns
   - Mixed type operations
   - Error boundary testing
2. **Afternoon (2 hours)**: Coverage gap analysis
   ```bash
   npx nx test vm --coverage
   ```
   - Identify remaining untested paths
   - Write tests for edge cases
3. **Evening (2 hours)**: Performance testing
   - Large object/array operations
   - Memory usage monitoring

### Day 6: Architecture Validation
1. **Morning (2 hours)**: Complex nested access patterns
   - Multi-level property access
   - Array of objects access
   - Object with array properties
2. **Afternoon (2 hours)**: Memory safety verification
   - Stack overflow protection
   - Heap corruption prevention
   - Reference lifecycle management
3. **Evening**: Stress testing
   - Large data structure operations
   - High-frequency access patterns

### Day 7: Polish & Documentation
1. **Morning (2 hours)**: Code cleanup and refactoring
   - Remove duplicate helper functions
   - Consolidate error handling
   - Optimize performance hotpaths
2. **Afternoon (2 hours)**: Update documentation
   - Document new accessor behavior
   - Update architecture diagrams
   - Write migration guide
3. **Evening**: Performance benchmarks
   - Compare before/after performance
   - Document performance improvements

## Success Criteria

### Functional Requirements
- [ ] **Object property access works**: `obj["key"]` returns correct value
- [ ] **Array element access works**: `array[0]` returns correct value  
- [ ] **Object assignment works**: `obj["key"] = value` stores correctly
- [ ] **Array assignment works**: `array[0] = value` stores correctly
- [ ] **String indexing works**: `"hello"[0]` returns `"h"`
- [ ] **Array length manipulation works**: `array["length"] = 0` truncates array
- [ ] **Nested access works**: `obj["prop"][0]["nested"]` works correctly
- [ ] **Cross-type operations**: Proper error handling for invalid operations

### Quality Requirements
- [ ] **95%+ test coverage** on accessor handlers
- [ ] **All existing tests continue to pass**
- [ ] **No memory leaks** in stress tests
- [ ] **Performance within 10%** of baseline
- [ ] **Stack safety** - no crashes from malformed bytecode
- [ ] **Type safety** - proper CVMValue handling throughout

### Architecture Requirements
- [ ] **Proper CVMValue primitive extraction** throughout all handlers
- [ ] **Eliminated `"[object Object]"` collisions** in property access
- [ ] **Stack safety checks** in all handlers using `state.stack.pop()`
- [ ] **Type system properly integrated** - use existing conversion helpers
- [ ] **Consistent error handling** between GET and SET operations
- [ ] **Reference model simplified** - clear direct value vs reference handling

## File Targets for Implementation

### Primary Files to Modify
1. **`packages/vm/src/lib/handlers/arrays.ts`**
   - Lines 114, 139, 187, 211 - critical primitive extraction fixes
   - Add helper functions for safe type conversion
   - Implement stack safety checks

2. **`packages/vm/src/lib/handlers/strings.ts`**
   - Add string indexing support
   - Integrate with ARRAY_GET handler

3. **`packages/types/src/lib/cvm-value.ts`**
   - Verify conversion helpers work correctly
   - Add any missing type conversion utilities

### Test Files to Create/Update
1. **`packages/vm/src/lib/accessor-reality-check.spec.ts`** (new)
   - Failing tests that expose current bugs
   - Reality check tests for basic functionality

2. **`packages/vm/src/lib/vm-arrays.spec.ts`** (update)
   - Add comprehensive array assignment tests
   - Add primitive extraction validation tests

3. **`packages/vm/src/lib/vm-objects.spec.ts`** (update)
   - Add comprehensive object property tests
   - Add edge case validation

4. **`packages/vm/src/lib/integration-accessor.spec.ts`** (new)
   - End-to-end nested access tests
   - Cross-type operation tests
   - Performance and stress tests

This plan provides concrete, measurable steps to systematically fix the architectural problems using TDD methodology and coverage analysis to ensure complete solution.