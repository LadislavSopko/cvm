# CVM Nice to Have Features

This document outlines features that would enhance CVM's ability to serve as an **algorithmic TODO manager for Claude**. Remember: CVM is NOT a general-purpose programming language - it's a smart TODO list orchestrator.

## Core Mission Alignment
CVM's purpose: Help Claude process tasks like "analyze these 1000 files" without losing context or getting confused. Features should support this mission.

## Essential Features for TODO Orchestration

### 1. String Operations for Path/File Handling ✅ ALL IMPLEMENTED
- **`includes()`** ✅ IMPLEMENTED - Check if path contains pattern
  ```typescript
  if (filename.includes("test")) {
    CC("This is a test file - analyze for test patterns");
  }
  ```

- **`endsWith()`** ✅ IMPLEMENTED - File extension checking
  ```typescript
  if (file.endsWith(".ts")) {
    CC("Analyze TypeScript file: " + file);
  }
  ```

- **`startsWith()`** ✅ IMPLEMENTED - Directory filtering
  ```typescript
  if (path.startsWith("/src/")) {
    CC("Source file - check for exports: " + path);
  }
  ```

### 2. Array Operations for Batch Processing
- **`filter()` with simple predicates** ❌ NOT IMPLEMENTED - Filter file lists
  ```typescript
  const tsFiles = files.filter(f => f.endsWith(".ts"));
  ```

- **`slice()`** ✅ IMPLEMENTED - Process files in chunks
  ```typescript
  const batch = files.slice(0, 10);
  for (const file of batch) {
    CC("Process file: " + file);
  }
  ```

### 3. Error Handling Through Null/Undefined Returns
CVM design principle: **Operations never throw, they return null/undefined on error**

```typescript
// fs.readFile returns null if file doesn't exist
const content = fs.readFile(path);
if (content === null) {
  CC("File not found: " + path + " - how should I proceed?");
} else {
  CC("Analyze content: " + content.substring(0, 100));
}

// All operations follow this pattern:
const parsed = JSON.parse(jsonStr);  // Returns null on invalid JSON
if (parsed !== null) {
  CC("Process data with " + parsed.count + " items");
}

// No try-catch needed anywhere!
```

### 4. Switch for Task Routing
```typescript
switch (fileType) {
  case "config":
    CC("Validate configuration in: " + file);
    break;
  case "test":
    CC("Check test coverage for: " + file);
    break;
  default:
    CC("General analysis for: " + file);
}
```

### 5. Basic RegExp for Response Validation
```typescript
const response = CC("Extract the version number from package.json");
if (/^\d+\.\d+\.\d+$/.test(response)) {
  // Valid semantic version
  fs.writeFile("VERSION", response);
} else {
  CC("Invalid version format '" + response + "'. Please provide in X.Y.Z format");
}
```

Could validate:
- Specific response formats
- Yes/no answers
- Numeric ranges
- File paths or names

## Features NOT Needed (Against Mission)

### ❌ Complex Computation
- Math operations beyond basic counting
- Complex data transformations

### ❌ Advanced Programming Constructs
- Classes/OOP (overengineering for TODO lists)
- Async/Promises (CVM is synchronous by design)
- Type annotations (CVM programs are simple)
- Try-catch (complex VM implementation for simple need)

### ❌ General Purpose Features
- Map/Set collections
- Advanced array methods (flatMap, reduce)
- Template literals (concatenation works fine)

## Minimal Priority List

### Must Have (For TODO Orchestration) ✅ MOSTLY COMPLETE
1. `string.endsWith()` ✅ IMPLEMENTED - File type detection
2. `string.includes()` ✅ IMPLEMENTED - Path pattern matching
3. `array.slice()` ✅ IMPLEMENTED - Batch processing
4. **Design rule**: All operations return null/undefined on error (never throw)

### Nice to Have (Quality of Life) - PARTIALLY COMPLETE
1. `string.startsWith()` ✅ IMPLEMENTED - Directory filtering
2. Switch statements ❌ NOT IMPLEMENTED - Cleaner task routing
3. `array.filter()` with simple predicates ❌ NOT IMPLEMENTED - File filtering
4. `Object.keys()` ❌ NOT IMPLEMENTED - When configs are objects
5. Basic RegExp ❌ NOT IMPLEMENTED - Validate CC() responses

### Additional String/Array Methods Implemented (2025-07-02)
Beyond the must-have features, we've also implemented:
- `string.trim()`, `trimStart()`, `trimEnd()` ✅ - Input cleaning
- `string.replace()`, `replaceAll()` ✅ - Path normalization
- `string.lastIndexOf()` ✅ - Find file extensions
- `string.repeat()` ✅ - Generate separators/formatting
- `string.padStart()`, `padEnd()` ✅ - Format output
- `array.join()` ✅ - Generate reports/CSV
- `array.indexOf()` ✅ - Search in arrays

### Probably Don't Need
- Most other features from the original list
- CVM programs should stay simple and focused

## Design Principle
Every feature should answer YES to: **"Does this help Claude manage a complex multi-step task without losing context?"**

If it's about:
- Complex algorithms → NO
- Data processing → NO  
- TODO orchestration → YES
- File/path handling → YES
- Error resilience → YES

Remember: CVM's beauty is in its simplicity. It's a TODO list, not a programming language.