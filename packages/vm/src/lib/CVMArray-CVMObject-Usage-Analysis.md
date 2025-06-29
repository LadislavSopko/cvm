# CVMArray and CVMObject Usage Analysis Report

## Overview
This report analyzes the usage of CVMArray and CVMObject types across the VM codebase to determine which usages should be converted to references and which should remain as-is.

## Analysis by File

### 1. file-system.ts
**Line 59:** `const result = createCVMArray();`
- **Context:** Creating array to return list of files
- **Recommendation:** **Convert to reference** - This is a user-facing array that will be returned to CVM programs
- **Reason:** File lists can be large and should be heap-allocated for memory efficiency

### 2. handlers/arrays.ts
**Lines 11-12:** Type imports for CVMArray and CVMObject
- **Context:** Type definitions for handler logic
- **Recommendation:** **Keep as-is** - These are type imports needed for type checking

**Lines 34, 46, 71, 84, 95:** Local variables typed as CVMArray
- **Context:** Temporary variables used to dereference heap objects
- **Recommendation:** **Keep as-is** - These are internal variables for dereferencing, not creating new arrays

**Lines 156, 169, 180:** Local variables typed as CVMArray | CVMObject  
- **Context:** Temporary variables for dereferencing during ARRAY_SET
- **Recommendation:** **Keep as-is** - Internal dereferencing variables

**Line 249:** Local variable typed as CVMArray
- **Context:** Temporary variable for ARRAY_LEN operation
- **Recommendation:** **Keep as-is** - Internal dereferencing variable

### 3. handlers/objects.ts
**Lines 16-17:** Type imports for CVMObject and CVMArray
- **Context:** Type definitions
- **Recommendation:** **Keep as-is** - Type imports

**Lines 26, 36, 46-54:** CVMArray/CVMObject usage in cvmValueToJs helper
- **Context:** Converting CVM values to JavaScript for JSON.stringify
- **Recommendation:** **Keep as-is** - This is internal conversion logic, not creating new objects

**Lines 82, 94:** Local variable typed as CVMObject
- **Context:** Temporary variable for dereferencing in PROPERTY_SET
- **Recommendation:** **Keep as-is** - Internal dereferencing variable

**Lines 137, 149:** Local variable typed as CVMObject
- **Context:** Temporary variable for dereferencing in PROPERTY_GET
- **Recommendation:** **Keep as-is** - Internal dereferencing variable

### 4. handlers/advanced.ts
**Line 321:** `state.stack.push(createCVMArray(parts));`
- **Context:** STRING_SPLIT operation creating array of string parts
- **Recommendation:** **Convert to reference** - This creates a new array that will be used by user code
- **Reason:** Split results can be large and should be heap-allocated

### 5. handlers/iterators.ts
**Lines 3, 23:** Import and usage of isCVMArray
- **Context:** Type checking for iteration
- **Recommendation:** **Keep as-is** - This is type checking, not creating arrays

**Lines 10, 43-46:** References to array in iterator context
- **Context:** Storing reference to array being iterated
- **Recommendation:** **Keep as-is** - The iterator stores a reference to existing arrays

### 6. handlers/strings.ts
**Lines 3, 10-11, 14-17, 20-22, 26-29, 32-35:** Import and helper functions
- **Context:** JSON parsing helper that creates CVMArray/CVMObject
- **Recommendation:** **Already using references** - The jsonToCVMValue helper already allocates arrays and objects on the heap (lines 23, 37)

**Lines 84-85, 97:** Type checking for isCVMArray
- **Context:** LENGTH operation type checking
- **Recommendation:** **Keep as-is** - Type checking only

### 7. vm-heap.ts
**Lines 1, 6:** Type imports for CVMArray and CVMObject
- **Context:** Heap storage type definitions
- **Recommendation:** **Keep as-is** - The heap needs these types to store data

### 8. vm-manager.ts
**Line 4:** Import of CVMArray and CVMObject types
- **Context:** Type imports for serialization
- **Recommendation:** **Keep as-is** - Type imports

**Lines 158-164, 278-289:** Heap serialization logic
- **Context:** Serializing heap objects for storage
- **Recommendation:** **Keep as-is** - This is infrastructure code for persistence

**Line 425:** Type assertion for deserialization
- **Context:** Restoring heap objects from storage
- **Recommendation:** **Keep as-is** - Infrastructure code

### 9. vm.ts
**Lines 2, 10:** Type imports and IteratorContext definition
- **Context:** VM state management
- **Recommendation:** **Keep as-is** - Type definitions and iterator tracking

## Summary of Changes Needed

### Files that need changes:
1. **file-system.ts**
   - Line 59: Change `createCVMArray()` to heap allocation
   
2. **handlers/advanced.ts**
   - Line 321: Change `createCVMArray(parts)` to heap allocation

### Files that are already correct:
1. **handlers/strings.ts** - Already allocates arrays/objects on heap in jsonToCVMValue

### Files that don't need changes:
All other files use CVMArray/CVMObject only for:
- Type imports
- Type checking
- Temporary variables for dereferencing heap objects
- Infrastructure/serialization code

## Implementation Recommendations

1. **For file-system.ts listFiles():**
```typescript
const array = createCVMArray();
const result = state.heap.allocate('array', array);
// Modify to push to array.elements instead of result.elements
return result;
```

2. **For handlers/advanced.ts STRING_SPLIT:**
```typescript
const array = createCVMArray(parts);
const ref = state.heap.allocate('array', array);
state.stack.push(ref);
```

3. **General Pattern:**
   - User-created arrays/objects should be heap-allocated and return references
   - Internal VM structures and temporary variables can remain as direct values
   - Type imports and infrastructure code should remain unchanged