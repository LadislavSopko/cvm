# CVM [] Accessor - Real Architectural Problems

## The Core Problem: Primitive Extraction Failure

**ROOT CAUSE**: The entire [] accessor system treats CVMValue objects as JavaScript primitives without extracting their values.

### CRITICAL ARCHITECTURAL FLAWS

#### 1. Object Property Access Complete Failure
**Location**: `packages/vm/src/lib/handlers/arrays.ts:114`
```typescript
const key = index as string;  // WRONG: CVMString object used as primitive
```
**Result**: `obj["key"]` → `obj.properties["[object Object]"]` → ALL property access returns undefined

#### 2. Array Element Access Complete Failure  
**Location**: `packages/vm/src/lib/handlers/arrays.ts:139`
```typescript
const element = array.elements[index] ?? createCVMUndefined();  // WRONG: CVMNumber as index
```
**Result**: `array[1]` → `array.elements["[object Object]"]` → ALL array access returns undefined

#### 3. Array Assignment Complete Failure
**Location**: `packages/vm/src/lib/handlers/arrays.ts:211`
```typescript
const idx = Math.floor(index);  // WRONG: Math.floor(CVMNumber) = NaN
```
**Result**: `array[1] = "test"` → `array.elements[NaN] = "test"` → Elements stored as "NaN" property

#### 4. Object Assignment Collision Bug
**Location**: `packages/vm/src/lib/handlers/arrays.ts:187`
```typescript
obj.properties[index] = value;  // WRONG: CVMString object as key
```
**Result**: ALL object properties collide on `"[object Object]"` key

## Architectural Pattern Analysis

**WRONG PATTERN** (throughout codebase):
```typescript
// CVMValue objects used directly as primitives
const key = index as string;        
const idx = Math.floor(index);      
obj.properties[index] = value;
array.elements[index] = value;
```

**CORRECT PATTERN** (should be):
```typescript
// Proper primitive extraction
const key = isCVMString(index) ? index : cvmToString(index);
const idx = isCVMNumber(index) ? Math.floor(index) : -1;
```

## Why Tests Pass Despite Broken Functionality

1. **Tests validate interface, not implementation**
   - Check for undefined return without verifying it's the CORRECT undefined
   - Assume errors indicate proper function rather than bugs
   - No value verification in success scenarios

2. **Type confusion masquerading as correct behavior**
   - Bugs produce undefined (expected for missing properties)
   - Wrong reason, right result allows bugs to hide

## The Dual-Track Architecture Problem

**Issue**: CVMValue union type creates unsolvable complexity
- Stack contains both direct values AND references
- Every operation needs dual logic paths
- Direct values don't persist changes
- Primitive extraction not implemented correctly

## Reference vs Value Handling Confusion

**Current Architecture**:
```typescript
type CVMValue = string | number | CVMArray | CVMArrayRef | ...
```

**Problems**:
- Sometimes `index` is primitive `number` 
- Sometimes `index` is `CVMNumber` object
- Handlers don't know which and cast unsafely
- Creates `"[object Object]"` collisions everywhere

## Missing CVMValue Primitive Extraction

**Available but unused**:
- `cvmToString(value)` - extracts string from CVMValue
- `cvmToNumber(value)` - extracts number from CVMValue  
- `isCVMString(value)` - type guards exist
- `isCVMNumber(value)` - type guards exist

**Problem**: Array handlers bypass type system entirely

## Critical Missing Functionality

1. **String indexing**: `"hello"[0]` not supported
2. **Array length manipulation**: `array["length"] = 0` fails
3. **Cross-type access**: No mixed accessor patterns
4. **Nested operations**: `obj.array[0].prop` completely untested

## Stack Safety Issues

**Pattern throughout handlers**:
```typescript
const value = state.stack.pop()!;  // No bounds checking
const index = state.stack.pop()!;  // Crashes on empty stack
```

## Architecture Quality Assessment

| Component | Status | Impact |
|-----------|--------|---------|
| Object Property Access | **BROKEN** | 100% failure rate |
| Array Element Access | **BROKEN** | 100% failure rate |
| Object Property Assignment | **BROKEN** | All properties collide |
| Array Element Assignment | **BROKEN** | Elements stored as "NaN" |
| String Indexing | **MISSING** | Throws error |
| Type System Integration | **FAILED** | Primitive extraction bypassed |

## The Real Fix Required

**NOT** small bug fixes, but **architectural rescue**:

1. **Complete primitive extraction refactor** across all handlers
2. **CVMValue type system integration** - use the helpers that exist  
3. **Reference model simplification** - eliminate dual-track complexity
4. **Comprehensive test rewrite** with value verification

## Evidence of Systematic Failure

**All these operations currently fail**:
```typescript
// Object access - returns undefined
obj["key"]           // → obj.properties["[object Object]"]

// Array access - returns undefined  
array[0]             // → array.elements["[object Object]"]

// Object assignment - all collide
obj["key1"] = "a"    // → obj.properties["[object Object]"] = "a"  
obj["key2"] = "b"    // → obj.properties["[object Object]"] = "b" (overwrites)

// Array assignment - stored as NaN
array[0] = "test"    // → array.elements["NaN"] = "test"
array[1] = "data"    // → array.elements["NaN"] = "data" (overwrites)

// String indexing - throws error
"hello"[0]           // → RuntimeError: "ARRAY_GET requires an array"
```

**CONCLUSION**: The [] accessor system is architecturally broken and needs complete refactoring to properly integrate with the CVMValue type system.