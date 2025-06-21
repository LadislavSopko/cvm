## 0.9.1 (2025-06-21)

### 📝 Documentation

- Sync cvm-server README with main project README
- Update copyright year to 2025
- Ensure npm package has accurate documentation

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.9.0 (2025-06-21)

### 🚀 Features

- **Complete Object Support** - Full implementation of objects in CVM
  - Object literals with `{}` syntax
  - Property access (dot and bracket notation)
  - Property assignment with dynamic property creation
  - Nested objects support
  - Shorthand property syntax
  - JSON.stringify() for objects
  - Object persistence through CC (Cognitive Call) state

### 🔧 Improvements

- Migrate from Map to Record for JSON compatibility
- Complete test coverage for object operations
- Integration tests for object persistence across CC calls

### 📝 Documentation

- Fix API.md accuracy issues:
  - Property access returns `undefined` (not `null`)
  - for-of loops snapshot only array length (not full array)
  - Add type system special behaviors section

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.8.0 (2025-06-20)

### 🚀 Features

- implement additional string methods (slice, charAt, toUpperCase, toLowerCase)
- add STRING_SLICE, STRING_CHARAT, STRING_TOUPPERCASE, STRING_TOLOWERCASE opcodes
- support JavaScript-compatible slice with negative indices
- add ternary conditional operator (?:) with proper short-circuit evaluation
- implement break and continue statements for all loop types

### 🩹 Fixes

- fix string method handlers to properly detect optional arguments
- improve substring handler to match JavaScript behavior with argument validation

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.7.0 (2025-06-20)

### 🚀 Features

- implement fs.listFiles() with sandboxing and glob pattern support
- add FS_LIST_FILES opcode with waiting_fs state management
- support recursive directory listing and file filtering
- implement sandboxed file system with CVM_SANDBOX_PATHS environment variable

### 🩹 Fixes

- fix critical bug where for-of loop iterators were lost during CC calls
- add iterators field to Execution interface for state persistence
- update VMManager to save/restore iterator state across async operations

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.6.0 (2025-06-19)

### 🚀 Features

- implement all unary operators (++, --, unary -, unary +)
- add pre/post increment and decrement with proper return values
- implement unary minus for negation and unary plus for type conversion
- implement all compound assignment operators (+=, -=, *=, /=, %=)
- add smart += detection: CONCAT for strings, ADD for numbers
- support complex expressions in compound assignments (e.g., x += y * 2)

### 🩹 Fixes

- fix cvmToNumber to return 0 for empty strings (JavaScript behavior)
- improve compiler handling of compound assignments with early return

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.5.0 (2025-06-19)

### 🚀 Features

- implement essential string methods (substring, indexOf, split)
- add STRING_SUBSTRING, STRING_INDEXOF, STRING_SPLIT opcodes
- support method chaining for string operations
- handle edge cases: negative indices, empty delimiters
- implement undefined value type with full JavaScript semantics
- add PUSH_UNDEFINED opcode for undefined literals

### 🩹 Fixes

- fix LOAD opcode to return undefined for uninitialized variables (JavaScript behavior)
- improve stack handling for string method arguments

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.4.3 (2025-06-19)

### 🩹 Fixes

- fix package.json loading error in npx context by trying multiple paths
- add fallback version when package.json cannot be found

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.4.2 (2025-06-19)

### 🩹 Fixes

- republish with correct build from proper directory

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.4.1 (2025-06-19)

### 🩹 Fixes

- fix critical bin script error requiring wrong file extension (main.js instead of main.cjs)

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

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