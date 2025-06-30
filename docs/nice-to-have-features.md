# CVM Nice to Have Features

This document outlines features that would enhance CVM's ability to serve as an **algorithmic TODO manager for Claude**. Remember: CVM is NOT a general-purpose programming language - it's a smart TODO list orchestrator.

## Core Mission Alignment
CVM's purpose: Help Claude process tasks like "analyze these 1000 files" without losing context or getting confused. Features should support this mission.

## Essential Features for TODO Orchestration

### 1. String Operations for Path/File Handling
- **`includes()`** - Check if path contains pattern
  ```typescript
  if (filename.includes("test")) {
    CC("This is a test file - analyze for test patterns");
  }
  ```

- **`endsWith()`** - File extension checking
  ```typescript
  if (file.endsWith(".ts")) {
    CC("Analyze TypeScript file: " + file);
  }
  ```

- **`startsWith()`** - Directory filtering
  ```typescript
  if (path.startsWith("/src/")) {
    CC("Source file - check for exports: " + path);
  }
  ```

### 2. Array Operations for Batch Processing
- **`filter()` with simple predicates** - Filter file lists
  ```typescript
  const tsFiles = files.filter(f => f.endsWith(".ts"));
  ```

- **`slice()`** - Process files in chunks
  ```typescript
  const batch = files.slice(0, 10);
  for (const file of batch) {
    CC("Process file: " + file);
  }
  ```

### 3. Try-Catch for Resilient Workflows
```typescript
try {
  const content = fs.readFile(path);
  CC("Analyze content: " + content.substring(0, 100));
} catch (e) {
  CC("File read failed for " + path + " - skip or handle differently");
}
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

### ❌ General Purpose Features
- Map/Set collections
- Advanced array methods (flatMap, reduce)
- Template literals (concatenation works fine)

## Minimal Priority List

### Must Have (For TODO Orchestration)
1. `string.endsWith()` - File type detection
2. `string.includes()` - Path pattern matching
3. `array.slice()` - Batch processing
4. Try-catch - Resilient file operations

### Nice to Have (Quality of Life)
1. `string.startsWith()` - Directory filtering
2. Switch statements - Cleaner task routing
3. `array.filter()` with simple predicates - File filtering
4. `Object.keys()` - When configs are objects
5. Basic RegExp - Validate CC() responses

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