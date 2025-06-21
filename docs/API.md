# CVM Language API Reference

> 📖 **New to CVM?** Start with the [main README](../README.md) to understand what CVM is and why you'd use it.

## Overview

This document provides complete technical documentation for the CVM language - a TypeScript-like DSL designed for safe AI agent execution. CVM gives you deterministic, observable, and secure programs that eliminate the risks of arbitrary code execution.

**Key Principle**: Instead of letting AI generate dangerous Python/JavaScript, CVM provides a safe, sandboxed instruction set that can only perform operations you explicitly allow.

**Program Structure**: All CVM programs must define a `main()` function:
```javascript
function main() {
  // Your code here
}
// main(); call is optional - main() executes automatically
```

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
**Status**: ✅ Implemented

Parses a JSON string into a JavaScript value, supporting objects, arrays, and primitive types.

```javascript
let data = JSON.parse('{"name": "John", "age": 30}');
let array = JSON.parse('["a", "b", "c"]');
let nested = JSON.parse('{"items": [1, 2, 3], "meta": {"count": 3}}');
```

**Special behavior**: 
- Returns `null` for invalid JSON (doesn't throw)
- Fully supports objects, arrays, and nested structures
- Works seamlessly with CC state persistence

### JSON.stringify(value: any) → string
**Status**: ✅ Implemented

Converts a JavaScript value to a JSON string representation.

```javascript
let obj = { name: "John", age: 30 };
let json = JSON.stringify(obj);  // '{"name":"John","age":30}'

let arr = [1, 2, 3];
let jsonArr = JSON.stringify(arr);  // '[1,2,3]'

// Works with nested structures
let complex = { users: [{ id: 1, name: "Alice" }] };
let jsonComplex = JSON.stringify(complex);
```

**Features**:
- Handles objects, arrays, and primitive types
- Supports nested structures
- Essential for passing objects through CC

### fs.listFiles(path: string, options?: object) → array
**Status**: ✅ Implemented

Lists files and directories at the specified path with optional filtering and recursion.

```javascript
// Basic listing
let files = fs.listFiles("/home/user/docs");

// With options
let tsFiles = fs.listFiles("/src", {
  recursive: true,     // Include subdirectories
  filter: "*.ts"       // Glob pattern filtering
});

// No arguments defaults to current directory
let currentFiles = fs.listFiles();
```

**Options**:
- `recursive: boolean` - If true, lists files in subdirectories recursively
- `filter: string` - Glob pattern to filter files (e.g., "*.js", "test-*", "**/*.md")

**Returns**: Array of absolute file paths as strings:
```javascript
[
  "/home/user/docs/file.txt",
  "/home/user/docs/subdir",
  "/home/user/docs/subdir/nested.js"
]
```

**Security**:
- Sandboxed to paths defined in `CVM_SANDBOX_PATHS` environment variable
- No parent directory traversal allowed
- Symbolic links are not followed
- Returns empty array for unauthorized or non-existent paths

**Note**: Returns string paths for simplicity and to maintain backward compatibility.

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
typeof {}         // "object"
typeof {a: 1}     // "object"
```

**Note**: typeof returns "array" for arrays (not "object") to provide more specific type information

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

### value.toString() → string
**Status**: ✅ Implemented

Returns a string representation of any value.

```javascript
(42).toString()           // "42"
true.toString()          // "true"
"hello".toString()       // "hello"
[1, 2, 3].toString()     // "[array:3]"
({ a: 1 }).toString()    // "[object Object]"
null.toString()          // "null"
undefined.toString()     // "undefined"
```

**Note**: Works on all types, providing a consistent way to convert values to strings.

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
- Safe iteration (array length snapshot prevents infinite loops)
- Array modifications during iteration ARE visible for existing indices

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

## Object Operations

### Object literal
**Status**: ✅ Implemented

Create objects using literal syntax with key-value pairs.

```javascript
// Basic object literal
let person = { name: "John", age: 30 };

// Nested objects
let user = {
  id: 1,
  profile: {
    firstName: "Jane",
    lastName: "Doe"
  }
};

// Empty object
let empty = {};

// Shorthand property syntax
let name = "Alice";
let age = 25;
let user2 = { name, age };  // Same as { name: name, age: age }
```

### object.property (Property access - dot notation)
**Status**: ✅ Implemented

Access object properties using dot notation.

```javascript
let person = { name: "John", age: 30 };
let name = person.name;     // "John"
let age = person.age;       // 30

// Nested access
let data = { user: { email: "test@example.com" } };
let email = data.user.email;  // "test@example.com"
```

**Returns**: Property value, or `undefined` if property doesn't exist.

### object["property"] (Property access - bracket notation)
**Status**: ✅ Implemented

Access object properties using bracket notation with string keys.

```javascript
let person = { name: "John", age: 30 };
let name = person["name"];   // "John"

// Dynamic property access
let key = "age";
let value = person[key];     // 30
```

### object.property = value (Property assignment)
**Status**: ✅ Implemented

Assign values to object properties (creates property if it doesn't exist).

```javascript
let person = { name: "John" };
person.age = 30;           // Add new property
person.name = "Jane";      // Update existing property

// Bracket notation assignment
person["city"] = "New York";

// Nested assignment
let data = { user: {} };
data.user.email = "test@example.com";
```

## Type System

CVM follows JavaScript's type system with some differences:

### Special Behaviors
- `undefined` is represented as a special object type internally
- `typeof` returns 'array' for arrays (not 'object' like JavaScript)
- Division by zero throws a DivisionByZero error (unlike JavaScript which returns Infinity)

### Supported Types
- **string**: Text values
- **number**: Numeric values (integers and floats)
- **boolean**: `true` or `false`
- **null**: The `null` value
- **undefined**: The undefined value (uninitialized variables return undefined)
- **array**: Ordered collections (internally objects with type "array")
- **object**: Key-value collections created with `{}` syntax

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
  - string.slice(start[, end])
  - string.charAt(index)
  - string.toUpperCase()
  - string.toLowerCase()
- Array length (array.length)
- if/else statements
- while loops
- **for-of loops** - Complete iteration support with array snapshots
- **break/continue** - Full support in all loop types
- return statements (from main() only)
- Type checking (typeof)
- CC() cognitive calls
- console.log() output
- JSON.parse() with object support
- JSON.stringify() for objects and arrays
- fs.listFiles() with sandboxing
- **Objects** - Full support including:
  - Object literals with `{}` syntax
  - Property access (dot and bracket notation)
  - Property assignment
  - Shorthand property syntax
  - Nested objects
  - Object persistence through CC

### 🔧 VM Ready, Awaiting Compiler Support:
1. **Function calls** - CALL, RETURN opcodes defined
2. **Additional jumps** - JUMP_IF, JUMP_IF_TRUE opcodes available

### ❌ Not Implemented:
1. **Function definitions** - Only main() is supported
3. **Function parameters** - No parameter passing
4. **for loops** - No traditional for(;;) loops
5. **Additional file operations** - Only fs.listFiles() is implemented
6. **Error handling** - No try/catch/throw
7. **Additional string methods** - trim, replace, etc.

## Error Handling

Currently, errors in CVM result in VM halting with an error state. There is no try/catch mechanism.

### JSON.parse Safety
Unlike standard JavaScript, `JSON.parse()` in CVM:
- Never throws exceptions
- Returns `null` for invalid JSON
- Fully supports objects, arrays, and primitive types
- Handles already-parsed CVM objects gracefully

## Examples

### Basic Program Structure
```javascript
function main() {
  console.log("Hello CVM!");
}
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
```

### Working with Objects and CC
```javascript
function main() {
  let files = fs.listFiles("/src", { recursive: true, filter: "*.ts" });
  let summaries = [];
  
  for (const file of files) {
    let analysis = CC("Analyze this TypeScript file and provide a brief summary: " + file);
    
    // Store results as objects instead of concatenated strings
    summaries.push({
      filename: file,
      summary: analysis
    });
  }
  
  // Pass structured data through CC
  let report = CC("Generate a report from these file summaries: " + JSON.stringify(summaries));
  
  return report;
}
```

### Object Manipulation Example
```javascript
function main() {
  // Create user objects
  let user1 = { name: "Alice", age: 30, role: "admin" };
  let user2 = { name: "Bob", age: 25, role: "user" };
  
  // Build a team object
  let team = {
    name: "Development",
    lead: user1,
    members: [user1, user2],
    metadata: {
      created: "2025-06-21",
      active: true
    }
  };
  
  // Access nested properties
  console.log("Team lead: " + team.lead.name);
  console.log("Team created: " + team.metadata.created);
  
  // Dynamic property access
  let prop = "role";
  console.log("Lead's role: " + team.lead[prop]);
  
  // Modify properties
  team.metadata.active = false;
  user2.age = 26;
  
  // Convert to JSON for CC
  let teamData = JSON.stringify(team);
  let analysis = CC("Analyze this team structure and suggest improvements: " + teamData);
  console.log(analysis);
  
  return analysis;
}
```

## Test Coverage

The implementation has comprehensive test coverage:
- **570 total tests passing** across all packages
- **38 iterator tests** validating ITER_START, ITER_NEXT, ITER_END
- **23 new operator tests** for %, <=, >=, ===, !==
- **24 logical operator tests** for VM implementation of &&, ||, !
- **16 compiler tests** for logical operator compilation
- **19 string method tests** for substring, indexOf, split
- **9 undefined type tests** for JavaScript undefined semantics
- **9 ternary operator tests** (5 compiler, 4 VM)
- **6 integration tests** for logical operators E2E
- **Object tests** including:
  - Object literal compilation and execution
  - Property access (dot and bracket notation)
  - Property assignment
  - Nested objects
  - JSON.stringify for objects
  - Object persistence through CC
- **Arithmetic E2E tests** confirming numeric operations work correctly
- **Control flow tests** for if/else and while loops
- **Integration tests** with MongoDB storage and MCP server

## Next Development Phases

### Phase 3: Iteration ✅ COMPLETE
- ✅ for-of loop support: `for (const item of array) { ... }`
- ✅ break/continue support in all loops
- ✅ Nested loop support with iterator stack

### Phase 4: File Operations ✅ PARTIALLY COMPLETE
- ✅ fs.listFiles() with path sandboxing
- ✅ Support for recursive listing and glob filters
- ✅ Security through CVM_SANDBOX_PATHS environment variable
- ❌ Additional operations: fs.readFile(), fs.writeFile(), etc.

### Phase 5: Functions
- Add function definitions beyond main()
- Enable code reusability and organization
- Implement CALL/RETURN opcodes in VM