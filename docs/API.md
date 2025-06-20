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
typeof []         // "array"
```

**Note**: typeof returns "array" for arrays (not "object")

## String Operations

### string.length → number
**Status**: ✅ Implemented

Returns the length of a string.

```javascript
let name = "John Doe";
let len = name.length;  // 8

"hello".length         // 5
"".length             // 0
CC("Enter password").length  // Gets length of user input
```

### string.substring(start[, end]) → string
**Status**: ✅ Implemented

Extracts a section of a string between start and end indices.

```javascript
let str = "Hello, World!";
str.substring(7, 12);     // "World"
str.substring(7);         // "World!"
str.substring(-3, -1);    // "ld" (negative indices supported)
```

**Special behaviors**:
- Negative indices count from the end
- If end is omitted, extracts to the end of the string
- If start > end, they are swapped

### string.indexOf(searchString) → number
**Status**: ✅ Implemented

Returns the index of the first occurrence of searchString, or -1 if not found.

```javascript
let str = "Hello, World!";
str.indexOf("World");     // 7
str.indexOf("xyz");       // -1
str.indexOf("");          // 0 (empty string always found at start)
```

### string.split(delimiter) → array
**Status**: ✅ Implemented

Splits a string into an array of substrings.

```javascript
"apple,banana,cherry".split(",");    // ["apple", "banana", "cherry"]
"Hello".split("");                   // ["H", "e", "l", "l", "o"]
"a,,b".split(",");                   // ["a", "", "b"]
"no-delimiter".split(",");           // ["no-delimiter"]
```

**Special behaviors**:
- Empty delimiter splits into individual characters
- Consecutive delimiters create empty strings in the result

### string.slice(start[, end]) → string
**Status**: ✅ Implemented

Extracts a section of the string and returns it as a new string.

```javascript
"hello world".slice(6);          // "world"
"hello world".slice(0, 5);       // "hello"
"hello world".slice(-5);         // "world" (negative index from end)
"hello world".slice(-5, -1);     // "worl"
"hello".slice(10);               // "" (out of bounds)
```

**Special behaviors**:
- Negative indices count from the end of the string
- If end is omitted, extracts to the end of the string
- Returns empty string if start is beyond string length

### string.charAt(index) → string
**Status**: ✅ Implemented

Returns the character at the specified index.

```javascript
"hello".charAt(0);    // "h"
"hello".charAt(1);    // "e"
"hello".charAt(10);   // "" (out of bounds)
"hello".charAt(-1);   // "" (negative index returns empty)
```

**Special behaviors**:
- Returns empty string for out-of-bounds indices
- Negative indices return empty string (unlike slice)

### string.toUpperCase() → string
**Status**: ✅ Implemented

Returns the string converted to uppercase.

```javascript
"hello world".toUpperCase();     // "HELLO WORLD"
"Hello123!".toUpperCase();       // "HELLO123!"
"".toUpperCase();                // ""
```

### string.toLowerCase() → string
**Status**: ✅ Implemented

Returns the string converted to lowercase.

```javascript
"HELLO WORLD".toLowerCase();     // "hello world"
"Hello123!".toLowerCase();       // "hello123!"
"".toLowerCase();                // ""
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
**Status**: ✅ All Implemented

- `+` Addition (numeric)
- `-` Subtraction  
- `*` Multiplication
- `/` Division
- `%` Modulo

```javascript
let sum = 10 + 20;      // 30
let diff = 20 - 5;      // 15
let product = 3 * 4;    // 12
let quotient = 10 / 2;  // 5
let remainder = 10 % 3; // 1
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
- `<=` Less than or equal
- `>=` Greater than or equal
- `===` Strict equality (no type coercion)
- `!==` Strict inequality (no type coercion)

```javascript
5 == "5"        // true (type coercion)
5 === "5"       // false (no type coercion)
5 != "6"        // true
5 !== "5"       // true (different types)
10 < 20         // true
10 <= 10        // true
20 > 10         // true
20 >= 20        // true
```

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

### for-of loops
**Status**: ✅ Implemented

Iterate over arrays with for-of syntax.

```javascript
for (const item of [1, 2, 3]) {
  console.log("Item: " + item);
}

// With variables
const arr = ["a", "b", "c"];
for (const element of arr) {
  console.log(element);
}

// Nested loops work
for (const i of [1, 2]) {
  for (const j of ["a", "b"]) {
    console.log(i + "-" + j);  // "1-a", "1-b", "2-a", "2-b"
  }
}
```

**Features**:
- Supports `const` and `let` declarations
- Supports simple identifiers
- Nested for-of loops supported
- Works with array literals and variables
- Safe iteration (array snapshots prevent corruption)

### break/continue
**Status**: ✅ Implemented

Control loop execution with break and continue statements.

```javascript
// break exits the loop
for (const item of [1, 2, 3, 4, 5]) {
  if (item === 3) {
    break;
  }
  console.log(item);  // Prints: 1, 2
}

// continue skips to next iteration
for (const item of [1, 2, 3, 4, 5]) {
  if (item % 2 === 0) {
    continue;
  }
  console.log(item);  // Prints: 1, 3, 5
}

// Works in while loops too
let i = 0;
while (i < 10) {
  i++;
  if (i === 5) continue;
  if (i === 8) break;
  console.log(i);
}
```

### return statements
**Status**: ✅ Implemented

Returns a value from main() which becomes the program's result.

```javascript
function main() {
  return 42;  // Program result will be 42
}

function main() {
  return;  // Program result will be null
}
```

**Note**: Only works in main(). Other functions are not yet supported.

## Logical Operators

### AND (&&)
**Status**: ✅ Implemented

Returns the first falsy value or the last value if all are truthy.

```javascript
true && true        // true
true && false       // false
"hello" && 42       // 42
0 && "world"        // 0
```

### OR (||)
**Status**: ✅ Implemented

Returns the first truthy value or the last value if all are falsy.

```javascript
true || false       // true
false || false      // false
"hello" || "world"  // "hello"
0 || "fallback"     // "fallback"
```

### NOT (!)
**Status**: ✅ Implemented

Converts value to boolean and negates it.

```javascript
!true              // false
!false             // true
!"hello"           // false
!0                 // true
!null              // true
!!42               // true (double negation)
```

## Unary Operators

### Pre/Post Increment (++)
**Status**: ✅ Implemented

```javascript
let x = 5;
let a = ++x;  // Pre-increment: x becomes 6, a = 6
let b = x++;  // Post-increment: b = 6, x becomes 7
```

### Pre/Post Decrement (--)
**Status**: ✅ Implemented

```javascript
let y = 10;
let c = --y;  // Pre-decrement: y becomes 9, c = 9
let d = y--;  // Post-decrement: d = 9, y becomes 8
```

### Unary Minus (-)
**Status**: ✅ Implemented

Negates a numeric value.

```javascript
let num = 42;
let negative = -num;  // -42
let positive = -(-5); // 5
```

### Unary Plus (+)
**Status**: ✅ Implemented

Converts value to number (JavaScript-like type conversion).

```javascript
let str = "42";
let num = +str;    // 42 (number)
let zero = +"";    // 0 (empty string becomes 0)
let nan = +"abc";  // NaN for invalid strings
```

## Compound Assignment Operators

### Addition Assignment (+=)
**Status**: ✅ Implemented

```javascript
let x = 10;
x += 5;  // x = 15 (equivalent to x = x + 5)

// String concatenation
let msg = "Hello";
msg += " World";  // msg = "Hello World"
```

### Other Compound Assignments
**Status**: ✅ Implemented

```javascript
let x = 20;
x -= 5;   // x = 15 (subtraction)
x *= 2;   // x = 30 (multiplication)
x /= 3;   // x = 10 (division)
x %= 3;   // x = 1  (modulo)

// Works with complex expressions
let y = 10;
y += x * 2;  // y = 12
```

**Implementation notes**:
- All compound assignments are compiler transformations (no new VM opcodes)
- `+=` intelligently uses CONCAT for string literals, ADD for numeric operations
- Supports complex right-hand expressions

## Conditional Operator (Ternary)

### condition ? trueValue : falseValue
**Status**: ✅ Implemented

Evaluates to trueValue if condition is truthy, otherwise falseValue.

```javascript
const age = 25;
const status = age >= 18 ? "adult" : "minor";  // "adult"

const score = 85;
const grade = score >= 90 ? "A" : score >= 80 ? "B" : "C";  // "B"

const message = "Value is " + (x > 5 ? "high" : "low");
```

## Type System

CVM supports the following types:
- **string**: Text values
- **number**: Numeric values (integers and floats)
- **boolean**: `true` or `false`
- **null**: The `null` value
- **undefined**: The undefined value (uninitialized variables return undefined)
- **array**: Ordered collections (internally objects with type "array")

## Implementation Status

### ✅ Fully Working (VM + Compiler):
- Basic types: string, number, boolean, null, undefined
- Variables and assignments
- Arrays (literals, access, push, length, assignment)
- All arithmetic operators (+, -, *, /, %)
- All comparison operators (==, !=, <, >, <=, >=, ===, !==)
- All logical operators (&&, ||, !)
- All unary operators (++, --, unary -, unary +)
- All compound assignment operators (+=, -=, *=, /=, %=)
- Ternary operator (? :)
- String concatenation
- String operations:
  - string.length
  - string.substring(start[, end])
  - string.indexOf(search)
  - string.split(delimiter)
- Array length (array.length)
- if/else statements
- while loops
- **for-of loops** - Complete iteration support with array snapshots
- **break/continue** - Full support in all loop types
- return statements (from main() only)
- Type checking (typeof)
- CC() cognitive calls
- console.log() output
- JSON.parse() (safe mode)

### 🔧 VM Ready, Awaiting Compiler Support:
1. **Function calls** - CALL, RETURN opcodes defined
2. **Additional jumps** - JUMP_IF, JUMP_IF_TRUE opcodes available

### ❌ Not Implemented:
1. **File operations** - FS_LIST_FILES opcode defined but no VM implementation
2. **Objects** - No object literal or property access support
3. **Function definitions** - Only main() is supported
4. **Function parameters** - No parameter passing
5. **for loops** - No traditional for(;;) loops
6. **Error handling** - No try/catch/throw
7. **Additional string methods** - No slice, charAt, toUpperCase, toLowerCase, etc.

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

### Logical Operators Example
```javascript
function main() {
  let age = 25;
  let hasLicense = true;
  
  if (age >= 18 && hasLicense) {
    console.log("You can drive");
  }
  
  let name = "";
  let displayName = name || "Anonymous";
  console.log("Hello " + displayName);
  
  let isLoggedIn = !false;
  if (isLoggedIn) {
    console.log("Welcome back!");
  }
}
main();
```

## Test Coverage

The implementation has comprehensive test coverage:
- **390 total tests passing** across all packages
- **38 iterator tests** validating ITER_START, ITER_NEXT, ITER_END
- **23 new operator tests** for %, <=, >=, ===, !==
- **24 logical operator tests** for VM implementation of &&, ||, !
- **16 compiler tests** for logical operator compilation
- **19 string method tests** for substring, indexOf, split
- **9 undefined type tests** for JavaScript undefined semantics
- **9 ternary operator tests** (5 compiler, 4 VM)
- **6 integration tests** for logical operators E2E
- **Arithmetic E2E tests** confirming numeric operations work correctly
- **Control flow tests** for if/else and while loops
- **Integration tests** with MongoDB storage

## Next Development Phases

### Phase 3: Iteration ✅ COMPLETE
- ✅ for-of loop support: `for (const item of array) { ... }`
- ✅ break/continue support in all loops
- ✅ Nested loop support with iterator stack

### Phase 4: File Operations
- Implement FS_LIST_FILES opcode in VM
- Add compiler support for file operations
- Implement path sandboxing for security

### Phase 5: Functions
- Add function definitions beyond main()
- Enable code reusability and organization
- Implement CALL/RETURN opcodes in VM