# CVM Language API Reference

> 📖 **New to CVM?** Start with the [main README](../README.md) to understand what CVM is and why you'd use it.

> ⚠️ **Quick Warning**: CVM is NOT JavaScript! No template literals (`${}`), no parseInt(), no user functions, no classes. See [NOT Supported Features](#️-not-supported-features) section below.

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

## ⚠️ NOT Supported Features

**IMPORTANT**: CVM is NOT JavaScript! Many common JavaScript/TypeScript features are NOT supported:

### String Features NOT Supported
```javascript
// ❌ Template literals / String interpolation
const msg = `Hello ${name}`;  // WILL NOT WORK!

// ✅ Use string concatenation instead:
const msg = "Hello " + name;
```

### Functions NOT Supported
```javascript
// ❌ parseInt, parseFloat, Number()
const num = parseInt("42");  // WILL NOT WORK!

// ✅ Use unary plus operator:
const num = +"42";

// ❌ Math functions
Math.floor(3.7);  // WILL NOT WORK!
Math.random();    // WILL NOT WORK!

// ❌ setTimeout, setInterval, Promise, async/await
setTimeout(() => {}, 1000);  // WILL NOT WORK!
```

### Language Features NOT Supported
```javascript
// ❌ User-defined functions (except main)
function helper() {}  // WILL NOT WORK!

// ❌ Arrow functions
const fn = () => {};  // WILL NOT WORK!

// ❌ Classes
class MyClass {}  // WILL NOT WORK!

// ❌ try/catch
try { } catch (e) { }  // WILL NOT WORK!

// ✅ switch statements are now supported!
// See Control Flow section

// ✅ Regular expressions are now supported!
// See RegExp Literals section

// ❌ Destructuring
const {a, b} = obj;  // WILL NOT WORK!
const [x, y] = arr;  // WILL NOT WORK!

// ❌ Spread operator
...array  // WILL NOT WORK!

// ✅ for-in loops are now supported!
// See Control Flow section

// ❌ do-while loops
do { } while (condition);  // WILL NOT WORK!
```

### Object/Array Methods NOT Supported
```javascript
// ❌ Most array methods
arr.map()     // WILL NOT WORK!
arr.filter()  // WILL NOT WORK!
arr.reduce()  // WILL NOT WORK!
arr.forEach() // WILL NOT WORK!
arr.find()    // WILL NOT WORK!
arr.sort()    // WILL NOT WORK!

// ✅ Supported array methods:
// array.push()
// array.length
// array.slice()    // WORKS! (implemented)
// array.join()     // WORKS! (implemented)
// array.indexOf()  // WORKS! (implemented)

// ✅ Some Object methods now supported:
Object.keys(obj)    // WORKS! (see Object Methods section)

// ❌ Other object methods still NOT supported:
Object.values(obj)  // WILL NOT WORK!
Object.entries(obj) // WILL NOT WORK!
```

### Other Missing Features
```javascript
// ❌ import/export
import { x } from 'module';  // WILL NOT WORK!

// ❌ require
const fs = require('fs');  // WILL NOT WORK!

// ❌ console methods (only console.log works)
console.error()  // WILL NOT WORK!
console.warn()   // WILL NOT WORK!

// ❌ let and const block scoping
if (true) {
  let x = 1;  // x WILL leak out of block!
}
// x is still accessible here (function-scoped like var)
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

### fs.readFile(path: string) → string | null
**Status**: ✅ Implemented & Tested

Reads the contents of a file as a UTF-8 string.

```javascript
// Read a file
let content = fs.readFile("./data.json");
if (content !== null) {
  let data = JSON.parse(content);
  console.log("Loaded data: " + data.count);
}

// Handle missing file
let missing = fs.readFile("./not-found.txt");
if (missing === null) {
  console.log("File not found");
}
```

**Returns**: 
- File contents as string if successful
- `null` if file not found, not accessible, or outside sandbox

**Security**:
- Sandboxed to paths defined in `CVM_SANDBOX_PATHS`
- Symbolic links are not followed
- Only regular files can be read (not directories)
- Returns `null` for any security violation

**Use Cases**:
- Loading saved state between CVM executions
- Reading configuration files
- Restoring progress from previous runs

### fs.writeFile(path: string, content: string) → boolean
**Status**: ✅ Implemented & Tested

Writes content to a file, creating it if it doesn't exist or overwriting if it does.

```javascript
// Save state
let state = {
  processed: 42,
  timestamp: Date.now()
};
let saved = fs.writeFile("./state.json", JSON.stringify(state));
console.log("Save successful: " + saved);

// Write text file
fs.writeFile("./output.txt", "Analysis results:\n" + results);

// Create file in subdirectory (directory created automatically)
fs.writeFile("./reports/daily.txt", reportContent);
```

**Returns**: 
- `true` if write was successful
- `false` if write failed or path is outside sandbox

**Security**:
- Sandboxed to paths defined in `CVM_SANDBOX_PATHS`
- Parent directories created automatically if needed
- Cannot overwrite symbolic links
- Both file and parent directory must be within sandbox

**Use Cases**:
- Persisting state between CC() calls
- Saving intermediate results
- Creating output files for processed data

**Note**: CVM's fs operations are for CVM's own state management. Claude uses its own file tools for general file access.

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

**⚠️ Remember**: No template literals! Use `+` for concatenation:
```javascript
// ❌ WRONG:
const msg = `Count: ${count}`;

// ✅ CORRECT:
const msg = "Count: " + count;
```

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

### string.endsWith(searchString) → boolean
**Status**: ✅ Implemented & Tested

Returns true if the string ends with the specified searchString.

```javascript
"hello.txt".endsWith(".txt");    // true
"hello.txt".endsWith(".js");     // false
"hello".endsWith("lo");          // true
"test".endsWith("");             // true (empty string always matches)
```

**Note**: Essential for file type detection in CVM programs.

### string.includes(searchString) → boolean
**Status**: ✅ Implemented & Tested

Returns true if the string contains the specified searchString.

```javascript
"hello world".includes("world"); // true
"hello world".includes("xyz");   // false
"/path/to/test.js".includes("test"); // true
"test".includes("");             // true (empty string always found)
```

**Note**: Essential for path pattern matching in CVM programs.

### string.startsWith(searchString) → boolean
**Status**: ✅ Implemented & Tested

Returns true if the string starts with the specified searchString.

```javascript
"/home/user/file.txt".startsWith("/home");  // true
"hello world".startsWith("hello");          // true
"test".startsWith("est");                   // false
"test".startsWith("");                      // true (empty string always matches)
```

### string.trim() → string
**Status**: ✅ Implemented & Tested

Removes whitespace from both ends of the string.

```javascript
"  hello  ".trim();       // "hello"
"\t\ntest\r\n".trim();    // "test"
"no whitespace".trim();   // "no whitespace"
```

### string.trimStart() → string
**Status**: ✅ Implemented & Tested

Removes whitespace from the beginning of the string.

```javascript
"  hello  ".trimStart();    // "hello  "
"\t\ntest".trimStart();     // "test"
"no space".trimStart();     // "no space"
```

### string.trimEnd() → string
**Status**: ✅ Implemented & Tested

Removes whitespace from the end of the string.

```javascript
"  hello  ".trimEnd();      // "  hello"
"test\r\n".trimEnd();       // "test"
"no space".trimEnd();       // "no space"
```

### string.replace(search, replacement) → string
**Status**: ✅ Implemented & Tested

Replaces the FIRST occurrence of search string with replacement.

```javascript
"hello world".replace("o", "a");        // "hella world" (only first 'o')
"test test".replace("test", "best");    // "best test"
"no match".replace("xyz", "abc");       // "no match" (no change)
```

### string.replaceAll(search, replacement) → string
**Status**: ✅ Implemented & Tested

Replaces ALL occurrences of search string with replacement.

```javascript
"hello world".replaceAll("o", "a");     // "hella warld" (all 'o's)
"test test".replaceAll("test", "best"); // "best best"
"aaa".replaceAll("a", "b");             // "bbb"
```

### string.lastIndexOf(searchString) → number
**Status**: ✅ Implemented & Tested

Returns the index of the last occurrence of searchString, or -1 if not found.

```javascript
"hello world hello".lastIndexOf("hello");  // 12
"test.backup.js".lastIndexOf(".");         // 11
"no match".lastIndexOf("xyz");             // -1
```

### string.repeat(count) → string
**Status**: ✅ Implemented & Tested

Returns a new string with the original string repeated count times.

```javascript
"ha".repeat(3);           // "hahaha"
"=".repeat(10);          // "=========="
"test".repeat(0);        // ""
"x".repeat(5);           // "xxxxx"
```

### string.padStart(targetLength, padString) → string
**Status**: ✅ Implemented & Tested

Pads the string from the start to reach targetLength using padString.

```javascript
"5".padStart(3, "0");         // "005"
"hello".padStart(10, " ");    // "     hello"
"test".padStart(6, "ab");     // "abtest"
"long string".padStart(5, "x"); // "long string" (already longer)
```

### string.padEnd(targetLength, padString) → string
**Status**: ✅ Implemented & Tested

Pads the string from the end to reach targetLength using padString.

```javascript
"5".padEnd(3, "0");           // "500"
"hello".padEnd(10, ".");      // "hello....."
"test".padEnd(6, "ab");       // "testab"
"long string".padEnd(5, "x"); // "long string" (already longer)
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

### array.slice(start[, end]) → array
**Status**: ✅ Implemented & Tested

Extracts a section of the array and returns it as a new array.

```javascript
let arr = [1, 2, 3, 4, 5];
arr.slice(1, 3);      // [2, 3]
arr.slice(2);         // [3, 4, 5]
arr.slice(-2);        // [4, 5]
arr.slice(0, -1);     // [1, 2, 3, 4]
```

**Special behaviors**:
- Negative indices count from the end of the array
- If end is omitted, extracts to the end of the array
- Returns a new array (does not modify original)

**Note**: Essential for batch processing in CVM programs.

### array.join(separator) → string
**Status**: ✅ Implemented & Tested

Joins all array elements into a string using the specified separator.

```javascript
["a", "b", "c"].join(",");          // "a,b,c"
[1, 2, 3].join(" - ");              // "1 - 2 - 3"
["hello", "world"].join("");        // "helloworld"
[].join(",");                       // "" (empty array returns empty string)
```

**Special behaviors**:
- Converts all elements to strings before joining
- null becomes "null", undefined becomes "undefined"
- Empty array returns empty string

### array.indexOf(searchElement) → number
**Status**: ✅ Implemented & Tested

Returns the index of the first occurrence of searchElement, or -1 if not found.

```javascript
[1, 2, 3, 2].indexOf(2);           // 1 (first occurrence)
["a", "b", "c"].indexOf("c");      // 2
[1, 2, 3].indexOf(4);              // -1 (not found)
```

**Note**: Uses strict equality (===) for comparison.

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

### Traditional for(;;) loops
**Status**: ✅ Implemented

Traditional C-style for loops with initialization, condition, and increment.

```javascript
// Basic counting loop
for (let i = 0; i < 5; i++) {
  console.log("Count: " + i);  // Prints: 0, 1, 2, 3, 4
}

// With custom increment
for (let i = 10; i >= 0; i = i - 2) {
  console.log(i);  // Prints: 10, 8, 6, 4, 2, 0
}

// Using variables
let start = 1;
let end = 3;
for (let i = start; i <= end; i++) {
  console.log("Value: " + i);
}

// Complex initialization
for (let i = 0, sum = 0; i < 5; i++) {
  sum = sum + i;
  console.log("i=" + i + ", sum=" + sum);
}
```

**Features**:
- Full C-style syntax: `for (init; condition; increment)`
- Supports `let` and `const` in initialization
- Complex expressions in all three parts
- Proper loop scoping
- Works with break/continue statements

### switch/case statements
**Status**: ✅ Implemented

Multi-way conditional branching with switch statements.

```javascript
const action = CC("What action? (start/stop/restart)");
switch (action) {
  case "start":
    console.log("Starting service...");
    break;
  case "stop":
    console.log("Stopping service...");
    break;
  case "restart":
    console.log("Restarting service...");
    break;
  default:
    console.log("Unknown action: " + action);
}

// Fall-through behavior works too
const code = 2;
let priority = "";
switch (code) {
  case 1:
  case 2:
  case 3:
    priority = "low";
    break;
  case 4:
  case 5:
    priority = "high";
    break;
  default:
    priority = "unknown";
}
```

**Features**:
- Standard switch/case syntax
- Fall-through behavior (when break is omitted)
- Default case support
- Works with strings, numbers, and variables
- Proper break statement handling

### for...in loops
**Status**: ✅ Implemented

Iterate over object properties with for-in syntax.

```javascript
const config = { host: "localhost", port: 3000, debug: true };
for (const key in config) {
  console.log(key + ": " + config[key]);
}
// Prints:
// host: localhost
// port: 3000
// debug: true

// With variable declarations
for (let prop in { a: 1, b: 2 }) {
  console.log("Property: " + prop);
}

// Empty objects work too
for (const key in {}) {
  console.log("This won't print");
}
```

**Features**:
- Standard for-in syntax: `for (variable in object)`
- Supports `const` and `let` declarations
- Iterates over object properties in definition order
- Safe iteration over empty objects
- Compatible with object literals and variables

## RegExp Literals

### /pattern/flags → regex object
**Status**: ✅ Implemented

Create regular expression objects using literal syntax with patterns and flags.

```javascript
// Basic pattern
const emailPattern = /\w+@\w+\.\w+/;

// With flags
const caseInsensitive = /hello/i;
const globalMatch = /test/g;
const multiline = /^start/m;
const combined = /pattern/gim;
```

**Supported flags**:
- `i` - Case insensitive matching
- `g` - Global matching (find all matches)
- `m` - Multiline mode (^ and $ match line boundaries)

### regex.source → string
**Status**: ✅ Implemented

Access the pattern string used to create the regex.

```javascript
const pattern = /hello world/i;
console.log(pattern.source);  // "hello world"
```

### regex.flags → string
**Status**: ✅ Implemented

Get the flags used to create the regex as a string.

```javascript
const pattern = /test/gi;
console.log(pattern.flags);   // "gi"
```

### regex.global → boolean
**Status**: ✅ Implemented

Check if the global flag is set.

```javascript
const pattern = /test/g;
console.log(pattern.global);  // true

const noGlobal = /test/i;
console.log(noGlobal.global); // false
```

### regex.ignoreCase → boolean
**Status**: ✅ Implemented

Check if the ignore case flag is set.

```javascript
const pattern = /Test/i;
console.log(pattern.ignoreCase);  // true

const caseSensitive = /Test/;
console.log(caseSensitive.ignoreCase); // false
```

### regex.multiline → boolean
**Status**: ✅ Implemented

Check if the multiline flag is set.

```javascript
const pattern = /^start/m;
console.log(pattern.multiline);  // true

const singleLine = /^start/;
console.log(singleLine.multiline); // false
```

**Note**: RegExp literals create objects that store pattern metadata. They're perfect for TODO orchestration tasks like:
- Validating file paths and names
- Checking configuration formats
- Pattern matching in CC() responses
- File filtering by complex patterns

**Example usage in TODO orchestration**:
```javascript
function main() {
  const files = fs.listFiles("/src", { recursive: true });
  const testPattern = /\.test\.(js|ts)$/;
  const configPattern = /^config\./i;
  
  for (const file of files) {
    if (testPattern.global) {
      // Pattern configured for multiple matches
      CC("Analyze test file patterns in: " + file);
    } else if (configPattern.ignoreCase) {
      // Case-insensitive config detection
      CC("Validate configuration format in: " + file);
    }
  }
}
```

## RegExp Pattern Matching

### regex.test(string) → boolean
**Status**: ✅ Implemented

Test if a string matches the regular expression pattern. Returns `true` if a match is found, `false` otherwise.

```javascript
const emailPattern = /\w+@\w+\.\w+/;
const validEmail = "user@example.com";
const invalidEmail = "not-an-email";

console.log(emailPattern.test(validEmail));   // true
console.log(emailPattern.test(invalidEmail)); // false

// Case insensitive testing
const casePattern = /hello/i;
console.log(casePattern.test("Hello World")); // true
console.log(casePattern.test("world"));       // false
```

**Error handling**:
```javascript
const pattern = /test/;
pattern.test(42);  // Error: Expected string argument for regex test, got number
```

### string.match(regex) → array | null
**Status**: ✅ Implemented

Extract matches from a string using a regular expression. Returns an array of matches or `null` if no matches found.

```javascript
// Single match
const text = "Contact user@example.com for help";
const emailPattern = /\w+@\w+\.\w+/;
const match = text.match(emailPattern);
console.log(match);  // ["user@example.com"]

// Global matches
const logText = "2024-01-01 ERROR: Database connection failed";
const numberPattern = /\d+/g;
const numbers = logText.match(numberPattern);
console.log(numbers);  // ["2024", "01", "01"]

// Capture groups
const urlText = "Visit https://example.com/docs for info";
const urlPattern = /(https?):\/\/([^\/]+)(\/.*)?/;
const urlMatch = urlText.match(urlPattern);
console.log(urlMatch);  // ["https://example.com/docs", "https", "example.com", "/docs"]

// No match
const noMatch = "clean text".match(/error/i);
console.log(noMatch);  // null
```

**Error handling**:
```javascript
const text = "test string";
text.match("not-a-regex");  // Error: Expected regex object for match
```

### string.replace(regex, replacement) → string
**Status**: ✅ Implemented

Replace matches in a string using a regular expression. Returns a new string with replacements made.

```javascript
// Single replacement
const text = "Hello world";
const result = text.replace(/world/, "universe");
console.log(result);  // "Hello universe"

// Global replacement
const logText = "test and test again test";
const globalResult = logText.replace(/test/g, "check");
console.log(globalResult);  // "check and check again check"

// Case insensitive replacement
const mixedCase = "Hello WORLD hello";
const caseResult = mixedCase.replace(/hello/gi, "hi");
console.log(caseResult);  // "hi WORLD hi"

// Using capture groups
const email = "user@example.com";
const masked = email.replace(/(\w+)@(\w+)/, "$2@[HIDDEN]");
console.log(masked);  // "example@[HIDDEN].com"

// Special replacement patterns
const fullMatch = "hello world".replace(/world/, "[$&]");
console.log(fullMatch);  // "hello [world]"
```

**Replacement patterns**:
- `$&` - The full match
- `$1`, `$2`, etc. - Capture groups
- `$$` - Literal dollar sign

**Error handling**:
```javascript
const pattern = /test/;
pattern.replace(42, "replacement");  // Error: Expected string input for replace
pattern.replace("text", 42);         // Error: Expected string replacement
```

## RegExp Opcodes

The following VM opcodes handle RegExp operations:

- `LOAD_REGEX` - Create regex object from pattern and flags
- `REGEX_TEST` - Execute regex.test(string) operation  
- `STRING_MATCH` - Execute string.match(regex) operation
- `STRING_REPLACE_REGEX` - Execute string.replace(regex, replacement) operation

## RegExp in TODO Orchestration

Regular expressions enable powerful pattern-based TODO orchestration workflows:

```javascript
function main() {
  console.log("=== Log Analysis with RegExp ===");
  
  // Define analysis patterns
  const errorPattern = /ERROR|FATAL|CRITICAL/i;
  const timestampPattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;
  const ipPattern = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
  
  // Sample log entries
  const logEntries = [
    "2024-01-01 10:30:15 192.168.1.100 GET /api/users - OK",
    "2024-01-01 10:31:22 10.0.0.5 POST /api/login - ERROR: Invalid credentials",
    "2024-01-01 10:32:10 172.16.0.10 GET /health - OK"
  ];
  
  var errorCount = 0;
  
  for (var i = 0; i < logEntries.length; i++) {
    var entry = logEntries[i];
    
    // Check for errors
    if (errorPattern.test(entry)) {
      errorCount = errorCount + 1;
      console.log("⚠ Error detected in entry " + (i + 1));
    }
    
    // Extract timestamp
    var timestampMatch = entry.match(timestampPattern);
    if (timestampMatch !== null) {
      console.log("📅 Timestamp: " + timestampMatch[0]);
    }
    
    // Extract IP addresses
    var ipMatches = entry.match(ipPattern);
    if (ipMatches !== null) {
      console.log("🌐 IP: " + ipMatches[0]);
    }
    
    // Sanitize sensitive data
    var sanitized = entry.replace(ipPattern, "[IP-HIDDEN]");
    sanitized = sanitized.replace(timestampPattern, "[TIMESTAMP]");
    console.log("🔒 Sanitized: " + sanitized);
  }
  
  console.log("Total errors found: " + errorCount);
}
```

**RegExp enables TODO workflows for**:
- **Log parsing and analysis** - Extract structured data from unstructured logs
- **Data validation** - Validate email addresses, URLs, file paths
- **Content sanitization** - Replace sensitive information with placeholders  
- **Pattern-based filtering** - Filter files, messages, or data by complex patterns
- **Text processing** - Transform and clean text data for further processing
- **Configuration validation** - Verify configuration file formats and values

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

**⚠️ Use this instead of parseInt()!**

```javascript
// ❌ WRONG:
let num = parseInt("42");  // parseInt is NOT supported!

// ✅ CORRECT:
let num = +"42";    // 42 (number)

// More examples:
let str = "42";
let num = +str;    // 42 (number)
let zero = +"";    // 0 (empty string becomes 0)
let nan = +"abc";  // NaN for invalid strings

// Common pattern with CC:
let userInput = CC("Enter a number:");
let number = +userInput;  // Convert string to number
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

### Object.keys(object) → string[]
**Status**: ✅ Implemented

Get an array of all property names (keys) from an object.

```javascript
// Basic usage
const config = { host: "localhost", port: 3000, debug: true };
const keys = Object.keys(config);
// keys = ["host", "port", "debug"]

// Use with for-of loop
for (const key of Object.keys(config)) {
  console.log(key + ": " + config[key]);
}

// Use with traditional for loop
for (let i = 0; i < keys.length; i++) {
  console.log("Key " + i + ": " + keys[i]);
}

// Empty object
const empty = {};
const emptyKeys = Object.keys(empty);  // []

// Works with any object
const person = { name: "John", age: 30 };
const personKeys = Object.keys(person);  // ["name", "age"]
```

**Features**:
- Returns array of strings containing all enumerable property names
- Keys returned in object definition order
- Empty objects return empty array `[]`
- Compatible with all CVM loop types (for-of, for(;;), for-in)

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
  - string.includes(searchString)
  - string.endsWith(searchString)
  - string.startsWith(searchString)
  - string.trim()
  - string.trimStart()
  - string.trimEnd()
  - string.replace(search, replacement)
  - string.replaceAll(search, replacement)
  - string.lastIndexOf(searchString)
  - string.repeat(count)
  - string.padStart(targetLength, padString)
  - string.padEnd(targetLength, padString)
  - value.toString()
- Array operations:
  - array.length
  - array.push(value)
  - array.slice(start[, end])
  - array.join(separator)
  - array.indexOf(searchElement)
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
  - **Object.keys()** - Get array of property names
- **Traditional for(;;) loops** - C-style loops with init, condition, increment
- **switch/case statements** - Multi-way branching with fall-through support
- **for...in loops** - Object property iteration
- **RegExp literals** - Pattern matching with `/pattern/flags` syntax

### 🔧 VM Ready, Awaiting Compiler Support:
1. **Function calls** - CALL, RETURN opcodes defined
2. **Additional jumps** - JUMP_IF, JUMP_IF_TRUE opcodes available

### ❌ Not Implemented:
1. **Function definitions** - Only main() is supported
2. **Function parameters** - No parameter passing
3. **Additional file operations** - Only fs.listFiles() is implemented
4. **Error handling** - No try/catch/throw
5. **Additional string methods** - match, search (Note: padStart/padEnd are implemented as JavaScript standard names)
6. **Additional object methods** - Object.values(), Object.entries(), etc.

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

The implementation has comprehensive test coverage across 42 organized E2E test programs:

### Test Organization
Tests are organized by category in `/test/programs/`:
- **01-basics**: Variables, functions, return values, console output (5 tests)
- **02-operators**: All operators including arithmetic, logical, comparison, unary, compound assignment (7 tests)
- **03-control-flow**: if/else, while, for-of loops, break/continue (5 tests)
- **04-data-structures**: Arrays and objects, including complex nested structures (8 tests)
- **05-strings**: All string methods and operations (5 tests)
- **06-file-system**: File I/O operations with sandboxing (8 tests)
- **07-cc-integration**: CC() cognitive call patterns (3 tests)
- **08-examples**: Real-world examples like password validation (3 tests)
- **09-comprehensive**: Full integration tests (2 tests)

### Coverage Summary
- ✅ **All documented string methods** are tested
- ✅ **File operations** (fs.listFiles, fs.readFile, fs.writeFile) fully tested
- ✅ **Object operations** including nested objects and JSON support
- ✅ **All operators** tested including compound assignments
- ✅ **Control flow** including for-of loops with break/continue
- ✅ **Type operations** including typeof and toString
- ✅ **All essential string methods** implemented: includes, endsWith, startsWith, trim, replace, etc.
- ✅ **Essential array methods** implemented: slice, join, indexOf

### Unit Test Statistics
- **615+ unit tests passing** across all packages
- **83%+ code coverage** on core packages
- Comprehensive VM opcode testing
- Full compiler transformation testing
- All 15 new string/array methods tested

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