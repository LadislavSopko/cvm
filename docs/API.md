# CVM Language API Documentation

## Overview

CVM (Cognitive Virtual Machine) is a domain-specific language designed as "rails for AI agents". This document describes all currently implemented language features, built-in functions, and operators.

## Core Functions

### CC(prompt: string) → string
**Status**: ✅ Implemented

Cognitive Call - requests the AI agent to perform a task.

```javascript
let result = CC("List all TypeScript files in the src directory");
```

**Returns**: Always returns a string response from the AI agent.

### console.log(...args: any[]) → void
**Status**: ✅ Implemented

Prints output to the console. Currently only supports single argument.

```javascript
console.log("Hello World");
console.log(myVariable);
```

### JSON.parse(text: string) → any
**Status**: ✅ Implemented (Safe mode)

Parses a JSON string into a JavaScript value.

```javascript
let data = JSON.parse('{"name": "John", "age": 30}');
let array = JSON.parse('["a", "b", "c"]');
```

**Special behavior**: 
- Returns empty array `[]` for invalid JSON (doesn't throw)
- Returns empty array `[]` for non-array JSON values
- **Note**: This safe behavior prevents runtime errors but may need adjustment for object support

## Type Operations

### typeof value → string
**Status**: ✅ Implemented

Returns the type of a value.

```javascript
typeof "hello"    // "string"
typeof 42         // "number"
typeof true       // "boolean"
typeof null       // "null"
typeof undefined  // "undefined"
typeof []         // "object"
```

## Array Operations

### Array literal
**Status**: ✅ Implemented

```javascript
let arr = [1, 2, 3];
let mixed = ["hello", 42, true];
let empty = [];
```

### array[index] (Array access)
**Status**: ✅ Implemented

```javascript
let value = arr[0];  // Get first element
let last = arr[arr.length - 1];  // Get last element
```

**Returns**: Element at index, or `null` if out of bounds.

### array[index] = value (Array assignment)
**Status**: ✅ Implemented

```javascript
arr[0] = "new value";
arr[5] = "sparse array";  // Creates sparse array
```

### array.push(value) → void
**Status**: ✅ Implemented

```javascript
let arr = [];
arr.push("first");
arr.push("second");
```

**Note**: Returns the array (for chaining), but this is consumed by the compiler.

### array.length → number
**Status**: ✅ Implemented

```javascript
let count = arr.length;
```

## Variables and Assignment

### Variable declaration
**Status**: ✅ Implemented

```javascript
let x = 10;
let name = "John";
let items = [];
```

### Assignment
**Status**: ✅ Implemented

```javascript
x = 20;
x = x + 1;
arr[0] = "new";
```

## Operators

### Arithmetic Operators
**Status**: ✅ Implemented (except modulo)

- `+` Addition (numeric)
- `-` Subtraction  
- `*` Multiplication
- `/` Division
- `%` Modulo - **❌ Not Implemented**

```javascript
let sum = 10 + 20;      // 30
let diff = 20 - 5;      // 15
let product = 3 * 4;    // 12
let quotient = 10 / 2;  // 5
let remainder = 10 % 3; // Would be 1, but NOT SUPPORTED YET
```

**Type coercion**: Strings are converted to numbers when possible.

### String Concatenation
**Status**: ✅ Implemented

The `+` operator concatenates when at least one operand is a string literal.

```javascript
let greeting = "Hello " + "World";
let message = "Count: " + 42;
```

### Comparison Operators
**Status**: ✅ All Implemented

- `==` Equality (with type coercion)
- `!=` Inequality (with type coercion)
- `<` Less than
- `>` Greater than

```javascript
5 == "5"        // true (type coercion)
5 != "6"        // true
10 < 20         // true
"7" > 5         // true (string converted to number)
```

**Note**: No `<=`, `>=`, `===`, or `!==` operators yet.

## Control Flow

### if/else statements
**Status**: ✅ Implemented

```javascript
if (x > 10) {
  console.log("x is greater than 10");
} else if (x > 5) {
  console.log("x is greater than 5");
} else {
  console.log("x is 5 or less");
}
```

### while loops
**Status**: ✅ Implemented

```javascript
let i = 0;
while (i < 10) {
  console.log("Count: " + i);
  i = i + 1;
}
```

### for loops
**Status**: ❌ Not Implemented (Phase 3)

### break/continue
**Status**: ❌ Not Implemented (Opcodes exist, compiler support missing)

## Type System

CVM supports the following types:
- **string**: Text values
- **number**: Numeric values (integers and floats)
- **boolean**: `true` or `false`
- **null**: The `null` value
- **undefined**: Uninitialized variables
- **array**: Ordered collections (internally objects with type "array")

## Implementation Status

### ✅ Fully Working (VM + Compiler):
- Basic types: string, number, boolean, null
- Variables and assignments
- Arrays (literals, access, push, length, assignment)
- Arithmetic operators (+, -, *, /)
- Comparison operators (==, !=, <, >)
- String concatenation
- if/else statements
- while loops
- Type checking (typeof)
- CC() cognitive calls
- console.log() output
- JSON.parse() (safe mode)

### 🔧 VM Ready, Awaiting Compiler Support:
1. **for-of loops** - ITER_START, ITER_NEXT, ITER_END opcodes fully implemented and tested
2. **break/continue** - BREAK, CONTINUE opcodes defined but not compiled
3. **Logical operators** - AND, OR, NOT opcodes defined
4. **Function calls** - CALL, RETURN opcodes defined
5. **Additional jumps** - JUMP_IF, JUMP_IF_TRUE opcodes available

### ❌ Not Implemented:
1. **Modulo operator** - % for remainder operation
2. **File operations** - FS_LIST_FILES opcode defined but no VM implementation
3. **Objects** - No object literal or property access support
4. **Function definitions** - Only main() is supported
5. **Function parameters** - No parameter passing
6. **Return statements** - No return from main()
7. **for loops** - No traditional for(;;) loops
8. **Comparison operators** - No <=, >=
9. **Strict equality** - No ===, !==
10. **Error handling** - No try/catch/throw

## Error Handling

Currently, errors in CVM result in VM halting with an error state. There is no try/catch mechanism.

### JSON.parse Safety
Unlike standard JavaScript, `JSON.parse()` in CVM:
- Never throws exceptions
- Returns empty array `[]` for invalid JSON
- Returns empty array `[]` for non-array JSON values

## Examples

### Basic Program Structure
```javascript
function main() {
  console.log("Hello CVM!");
}
main();
```

### Working with CC and Arrays
```javascript
function main() {
  let prompt = "List 3 popular programming languages as a JSON array";
  let response = CC(prompt);
  let languages = JSON.parse(response);
  
  if (languages.length > 0) {
    console.log("First language: " + languages[0]);
  }
}
main();
```

### Control Flow Example
```javascript
function main() {
  let count = 0;
  while (count < 3) {
    let fact = CC("Tell me an interesting fact about the number " + count);
    console.log(fact);
    count = count + 1;
  }
}
main();
```

## Test Coverage

The implementation has comprehensive test coverage:
- **212 total tests passing** across all packages
- **38 iterator tests** validating ITER_START, ITER_NEXT, ITER_END
- **Arithmetic E2E tests** confirming numeric operations work correctly
- **Control flow tests** for if/else and while loops
- **Integration tests** with MongoDB storage

## Next Development Phases

### Phase 3 (Current): Iteration
- Add for-of loop compiler support (VM already ready)
- Enable: `for (const item of array) { ... }`
- Possibly add break/continue support

### Phase 4: Return Values
- Implement return statements from main()
- Enable programs to produce final results
- Modify VM to capture return value

### Phase 5: Functions
- Add function definitions beyond main()
- Enable code reusability and organization
- Implement CALL/RETURN opcodes in VM