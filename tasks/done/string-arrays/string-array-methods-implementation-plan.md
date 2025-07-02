# Practical String & Array Methods Implementation Plan

## Overview
Implementation of string and array methods that work within CVM's current architecture (no callback support).

## String Methods to Implement (7 + 6 = 13 total)

### Already Implemented ✅
- charAt, indexOf, substring, slice, split, toUpperCase, toLowerCase, length (property)

### To Implement 🔴
1. **string.includes(searchString)** - Check if string contains substring
2. **string.endsWith(searchString)** - Check if string ends with substring
3. **string.startsWith(searchString)** - Check if string starts with substring
4. **string.trim()** - Remove whitespace from both ends
5. **string.trimStart()** - Remove whitespace from start only
6. **string.trimEnd()** - Remove whitespace from end only
7. **string.replace(search, replacement)** - Replace first occurrence
8. **string.replaceAll(search, replacement)** - Replace all occurrences
9. **string.lastIndexOf(searchString)** - Find last occurrence of substring
10. **string.repeat(count)** - Repeat string N times
11. **string.padStart(targetLength, padString)** - Pad string from start
12. **string.padEnd(targetLength, padString)** - Pad string from end

## Array Methods to Implement (3 total)

### Already Implemented ✅
- push, length, access

### To Implement 🔴
1. **array.slice(start, end)** - Extract portion of array
2. **array.join(separator)** - Convert array to string with separator
3. **array.indexOf(searchElement)** - Find index of element

### NOT Implementing (Need Callbacks)
- ❌ filter() - Requires predicate function
- ❌ map() - Requires transform function
- ❌ forEach() - Requires callback function
- ❌ find() - Requires predicate function
- ❌ reduce() - Requires reducer function

## Implementation Details

### String Methods

#### 1. string.includes()
```typescript
// Opcode
STRING_INCLUDES = 'STRING_INCLUDES',

// Handler
[OpCode.STRING_INCLUDES]: {
  stackIn: 2,  // string, searchString
  stackOut: 1, // boolean
  execute: (state, instruction) => {
    const searchString = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_INCLUDES requires a string' };
    }
    
    const search = String(searchString);
    state.stack.push(str.includes(search));
    return undefined;
  }
}
```

#### 2. string.endsWith()
```typescript
// Opcode
STRING_ENDS_WITH = 'STRING_ENDS_WITH',

// Handler
[OpCode.STRING_ENDS_WITH]: {
  stackIn: 2,
  stackOut: 1,
  execute: (state, instruction) => {
    const searchString = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_ENDS_WITH requires a string' };
    }
    
    const search = String(searchString);
    state.stack.push(str.endsWith(search));
    return undefined;
  }
}
```

#### 3. string.startsWith()
```typescript
// Opcode
STRING_STARTS_WITH = 'STRING_STARTS_WITH',

// Handler
[OpCode.STRING_STARTS_WITH]: {
  stackIn: 2,
  stackOut: 1,
  execute: (state, instruction) => {
    const searchString = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_STARTS_WITH requires a string' };
    }
    
    const search = String(searchString);
    state.stack.push(str.startsWith(search));
    return undefined;
  }
}
```

#### 4. string.trim()
```typescript
// Opcode
STRING_TRIM = 'STRING_TRIM',

// Handler
[OpCode.STRING_TRIM]: {
  stackIn: 1,
  stackOut: 1,
  execute: (state, instruction) => {
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_TRIM requires a string' };
    }
    
    state.stack.push(str.trim());
    return undefined;
  }
}
```

#### 5. string.replace() - FIRST occurrence only
```typescript
// Opcode
STRING_REPLACE = 'STRING_REPLACE',

// Handler
[OpCode.STRING_REPLACE]: {
  stackIn: 3,  // string, search, replacement
  stackOut: 1,
  execute: (state, instruction) => {
    const replacement = state.stack.pop()!;
    const search = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_REPLACE requires a string' };
    }
    
    const searchStr = String(search);
    const replaceStr = String(replacement);
    
    // Replace FIRST occurrence only
    const index = str.indexOf(searchStr);
    const result = index === -1 ? str : 
      str.substring(0, index) + replaceStr + str.substring(index + searchStr.length);
    
    state.stack.push(result);
    return undefined;
  }
}
```

#### 6. string.replaceAll()
```typescript
// Opcode
STRING_REPLACE_ALL = 'STRING_REPLACE_ALL',

// Handler
[OpCode.STRING_REPLACE_ALL]: {
  stackIn: 3,
  stackOut: 1,
  execute: (state, instruction) => {
    const replacement = state.stack.pop()!;
    const search = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_REPLACE_ALL requires a string' };
    }
    
    const searchStr = String(search);
    const replaceStr = String(replacement);
    
    // Replace ALL occurrences using split/join
    const result = str.split(searchStr).join(replaceStr);
    
    state.stack.push(result);
    return undefined;
  }
}
```

#### 7. string.trimStart() / trimEnd()
```typescript
// Opcodes
STRING_TRIM_START = 'STRING_TRIM_START',
STRING_TRIM_END = 'STRING_TRIM_END',

// Handlers
[OpCode.STRING_TRIM_START]: {
  stackIn: 1,
  stackOut: 1,
  execute: (state, instruction) => {
    const str = state.stack.pop()!;
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_TRIM_START requires a string' };
    }
    state.stack.push(str.trimStart());
    return undefined;
  }
}

[OpCode.STRING_TRIM_END]: {
  stackIn: 1,
  stackOut: 1,
  execute: (state, instruction) => {
    const str = state.stack.pop()!;
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_TRIM_END requires a string' };
    }
    state.stack.push(str.trimEnd());
    return undefined;
  }
}
```

#### 8. string.lastIndexOf()
```typescript
// Opcode
STRING_LAST_INDEX_OF = 'STRING_LAST_INDEX_OF',

// Handler
[OpCode.STRING_LAST_INDEX_OF]: {
  stackIn: 2,
  stackOut: 1,
  execute: (state, instruction) => {
    const searchString = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_LAST_INDEX_OF requires a string' };
    }
    
    const search = String(searchString);
    state.stack.push(str.lastIndexOf(search));
    return undefined;
  }
}
```

#### 9. string.repeat()
```typescript
// Opcode
STRING_REPEAT = 'STRING_REPEAT',

// Handler
[OpCode.STRING_REPEAT]: {
  stackIn: 2,
  stackOut: 1,
  execute: (state, instruction) => {
    const count = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_REPEAT requires a string' };
    }
    
    if (!isCVMNumber(count) || count < 0) {
      return { type: 'RuntimeError', message: 'STRING_REPEAT requires non-negative number' };
    }
    
    state.stack.push(str.repeat(Math.floor(count)));
    return undefined;
  }
}
```

#### 10. string.padStart() / padEnd()
```typescript
// Opcodes
STRING_PAD_START = 'STRING_PAD_START',
STRING_PAD_END = 'STRING_PAD_END',

// Handlers
[OpCode.STRING_PAD_START]: {
  stackIn: 3,  // string, targetLength, padString
  stackOut: 1,
  execute: (state, instruction) => {
    const padString = state.stack.pop()!;
    const targetLength = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_PAD_START requires a string' };
    }
    
    if (!isCVMNumber(targetLength)) {
      return { type: 'RuntimeError', message: 'STRING_PAD_START requires number for length' };
    }
    
    const pad = isCVMString(padString) ? padString : String(padString);
    state.stack.push(str.padStart(targetLength, pad || ' '));
    return undefined;
  }
}

[OpCode.STRING_PAD_END]: {
  stackIn: 3,
  stackOut: 1,
  execute: (state, instruction) => {
    const padString = state.stack.pop()!;
    const targetLength = state.stack.pop()!;
    const str = state.stack.pop()!;
    
    if (!isCVMString(str)) {
      return { type: 'RuntimeError', message: 'STRING_PAD_END requires a string' };
    }
    
    if (!isCVMNumber(targetLength)) {
      return { type: 'RuntimeError', message: 'STRING_PAD_END requires number for length' };
    }
    
    const pad = isCVMString(padString) ? padString : String(padString);
    state.stack.push(str.padEnd(targetLength, pad || ' '));
    return undefined;
  }
}
```

### Array Methods

#### 1. array.slice()
```typescript
// Opcode
ARRAY_SLICE = 'ARRAY_SLICE',

// Handler
[OpCode.ARRAY_SLICE]: {
  stackIn: 3,  // array, start, end
  stackOut: 1,
  execute: (state, instruction) => {
    const end = state.stack.pop()!;
    const start = state.stack.pop()!;
    const arrayRef = state.stack.pop()!;
    
    if (!isArrayReference(arrayRef, state)) {
      return { type: 'RuntimeError', message: 'ARRAY_SLICE requires an array' };
    }
    
    const array = state.heap.get(arrayRef) as CVMArray;
    const startIdx = isCVMNumber(start) ? start : 0;
    const endIdx = end === undefined ? array.elements.length : 
                   isCVMNumber(end) ? end : array.elements.length;
    
    // Handle negative indices
    const normalizedStart = startIdx < 0 ? 
      Math.max(0, array.elements.length + startIdx) : startIdx;
    const normalizedEnd = endIdx < 0 ? 
      Math.max(0, array.elements.length + endIdx) : endIdx;
    
    const slicedElements = array.elements.slice(normalizedStart, normalizedEnd);
    const newArrayRef = state.heap.allocate({
      type: 'array',
      elements: slicedElements
    });
    
    state.stack.push(newArrayRef);
    return undefined;
  }
}
```

#### 2. array.join()
```typescript
// Opcode
ARRAY_JOIN = 'ARRAY_JOIN',

// Handler
[OpCode.ARRAY_JOIN]: {
  stackIn: 2,  // array, separator
  stackOut: 1, // string
  execute: (state, instruction) => {
    const separator = state.stack.pop()!;
    const arrayRef = state.stack.pop()!;
    
    if (!isArrayReference(arrayRef, state)) {
      return { type: 'RuntimeError', message: 'ARRAY_JOIN requires an array' };
    }
    
    const array = state.heap.get(arrayRef) as CVMArray;
    const sep = isCVMString(separator) ? separator : String(separator);
    
    // Convert all elements to strings
    const stringElements = array.elements.map(el => {
      if (el === null) return 'null';
      if (el === undefined) return 'undefined';
      return String(el);
    });
    
    const result = stringElements.join(sep);
    state.stack.push(result);
    return undefined;
  }
}
```

#### 3. array.indexOf()
```typescript
// Opcode
ARRAY_INDEX_OF = 'ARRAY_INDEX_OF',

// Handler
[OpCode.ARRAY_INDEX_OF]: {
  stackIn: 2,  // array, searchElement
  stackOut: 1, // number (index or -1)
  execute: (state, instruction) => {
    const searchElement = state.stack.pop()!;
    const arrayRef = state.stack.pop()!;
    
    if (!isArrayReference(arrayRef, state)) {
      return { type: 'RuntimeError', message: 'ARRAY_INDEX_OF requires an array' };
    }
    
    const array = state.heap.get(arrayRef) as CVMArray;
    
    // Find index using strict equality
    for (let i = 0; i < array.elements.length; i++) {
      if (array.elements[i] === searchElement) {
        state.stack.push(i);
        return undefined;
      }
    }
    
    state.stack.push(-1); // Not found
    return undefined;
  }
}
```

## Compiler Support Updates

```typescript
// In call-expression.ts

// String methods
else if (methodName === 'includes') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_INCLUDES);
}
else if (methodName === 'endsWith') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_ENDS_WITH);
}
else if (methodName === 'startsWith') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_STARTS_WITH);
}
else if (methodName === 'trim') {
  compileExpression(node.expression.expression, state);
  state.emit(OpCode.STRING_TRIM);
}
else if (methodName === 'replace') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  compileExpression(node.arguments[1] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_REPLACE);
}

// Array methods
else if (methodName === 'slice') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: 0 }, state);
  if (node.arguments.length > 1) {
    compileExpression(node.arguments[1], state);
  } else {
    state.emit(OpCode.PUSH_UNDEFINED);
  }
  state.emit(OpCode.ARRAY_SLICE);
}
else if (methodName === 'join') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: ',' }, state);
  state.emit(OpCode.ARRAY_JOIN);
}
else if (methodName === 'indexOf') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: undefined }, state);
  state.emit(OpCode.ARRAY_INDEX_OF);
}
```

## Complete Opcode List to Add

```typescript
// In bytecode.ts - Add these 15 opcodes
export enum OpCode {
  // ... existing opcodes ...
  
  // String methods (12 new)
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
  
  // Array methods (3 new)
  ARRAY_SLICE = 'ARRAY_SLICE',
  ARRAY_JOIN = 'ARRAY_JOIN',
  ARRAY_INDEX_OF = 'ARRAY_INDEX_OF',
}
```

## Extended Compiler Support

```typescript
// Additional string method compilations
else if (methodName === 'trimStart') {
  compileExpression(node.expression.expression, state);
  state.emit(OpCode.STRING_TRIM_START);
}
else if (methodName === 'trimEnd') {
  compileExpression(node.expression.expression, state);
  state.emit(OpCode.STRING_TRIM_END);
}
else if (methodName === 'replaceAll') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  compileExpression(node.arguments[1] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_REPLACE_ALL);
}
else if (methodName === 'lastIndexOf') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: '' }, state);
  state.emit(OpCode.STRING_LAST_INDEX_OF);
}
else if (methodName === 'repeat') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: 0 }, state);
  state.emit(OpCode.STRING_REPEAT);
}
else if (methodName === 'padStart') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: 0 }, state);
  compileExpression(node.arguments[1] || { type: 'Literal', value: ' ' }, state);
  state.emit(OpCode.STRING_PAD_START);
}
else if (methodName === 'padEnd') {
  compileExpression(node.expression.expression, state);
  compileExpression(node.arguments[0] || { type: 'Literal', value: 0 }, state);
  compileExpression(node.arguments[1] || { type: 'Literal', value: ' ' }, state);
  state.emit(OpCode.STRING_PAD_END);
}
```

## Comprehensive Test Example
```typescript
function main() {
  // Basic string checks
  const path = "/home/user/test/file.backup.ts";
  
  if (path.endsWith(".ts")) {
    console.log("TypeScript file detected");
  }
  
  if (path.startsWith("/home")) {
    console.log("Home directory file");
  }
  
  if (path.includes("test")) {
    console.log("Test file detected");
  }
  
  // Find file extension
  const lastDot = path.lastIndexOf(".");
  const extension = path.substring(lastDot);
  console.log("Extension: " + extension);
  
  // Clean user input
  const userInput = CC("Enter file name:");
  const cleanInput = userInput.trim();
  const cleanStart = userInput.trimStart();
  const cleanEnd = userInput.trimEnd();
  
  // Path normalization
  const normalized = path.replace("/home/user", "~");
  const fullyNormalized = path.replaceAll("/", "\\");
  
  // Formatting output
  const separator = "=".repeat(50);
  console.log(separator);
  
  // Table formatting
  const col1 = "Name".padEnd(20, " ");
  const col2 = "Size".padStart(10, " ");
  const col3 = "Type".padEnd(15, ".");
  console.log(col1 + col2 + col3);
  
  // Number formatting
  const num = "42";
  const formatted = num.padStart(5, "0"); // "00042"
  
  // Array operations
  const files = ["main.ts", "test.ts", "README.md", "package.json"];
  
  // Process in batches
  const batch1 = files.slice(0, 2);
  const batch2 = files.slice(2);
  
  // Create reports
  const csv = files.join(",");
  const report = files.join("\n");
  const numbered = files.join("\n  - ");
  
  // Find position
  const readmeIndex = files.indexOf("README.md");
  console.log("README at position: " + readmeIndex);
  
  return "All string/array methods tested";
}
```

## Implementation Order

1. **Phase 1**: String checking methods (includes, endsWith, startsWith)
2. **Phase 2**: String manipulation (trim, replace)
3. **Phase 3**: Array methods (slice, join, indexOf)

## Files to Modify

1. `/packages/parser/src/lib/bytecode.ts` - Add 8 opcodes
2. `/packages/vm/src/lib/handlers/advanced.ts` - Add 5 string handlers
3. `/packages/vm/src/lib/handlers/arrays.ts` - Add 3 array handlers
4. `/packages/parser/src/lib/compiler/expressions/call-expression.ts` - Add 8 method compilations
5. Create test files for each method group