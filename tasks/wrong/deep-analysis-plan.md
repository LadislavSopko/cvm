# Deep Analysis Plan: CVM [] Accessor & Reference System

## Objective
Systematically analyze the `[]` accessor implementation and reference vs owned object usage from the ground up to identify all problems, inconsistencies, and missing functionality.

## Analysis Structure

### Phase 1: Foundation Analysis
**Goal**: Understand the fundamental type system and reference architecture

#### 1.1 Type System Examination
- [ ] **CVMValue Union Analysis**
  - Examine `packages/types/src/lib/cvm-value.ts` line by line
  - Map all possible value types in the union
  - Identify which types are primitives vs references vs direct objects
  - Document the ambiguity: when is CVMArray a value vs when is CVMArrayRef used?
  - Check type guards: do they handle all cases correctly?

#### 1.2 Reference vs Direct Object Usage Patterns
- [ ] **Reference Creation Points**
  - Find every place where heap references are created
  - Find every place where direct objects/arrays are created
  - Map the decision logic: when does code choose reference vs direct?
  - Document inconsistencies in creation patterns

- [ ] **Reference Dereferencing Points**
  - Find every place where references are dereferenced to actual objects
  - Check if dereferencing is consistent across all handlers
  - Identify places where direct objects are assumed vs references

#### 1.3 Heap Structure Analysis
- [ ] **Heap Implementation**
  - Examine `packages/vm/src/lib/vm-heap.ts`
  - Document heap storage format: `{type, data}` wrapper analysis
  - Check heap allocation/deallocation patterns
  - Verify heap ID management and collision handling

### Phase 2: Compiler Behavior Analysis
**Goal**: Understand how different accessor patterns are compiled

#### 2.1 Bracket Notation Compilation
- [ ] **Element Access Compilation**
  - Examine `packages/parser/src/lib/compiler/expressions/element-access.ts`
  - Document exactly what opcodes are emitted for `target[index]`
  - Test with different target types: string, array, object
  - Test with different index types: number, string, variable

#### 2.2 Property Access Compilation
- [ ] **Property Access Compilation**
  - Examine `packages/parser/src/lib/compiler/expressions/property-access.ts`
  - Document exactly what opcodes are emitted for `target.property`
  - Compare with bracket notation: are they equivalent?

#### 2.3 Opcode Selection Logic
- [ ] **Compiler Decision Tree**
  - Map the complete decision tree for accessor compilation
  - Document when ARRAY_GET vs PROPERTY_GET vs other opcodes are chosen
  - Identify if compiler has access to type information for better decisions
  - Check if there are cases where wrong opcodes are selected

### Phase 3: Runtime Handler Analysis
**Goal**: Understand how each type handles [] access at runtime

#### 3.1 ARRAY_GET Handler Deep Dive
- [ ] **Handler Logic Flow**
  - Trace complete execution path in `packages/vm/src/lib/handlers/arrays.ts`
  - Document each branch: ArrayRef, ObjectRef, direct Array, other types
  - Map stack operations: what gets popped, what gets pushed
  - Identify type conversion points and safety checks

- [ ] **Object Handling in ARRAY_GET**
  - Line 114: `const key = index as string;` - analyze this unsafe cast
  - Check if numeric indices are properly converted to strings
  - Verify object property access behavior matches JavaScript
  - Test edge cases: symbol keys, numeric string keys, etc.

- [ ] **Array Handling in ARRAY_GET**
  - Check numeric index validation and bounds checking
  - Verify array element access behavior
  - Test edge cases: negative indices, floating point indices, string indices

#### 3.2 String Access Analysis
- [ ] **String [] Access Support**
  - Check if ARRAY_GET handles string targets
  - Verify if `"hello"[0]` works and returns `"h"`
  - Test string bounds checking and out-of-bounds behavior
  - Compare with JavaScript string indexing semantics

#### 3.3 Cross-Type Consistency Check
- [ ] **Behavior Matrix Creation**
  - Create matrix: [string, array, object] × [number index, string index]
  - Document actual behavior vs expected JavaScript behavior
  - Identify inconsistencies and missing cases

### Phase 4: Missing Functionality Audit
**Goal**: Identify what [] accessor features are missing

#### 4.1 JavaScript Semantics Comparison
- [ ] **Complete Feature Checklist**
  - String indexing: `"hello"[0]` → `"h"`
  - Array indexing: `[1,2,3][0]` → `1`
  - Object property access: `{a:1}["a"]` → `1`
  - Numeric property access: `{0:1}[0]` → `1`
  - Negative indices (should be undefined in JS)
  - Non-integer indices (should work for objects, be undefined for arrays)
  - Symbol keys (not relevant for CVM yet)
  - Out-of-bounds access (should return undefined)

#### 4.2 Type Coercion Analysis
- [ ] **Index Type Coercion**
  - How are different index types converted?
  - Does `obj[1]` become `obj["1"]` correctly?
  - Does `arr["0"]` become `arr[0]` correctly?
  - What happens with boolean indices, null indices, undefined indices?

#### 4.3 Edge Case Inventory
- [ ] **Error Conditions**
  - What happens with null/undefined targets?
  - What happens with null/undefined indices?
  - Stack underflow scenarios with insufficient arguments
  - Heap corruption scenarios (invalid references)

### Phase 5: Reference System Integrity
**Goal**: Verify reference system is consistent and safe

#### 5.1 Reference Lifecycle Analysis
- [ ] **Creation to Destruction**
  - Trace reference from creation to final use
  - Check if references can become dangling
  - Verify reference counting or garbage collection
  - Test reference persistence across CC() calls

#### 5.2 Serialization/Deserialization
- [ ] **Heap Persistence**
  - Examine `vm-manager.ts` serialization logic
  - Check if references are properly restored after CC()
  - Verify circular reference handling
  - Test deep nesting limits (stack overflow in restore)

#### 5.3 Memory Safety
- [ ] **Heap Integrity**
  - Check bounds on heap access
  - Verify heap ID collision handling
  - Test heap overflow scenarios
  - Check for memory leaks in reference handling

### Phase 6: Integration Testing Matrix
**Goal**: Systematic testing of all combinations

#### 6.1 Accessor Pattern Matrix
```
Target Type    | Index Type  | Expected Behavior | Actual Behavior | Issues
String         | number      | "hello"[0]="h"   | ?               | ?
String         | string      | "hello"["0"]="h" | ?               | ?
Array          | number      | [1,2,3][0]=1     | ?               | ?
Array          | string      | [1,2,3]["0"]=1   | ?               | ?
Object         | string      | {a:1}["a"]=1     | ?               | ?
Object         | number      | {0:1}[0]=1       | ?               | ?
ArrayRef       | number      | ref[0]=value     | ?               | ?
ObjectRef      | string      | ref["key"]=val   | ?               | ?
```

#### 6.2 Error Condition Matrix
```
Scenario                    | Expected Error | Actual Behavior | Issues
null[0]                    | TypeError      | ?               | ?
undefined[0]               | TypeError      | ?               | ?
"hello"[-1]                | undefined      | ?               | ?
array[1.5]                 | undefined      | ?               | ?
Invalid heap reference     | RuntimeError   | ?               | ?
```

### Phase 7: Performance & Safety Analysis
**Goal**: Identify performance issues and safety vulnerabilities

#### 7.1 Performance Bottlenecks
- [ ] **Type Checking Overhead**
  - Count type checks per accessor operation
  - Identify redundant type conversions
  - Check for unnecessary heap lookups

#### 7.2 Safety Vulnerabilities
- [ ] **Stack Safety**
  - All `pop()!` operations without bounds checking
  - Potential for stack underflow crashes
  - Missing validation of stack depth before operations

#### 7.3 Type Safety Issues
- [ ] **Unsafe Casts**
  - All `as Type` casts without runtime verification
  - Potential for type confusion bugs
  - Missing type guards in critical paths

## Deliverables

1. **Complete behavior matrix** documenting actual vs expected behavior
2. **Issue inventory** with severity classification
3. **Missing functionality list** compared to JavaScript semantics
4. **Architecture inconsistency report** 
5. **Safety vulnerability assessment**
6. **Performance bottleneck identification**

## Analysis Method

- **Read code line by line** - no assumptions
- **Trace execution paths manually** - understand actual flow
- **Compare with JavaScript specification** - identify gaps
- **Test edge cases conceptually** - find breaking points
- **Document everything** - build complete picture

This analysis will be purely investigative - no solutions, no fixes, just complete understanding of what exists and what's broken.