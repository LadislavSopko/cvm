## 0.4.0 (2025-06-19)

### 🚀 Features

- implement return statements from main() with program results
- implement string.length with universal LENGTH opcode for strings and arrays  
- implement all logical operators (&&, ||, !) with JavaScript-like semantics
- add comprehensive comparison operators (<=, >=, ===, !==)
- add modulo operator (%) for arithmetic operations
- create integration test infrastructure with MCP protocol

### 🩹 Fixes

- fix VM error messages to include opcode type for better debugging
- fix monorepo build artifacts and dependency management
- add VM+Compiler integration tests to catch cross-package issues

### 📝 Documentation

- add comprehensive Memory Bank documentation system
- document critical missing features discovered during testing
- create architecture understanding guide for future development

### BREAKING CHANGES

- Execution result now includes `result` field containing return value from main()

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.3.3 (2025-06-18)

### 🚀 Features  

- implement Phase 2 complete - full control flow with if/else and while loops
- add all comparison operators (==, !=, <, >, <=, >=, ===, !==)
- add all arithmetic operators (+, -, *, /, %)
- implement smart ADD/CONCAT detection for proper string concatenation
- add CompilerState infrastructure for control flow management

### 🩹 Fixes

- fix critical arithmetic bug where addition was concatenating numbers
- fix array assignment issues with proper ARRAY_SET opcode

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.3.0 (2025-06-16)

### 🚀 Features

- implement Phase 1 language extensions - arrays and JSON parsing  
- add CVMValue type system for proper type handling
- implement array operations (literals, access, push, assignment)
- add safe JSON.parse() that returns empty array on errors
- create comprehensive test infrastructure

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.2.3 (2025-06-15)

### 🩹 Fixes

- add typescript to dependencies for runtime parser ([320a207](https://github.com/LadislavSopko/cvm/commit/320a207))

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.2.2 (2025-06-15)

### 🩹 Fixes

- use .cjs extension for bin script to work with ES module package type ([2a704c1](https://github.com/LadislavSopko/cvm/commit/2a704c1))

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.2.1 (2025-06-15)

### 🩹 Fixes

- correct bin script path for published package structure ([b5a4e38](https://github.com/LadislavSopko/cvm/commit/b5a4e38))

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.2.0 (2025-06-15)

### 🚀 Features

- add API configuration structure for future REST API support ([c35e374](https://github.com/LadislavSopko/cvm/commit/c35e374))

### 🩹 Fixes

- update README with feature list and conventional commits info ([71df7ef](https://github.com/LadislavSopko/cvm/commit/71df7ef))

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko