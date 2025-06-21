# CVM Object Support Implementation Plan

## Executive Summary

Adding object support to CVM is critical for real-world usage. Without it, CVM cannot handle structured data collection, making it impractical for most tasks. This plan outlines a minimal but complete implementation.

## Current Limitations

1. **No object literals**: Can't create `{ key: value }`
2. **No property access**: Can't read/write `obj.prop` or `obj['prop']`
3. **Broken JSON.parse**: Returns empty array for objects
4. **No JSON.stringify**: Can't serialize data structures
5. **Limited data aggregation**: Must use string concatenation workarounds

## Design Decisions

### 1. Mutable Objects
Objects will be **mutable** to match JavaScript semantics and array behavior. This enables natural patterns like:
```typescript
const result = {};
result.file = filename;
result.summary = content;
```

### 2. Map-based Storage
Use `Map<string, CVMValue>` for properties instead of plain objects:
- Better performance for dynamic property access
- Cleaner iteration
- Avoids prototype pollution issues

### 3. Minimal Feature Set
Phase 1 focuses on data objects only:
- ✅ Object literals
- ✅ Property get/set (dot and bracket notation)
- ✅ JSON.parse/stringify
- ❌ Methods (future)
- ❌ Prototypes (future)
- ❌ Constructor functions (future)

## Implementation Steps

### Step 1: Type System Updates

**File**: `packages/types/src/lib/cvm-value.ts`

```typescript
// Add new interface
export interface CVMObject {
  type: 'object';
  properties: Map<string, CVMValue>;
}

// Update union type
export type CVMValue = string | boolean | number | CVMArray | CVMObject | null | CVMUndefined;

// Add type guard
export function isCVMObject(value: CVMValue): value is CVMObject {
  return value !== null &&
         typeof value === 'object' &&
         'type' in value &&
         value.type === 'object';
}

// Add creation helper
export function createCVMObject(properties: Map<string, CVMValue> = new Map()): CVMObject {
  return { type: 'object', properties };
}

// Update helpers
// cvmToString: return '[object Object]'
// cvmTypeof: return 'object'
// cvmToBoolean: return true
```

### Step 2: Bytecode Opcodes

**File**: `packages/parser/src/lib/bytecode.ts`

```typescript
// Object operations
OBJECT_CREATE = 'OBJECT_CREATE',    // [] -> [object]
PROPERTY_GET = 'PROPERTY_GET',      // [obj, key] -> [value]
PROPERTY_SET = 'PROPERTY_SET',      // [obj, key, value] -> [obj]
JSON_STRINGIFY = 'JSON_STRINGIFY',  // [value] -> [string]
```

### Step 3: Compiler Updates

#### 3.1 Object Literals

**New file**: `packages/parser/src/lib/compiler/expressions/object-literal.ts`

```typescript
// Compile { a: 1, b: 2 } to:
// OBJECT_CREATE
// PUSH 1
// PUSH "a"
// PROPERTY_SET
// PUSH 2
// PUSH "b"
// PROPERTY_SET
```

#### 3.2 Property Access

**New file**: `packages/parser/src/lib/compiler/expressions/property-access.ts`

```typescript
// For obj.prop (read):
// <compile obj>
// PUSH "prop"
// PROPERTY_GET

// For obj.prop = value (write):
// <compile obj>
// PUSH "prop"
// <compile value>
// PROPERTY_SET
```

#### 3.3 JSON.stringify

**Update**: `packages/parser/src/lib/compiler/expressions/call-expression.ts`

Add handler for `JSON.stringify` similar to `JSON.parse`.

### Step 4: VM Handlers

**New file**: `packages/vm/src/lib/handlers/objects.ts`

```typescript
export const objectHandlers: Partial<Record<OpCode, OpcodeHandler>> = {
  [OpCode.OBJECT_CREATE]: {
    stackIn: 0,
    stackOut: 1,
    execute: (state) => {
      state.stack.push(createCVMObject());
      return undefined;
    }
  },

  [OpCode.PROPERTY_SET]: {
    stackIn: 3,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      const key = state.stack.pop()!;
      const obj = state.stack.pop()!;
      
      if (!isCVMObject(obj)) {
        return {
          type: 'RuntimeError',
          message: `Cannot set property '${key}' on ${cvmTypeof(obj)}`,
          pc: state.pc,
          opcode: OpCode.PROPERTY_SET
        };
      }
      
      if (!isCVMString(key)) {
        return {
          type: 'RuntimeError',
          message: 'Property key must be a string',
          pc: state.pc,
          opcode: OpCode.PROPERTY_SET
        };
      }
      
      obj.properties.set(key, value);
      state.stack.push(obj); // Return object for chaining
      return undefined;
    }
  },

  [OpCode.PROPERTY_GET]: {
    stackIn: 2,
    stackOut: 1,
    execute: (state) => {
      const key = state.stack.pop()!;
      const obj = state.stack.pop()!;
      
      if (isCVMNull(obj) || isCVMUndefined(obj)) {
        return {
          type: 'RuntimeError',
          message: `Cannot read property '${key}' of ${cvmTypeof(obj)}`,
          pc: state.pc,
          opcode: OpCode.PROPERTY_GET
        };
      }
      
      if (!isCVMObject(obj)) {
        // Non-objects return undefined for any property
        state.stack.push(createCVMUndefined());
        return undefined;
      }
      
      const value = obj.properties.get(cvmToString(key));
      state.stack.push(value ?? createCVMUndefined());
      return undefined;
    }
  },

  [OpCode.JSON_STRINGIFY]: {
    stackIn: 1,
    stackOut: 1,
    execute: (state) => {
      const value = state.stack.pop()!;
      const jsValue = cvmValueToJs(value);
      state.stack.push(JSON.stringify(jsValue));
      return undefined;
    }
  }
};
```

### Step 5: Helper Functions

**New utilities needed**:

```typescript
// Convert CVM values to plain JS for JSON.stringify
function cvmValueToJs(value: CVMValue): any {
  if (isCVMArray(value)) {
    return value.elements.map(cvmValueToJs);
  }
  if (isCVMObject(value)) {
    const obj: Record<string, any> = {};
    for (const [k, v] of value.properties) {
      obj[k] = cvmValueToJs(v);
    }
    return obj;
  }
  if (isCVMUndefined(value)) {
    return undefined;
  }
  return value; // primitives
}

// Convert JS values to CVM for JSON.parse
function jsToCvmValue(value: any): CVMValue {
  if (value === null) return null;
  if (value === undefined) return createCVMUndefined();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) {
    return createCVMArray(value.map(jsToCvmValue));
  }
  if (typeof value === 'object') {
    const map = new Map<string, CVMValue>();
    for (const [k, v] of Object.entries(value)) {
      map.set(k, jsToCvmValue(v));
    }
    return createCVMObject(map);
  }
  // Fallback for functions, symbols, etc.
  return createCVMUndefined();
}
```

### Step 6: Fix JSON.parse

Update the JSON_PARSE handler to use `jsToCvmValue` instead of returning empty arrays.

## Testing Strategy

1. **Unit tests** for each new opcode
2. **Integration tests** for object literals, property access
3. **E2E tests** for real-world scenarios:
   ```typescript
   function main() {
     const results = [];
     const files = ["a.txt", "b.txt"];
     
     for (const file of files) {
       const summary = CC("Summarize: " + file);
       const result = { file: file, summary: summary };
       results.push(result);
     }
     
     const json = JSON.stringify(results);
     console.log("Results: " + json);
   }
   ```

## Risk Mitigation

1. **Performance**: Map lookups are O(1) average case
2. **Memory**: Objects share structure with arrays, minimal overhead
3. **Security**: No prototype access prevents pollution
4. **Compatibility**: Follows JavaScript semantics closely

## Success Criteria

After implementation, this should work:
```typescript
function main() {
  const data = { name: "test", count: 42 };
  data.status = "active";
  
  const json = JSON.stringify(data);
  console.log(json); // {"name":"test","count":42,"status":"active"}
  
  const parsed = JSON.parse(json);
  console.log(parsed.name); // "test"
}
```

## Timeline Estimate

- Type system updates: 1 hour
- Compiler changes: 3-4 hours  
- VM handlers: 2-3 hours
- Testing: 2-3 hours
- Total: ~10-12 hours

## Future Enhancements

- Object destructuring
- Spread operator
- Object methods
- `Object.keys()`, `Object.values()`
- Property descriptors
- Getters/setters

This plan provides the minimum viable object support to unblock real-world CVM usage while maintaining architectural integrity.