# Reference Heap Implementation Findings

## Overview
The reference heap implementation was completed but contains several issues that compromise the original design goals. This document details all findings from the code review.

## Critical Issues

### 1. VM Crash on Invalid Heap Access
**Location**: `/packages/vm/src/lib/vm-heap.ts:59`
```typescript
get(id: number): HeapObject | undefined {
  const obj = objects.get(id);
  if (!obj) {
    throw new Error(`Invalid heap reference: ${id}`);  // This crashes the VM!
  }
  return obj;
}
```
**Problem**: Throwing an error crashes the entire VM process. The VM's execution loop expects `undefined` for missing objects, not thrown exceptions.

### 2. Incomplete Reference Implementation - Only 2 Places Use Heap

The implementation only partially converts to heap references. Only TWO operations create heap references:

**Location 1**: `/packages/vm/src/lib/handlers/advanced.ts:126-128` (FS_LIST_FILES)
```typescript
if (isCVMArray(result)) {
  const ref = state.heap.allocate('array', result);
  state.stack.push(ref);
}
```

**Location 2**: `/packages/vm/src/lib/handlers/advanced.ts:328-330` (STRING_SPLIT)
```typescript
const array = createCVMArray(parts);
const ref = state.heap.allocate('array', array);
state.stack.push(ref);
```

**All other array/object creation still uses inline values**:
- `ARRAY_NEW` - creates inline arrays
- `OBJECT_CREATE` - creates inline objects  
- Array literals `[1, 2, 3]` - inline
- Object literals `{a: 1}` - inline

This creates a **hybrid system** where some arrays are references and others are inline values.

## High-Severity Issues

### 1. Stack Overflow Risk During Serialization
**Location**: `/packages/vm/src/lib/vm-manager.ts:156-169` (duplicated at 276-289)
```typescript
const heapObjects: Record<number, { type: 'array' | 'object'; data: CVMValue }> = {};
state.heap.objects.forEach((heapObj, id) => {
  heapObjects[id] = {
    type: heapObj.type,
    data: heapObj.data as CVMValue
  };
});
```
**Problem**: This creates a plain JS object containing ALL heap data, which is then passed to `JSON.stringify()`. For deeply nested structures, this causes stack overflow.

### 2. Semantic Ambiguity from Hybrid Model
The system now has TWO different behaviors for the same operations:

**Example 1 - Array mutation**:
```javascript
// Inline array (from ARRAY_NEW)
let a = [];
let b = a;  // b gets a COPY of the array
a.push(1);  // b is NOT affected

// Heap reference (from fs.listFiles)
let files = fs.listFiles("/");
let backup = files;  // backup gets the SAME reference
files.push("new");  // backup IS affected
```

**Example 2 - Equality**:
```javascript
let a = [1, 2, 3];  // Inline array
let b = [1, 2, 3];  // Different inline array
a === b;  // false (different objects)

let files1 = fs.listFiles("/");  // Heap reference
let files2 = files1;  // Same reference
files1 === files2;  // true (same reference)
```

## Medium-Severity Issues

### 1. ARRAY_GET/SET Handle Both Arrays and Objects
**Location**: `/packages/vm/src/lib/handlers/arrays.ts:80-230`

These opcodes accept both arrays AND objects, duplicating the logic of PROPERTY_GET/SET:
```typescript
// In ARRAY_GET
if (isCVMArray(arrayOrObject)) {
  // Handle as array with numeric index
} else if (isCVMObject(arrayOrObject)) {
  // Handle as object with string key - duplicates PROPERTY_GET!
}
```

### 2. Duplicated State Serialization Code
**Locations**: 
- `/packages/vm/src/lib/vm-manager.ts:151-169` (in getNext)
- `/packages/vm/src/lib/vm-manager.ts:271-289` (in reportCCResult)

The exact same code for serializing VM state appears twice.

### 3. Inconsistent Undefined Handling
**Location**: `/packages/vm/src/lib/handlers/arrays.ts:130`
```typescript
const element = arrayOrObject.elements[indexOrKey] ?? null;  // Returns null
```

But PROPERTY_GET returns `createCVMUndefined()` for missing properties. JavaScript returns `undefined` for both cases.

## Root Cause Analysis

The implementation appears to have been done incrementally without fully committing to the reference model:

1. **Phase 1-2**: Added reference types and heap infrastructure ✓
2. **Phase 2**: Updated array handlers to SUPPORT references but didn't make them CREATE references ✗
3. **Phase 3**: Updated object handlers to SUPPORT references but didn't make them CREATE references ✗
4. **Only 2 specific operations** were converted to use heap allocation

This resulted in a system that can handle both inline and reference values but doesn't consistently use one model.

## Impact on Original Goals

1. ✗ **Goal #1**: "Replace inline storage with reference-based heap storage" - Only partially achieved
2. ⚠️ **Goal #2**: "Maintain JavaScript reference semantics" - Inconsistent semantics
3. ⚠️ **Goal #3**: "Reduce serialization size" - Only works for FS_LIST_FILES and STRING_SPLIT
4. ✗ **Goal #5**: "Zero breaking changes" - Semantic changes could break existing programs

## Why This Happened

Looking at the test files that were created:
- `handlers/arrays-ref.spec.ts` - Tests that handlers can HANDLE references
- `handlers/objects-ref.spec.ts` - Tests that handlers can HANDLE references

But there are NO tests verifying that ARRAY_NEW and OBJECT_CREATE actually CREATE references. The tests only verify that the handlers work with references if they receive them.

## Recommendations

1. **Decide on the model**:
   - Option A: Full reference model - ALL arrays/objects allocated on heap
   - Option B: Keep hybrid but document clearly when references vs inline are used
   - Option C: Add a VM flag to control the behavior

2. **Fix critical issues**:
   - Make heap.get() return undefined instead of throwing
   - Fix inconsistent undefined handling
   - Extract duplicated serialization code

3. **Complete the implementation**:
   - If going with Option A, update ARRAY_NEW and OBJECT_CREATE to allocate on heap
   - Add proper tests that verify the allocation behavior
   - Update documentation to explain the model clearly