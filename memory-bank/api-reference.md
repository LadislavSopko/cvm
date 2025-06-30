# API Reference

## MCP Tools

### Program Management

#### `mcp__cvm__load`
Load a program from source code.
```typescript
Parameters:
- programId: string  // Unique identifier
- source: string     // CVM source code

Returns: Success or error message
```

#### `mcp__cvm__loadFile`
Load a program from file.
```typescript
Parameters:
- programId: string  // Unique identifier
- filePath: string   // Path to .ts file

Returns: Success or error message
```

#### `mcp__cvm__list_programs`
List all loaded programs.
```typescript
Returns: Array of program IDs
```

#### `mcp__cvm__delete_program`
Delete a program (requires confirmation).
```typescript
Parameters:
- programId: string
- confirmToken?: string  // Required for actual deletion

Returns: Confirmation request or success
```

### Execution Management

#### `mcp__cvm__start`
Start program execution.
```typescript
Parameters:
- programId: string
- executionId: string
- setCurrent?: boolean  // Default: true

Returns: Success message
```

#### `mcp__cvm__getTask`
Get next task or status.
```typescript
Parameters:
- executionId?: string  // Uses current if not specified

Returns:
- If waiting: { prompt: string }
- If completed: { result: any, output: string }
- If error: { error: string }
```

#### `mcp__cvm__submitTask`
Submit cognitive result.
```typescript
Parameters:
- result: string
- executionId?: string  // Uses current if not specified

Returns: Success or error
```

#### `mcp__cvm__status`
Check execution status.
```typescript
Parameters:
- executionId?: string  // Uses current if not specified

Returns: Current status and state
```

## Language Features

### Variable Declarations
```typescript
const name = "value";    // Immutable
let count = 0;          // Mutable
var legacy = true;      // Function-scoped
```

### Control Flow
```typescript
// Conditionals
if (condition) {
  // code
} else {
  // code
}

// Loops
while (condition) {
  // code
}

for (const item of array) {
  // code
}

// Control
break;      // Exit loop
continue;   // Next iteration
return x;   // Return value
```

### Operators
```typescript
// Arithmetic
+ - * / %

// Comparison
< > <= >= == != === !==

// Logical
&& || !

// Unary
+ - ++ --

// Type
typeof x
```

### Built-in Functions

#### Core
```typescript
CC(prompt: string): string           // Cognitive compute
console.log(...args): void          // Output
```

#### Type Conversion
```typescript
toString(value): string             // Convert to string
parseInt(str): number              // Parse integer
+value                            // Coerce to number
```

#### Arrays
```typescript
array.push(item): void            // Add element
array.length: number             // Get length
array[index]                     // Access element
```

#### Strings
```typescript
str.length: number
str.substring(start, end): string
str.indexOf(search): number
str.split(delimiter): string[]
str.slice(start, end): string
str.charAt(index): string
str.toUpperCase(): string
str.toLowerCase(): string
```

#### JSON
```typescript
JSON.parse(str): any
JSON.stringify(obj): string
```

#### File System
```typescript
fs.readFile(path): string | null
fs.writeFile(path, content): "success" | "error"
fs.list(path): Array<{name: string, isDirectory: boolean}>
```

## Program Structure

### Basic Program
```typescript
function main() {
  const result = CC("What's your name?");
  console.log("Hello, " + result);
  return result;
}

main();
```

### Implicit Main
```typescript
// Code outside functions auto-wrapped in main()
const name = CC("Enter name:");
console.log("Hi " + name);
```

## Limitations

### Not Supported
- `import`/`require`
- `async`/`await` 
- Classes (`class`, `new`)
- `try`/`catch`
- Arrow functions `=>`
- Spread operator `...`
- Destructuring
- Template literals
- Regular `for(;;)` loops
- Function parameters

### Security Restrictions
- No network access
- Sandboxed file system
- No process execution
- No environment variables
- Memory limits
- Execution timeouts