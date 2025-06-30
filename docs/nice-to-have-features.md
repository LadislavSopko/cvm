# CVM Nice to Have Features

This document outlines TypeScript/JavaScript features that would be valuable additions to the CVM (Cognitive Virtual Machine) language subset. These features are commonly used in TypeScript development and would enhance CVM's capabilities.

## String Methods

### High Priority
- **`includes(searchString: string): boolean`** - Check if string contains substring
  - Example: `"hello world".includes("world") // true`
  - Very common for string validation and searching

- **`startsWith(searchString: string): boolean`** - Check if string starts with substring
  - Example: `"hello world".startsWith("hello") // true`
  - Useful for prefix matching, URL/path validation

- **`endsWith(searchString: string): boolean`** - Check if string ends with substring
  - Example: `"file.txt".endsWith(".txt") // true`
  - Essential for file extension checking

- **`trim(): string`** - Remove whitespace from both ends
  - Example: `"  hello  ".trim() // "hello"`
  - Critical for user input sanitization

### Medium Priority
- **`replace(searchValue: string, replaceValue: string): string`** - Replace first occurrence
  - Example: `"hello world".replace("world", "CVM") // "hello CVM"`
  - Basic text manipulation

- **`replaceAll(searchValue: string, replaceValue: string): string`** - Replace all occurrences
  - Example: `"a-b-c".replaceAll("-", "/") // "a/b/c"`
  - Bulk text replacement

- **`padStart(targetLength: number, padString?: string): string`** - Pad string start
  - Example: `"5".padStart(3, "0") // "005"`
  - Formatting numbers, IDs

- **`padEnd(targetLength: number, padString?: string): string`** - Pad string end
  - Example: `"hello".padEnd(10, ".") // "hello....."`
  - Text alignment, formatting

- **`repeat(count: number): string`** - Repeat string
  - Example: `"*".repeat(5) // "*****"`
  - Creating separators, patterns

### Low Priority
- **`trimStart() / trimLeft(): string`** - Remove leading whitespace
- **`trimEnd() / trimRight(): string`** - Remove trailing whitespace
- **`charCodeAt(index: number): number`** - Get Unicode value
- **`String.fromCharCode(...codes: number[]): string`** - Create string from Unicode

## Array Methods

### High Priority
- **`map<U>(callbackfn: (value: T) => U): U[]`** - Transform array elements
  - Example: `[1, 2, 3].map(x => x * 2) // [2, 4, 6]`
  - Fundamental for data transformation

- **`filter(predicate: (value: T) => boolean): T[]`** - Filter array elements
  - Example: `[1, 2, 3, 4].filter(x => x > 2) // [3, 4]`
  - Essential for data filtering

- **`find(predicate: (value: T) => boolean): T | undefined`** - Find first matching element
  - Example: `users.find(u => u.name === "Alice")`
  - Common search operation

- **`findIndex(predicate: (value: T) => boolean): number`** - Find index of first match
  - Example: `arr.findIndex(x => x > 10)`
  - Useful for locating elements

- **`reduce<U>(reducer: (acc: U, value: T) => U, initial: U): U`** - Reduce to single value
  - Example: `[1, 2, 3].reduce((sum, x) => sum + x, 0) // 6`
  - Aggregation operations

### Medium Priority
- **`some(predicate: (value: T) => boolean): boolean`** - Test if any element matches
  - Example: `[1, 2, 3].some(x => x > 2) // true`
  - Validation checks

- **`every(predicate: (value: T) => boolean): boolean`** - Test if all elements match
  - Example: `[2, 4, 6].every(x => x % 2 === 0) // true`
  - Validation checks

- **`includes(searchElement: T): boolean`** - Check if array contains element
  - Example: `[1, 2, 3].includes(2) // true`
  - Membership testing

- **`slice(start?: number, end?: number): T[]`** - Extract array portion
  - Example: `[1, 2, 3, 4].slice(1, 3) // [2, 3]`
  - Array subdivision

- **`join(separator?: string): string`** - Join array into string
  - Example: `["a", "b", "c"].join("-") // "a-b-c"`
  - String building

### Low Priority
- **`reverse(): T[]`** - Reverse array in place
- **`sort(compareFn?: (a: T, b: T) => number): T[]`** - Sort array
- **`concat(...items: T[]): T[]`** - Concatenate arrays
- **`pop(): T | undefined`** - Remove and return last element
- **`shift(): T | undefined`** - Remove and return first element
- **`unshift(...items: T[]): number`** - Add elements to beginning
- **`splice(start: number, deleteCount?: number, ...items: T[]): T[]`** - Add/remove elements
- **`flat(depth?: number): any[]`** - Flatten nested arrays
- **`flatMap<U>(callback: (value: T) => U[]): U[]`** - Map and flatten

## Control Flow

### High Priority
- **Function Definitions with Parameters**
  ```typescript
  function add(a: number, b: number): number {
    return a + b;
  }
  ```
  - Currently functions can't have parameters
  - Would enable code reuse and modularity

- **Try-Catch-Finally**
  ```typescript
  try {
    // risky operation
  } catch (e) {
    // error handling
  } finally {
    // cleanup
  }
  ```
  - Error handling is crucial for robust programs

- **Switch Statements**
  ```typescript
  switch (value) {
    case 1:
      // ...
      break;
    case 2:
      // ...
      break;
    default:
      // ...
  }
  ```
  - Cleaner than multiple if-else chains

### Medium Priority
- **For-in loops** - Iterate over object keys
  ```typescript
  for (const key in object) {
    console.log(key + ": " + object[key]);
  }
  ```

- **Do-While loops**
  ```typescript
  do {
    // body
  } while (condition);
  ```

## Type System

### High Priority
- **Classes**
  ```typescript
  class Person {
    name: string;
    constructor(name: string) {
      this.name = name;
    }
    greet() {
      return "Hello, " + this.name;
    }
  }
  ```
  - Object-oriented programming support

- **Interfaces**
  ```typescript
  interface User {
    id: number;
    name: string;
    email?: string;
  }
  ```
  - Type safety and contracts

### Medium Priority
- **Type Annotations**
  ```typescript
  let count: number = 0;
  let name: string = "CVM";
  let items: string[] = [];
  ```
  - Better type safety

- **Enums**
  ```typescript
  enum Status {
    Active,
    Inactive,
    Pending
  }
  ```
  - Named constants

## Object Methods

### High Priority
- **`Object.keys(obj): string[]`** - Get object keys
  - Example: `Object.keys({a: 1, b: 2}) // ["a", "b"]`
  - Essential for object iteration

- **`Object.values(obj): any[]`** - Get object values
  - Example: `Object.values({a: 1, b: 2}) // [1, 2]`
  - Extracting values

- **`Object.entries(obj): [string, any][]`** - Get key-value pairs
  - Example: `Object.entries({a: 1, b: 2}) // [["a", 1], ["b", 2]]`
  - Object to array conversion

### Medium Priority
- **`Object.assign(target, ...sources)`** - Merge objects
- **`hasOwnProperty(prop: string): boolean`** - Check property existence
- **Spread operator for objects** - `{...obj1, ...obj2}`

## Math Operations

### High Priority
- **Math object with common methods**
  - `Math.max(...values: number[]): number`
  - `Math.min(...values: number[]): number`
  - `Math.floor(x: number): number`
  - `Math.ceil(x: number): number`
  - `Math.round(x: number): number`
  - `Math.random(): number`
  - `Math.abs(x: number): number`
  - `Math.sqrt(x: number): number`
  - `Math.pow(x: number, y: number): number`

## Date/Time

### Medium Priority
- **Date object**
  ```typescript
  const now = new Date();
  const timestamp = Date.now();
  ```
  - Time-based operations

## Regular Expressions

### Low Priority
- **RegExp support**
  ```typescript
  const pattern = /[a-z]+/;
  const matches = text.match(pattern);
  ```
  - Pattern matching

## Async Operations

### Low Priority (Complex)
- **Promises**
- **Async/Await**
- **setTimeout/setInterval**

## Destructuring

### Medium Priority
- **Array destructuring**
  ```typescript
  const [first, second] = array;
  ```

- **Object destructuring**
  ```typescript
  const {name, age} = person;
  ```

## Template Literals

### High Priority
- **Template string syntax**
  ```typescript
  const message = `Hello ${name}, you are ${age} years old`;
  ```
  - Much cleaner than string concatenation

## Set and Map

### Low Priority
- **Set** - Unique value collections
- **Map** - Key-value pairs with any key type

## Priority Summary

### Must Have (Critical for most programs)
1. String: `includes()`, `startsWith()`, `endsWith()`, `trim()`
2. Array: `map()`, `filter()`, `find()`, `reduce()`
3. Object: `Object.keys()`, `Object.values()`
4. Template literals
5. Function parameters
6. Try-catch error handling

### Should Have (Significant quality of life)
1. String: `replace()`, `replaceAll()`
2. Array: `some()`, `every()`, `includes()`, `slice()`, `join()`
3. Math object methods
4. Switch statements
5. Classes and interfaces

### Nice to Have (Advanced features)
1. Regular expressions
2. Destructuring
3. Async operations
4. Set and Map collections
5. Advanced array methods (flat, flatMap)

## Implementation Notes

When implementing these features, consider:
1. **Bytecode complexity** - Each feature needs VM opcodes
2. **Type safety** - Maintain CVM's deterministic nature
3. **Performance** - Keep VM execution efficient
4. **Memory usage** - Especially for features like Map/Set
5. **Cognitive operations** - How features interact with CC()

The goal is to provide a useful subset of TypeScript that balances expressiveness with the simplicity and determinism required by the CVM architecture.