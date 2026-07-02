## 1.2.0 (2026-07-02)

### 🚀 Features

- **plan parser:** strict `<red>` / `<actions>` content validation — any non-empty line inside those sections that is not a valid `- test:` / `- action:` item is now a hard validation error with its 1-based line number, instead of being silently dropped (fixes [#10](https://github.com/LadislavSopko/cvm/issues/10)). Annotations must go after the colon.
- **skills:** add three universal, agent-agnostic skills — `cvm-plan-create`, `cvm-plan-review`, `cvm-plan-execute` — so any AI agent can author, review, and drive CVM-PP plans standalone.
- **docs:** CVM Plan Protocol (CVM-PP) specification bumped to v1.1 documenting the strict content rule and tag-placement.

### 🩹 Fixes

- **vm:** prevent sandbox escape via path prefix match — `isPathAllowed` now requires a path-separator boundary so a sibling like `/data/app-secrets` no longer matches sandbox `/data/app`.

## 1.1.0 (2026-06-02)

This was a version bump only for cvm-server to align it with other projects, there were no code changes.

# 1.0.0 (2026-06-01)

### 🚀 Features

- license migration Apache-2.0 → AGPL-3.0-or-later + commercial dual licensing (v1.0.0) ([54f3ced](https://github.com/LadislavSopko/cvm/commit/54f3ced))
- MB update before commit + benchmark-runner + version 0.16.0-next.8 ([84222a0](https://github.com/LadislavSopko/cvm/commit/84222a0))
- mission context per block (not per CC) + remove MISSION BRIEFING + version 0.16.0-next.6 ([dcb7159](https://github.com/LadislavSopko/cvm/commit/dcb7159))
- step plan support (<actions> tag) + version 0.16.0-next.5 ([5950c59](https://github.com/LadislavSopko/cvm/commit/5950c59))
- CROSS-CHECK guardrail with JSON verification + version 0.16.0-next.4 ([f67ed9f](https://github.com/LadislavSopko/cvm/commit/f67ed9f))
- server_info tool + version 0.16.0-next.3 + publish registry fix ([79c9256](https://github.com/LadislavSopko/cvm/commit/79c9256))
- multi-file TDDAB plan support + version 0.16.0-next.2 ([c316d0a](https://github.com/LadislavSopko/cvm/commit/c316d0a))
- CVM skills + publish-next target + test examples setup ([d106340](https://github.com/LadislavSopko/cvm/commit/d106340))
- planexecutor completedBlocks tracking + built-in @planexecutor loading ([c02f3b5](https://github.com/LadislavSopko/cvm/commit/c02f3b5))
- add program management tools - list, delete, restart ([0020dd3](https://github.com/LadislavSopko/cvm/commit/0020dd3))
- implement execution management tools ([f6eef56](https://github.com/LadislavSopko/cvm/commit/f6eef56))
- ⚠️  implement toString() method and implicit main() execution ([62b3992](https://github.com/LadislavSopko/cvm/commit/62b3992))
- ⚠️  add complete object support to CVM (v0.9.0) ([365225e](https://github.com/LadislavSopko/cvm/commit/365225e))
- ⚠️  implement fs.listFiles() with sandboxing and glob filtering ([693b61d](https://github.com/LadislavSopko/cvm/commit/693b61d))
- complete Phase 3 - for-of loops with break/continue support ([b8bf17b](https://github.com/LadislavSopko/cvm/commit/b8bf17b))
- implement unary operators (++, --, unary -, unary +) ([d85a30b](https://github.com/LadislavSopko/cvm/commit/d85a30b))
- implement essential string methods (substring, indexOf, split) ([3b33893](https://github.com/LadislavSopko/cvm/commit/3b33893))
- implement Phase 1 language extensions - arrays and JSON parsing ([9b6f5ba](https://github.com/LadislavSopko/cvm/commit/9b6f5ba))

### 🩹 Fixes

- persist iterator state across CC calls for for-of loops ([d529c99](https://github.com/LadislavSopko/cvm/commit/d529c99))
- package.json loading error in npx context ([7b84cf4](https://github.com/LadislavSopko/cvm/commit/7b84cf4))
- critical bin script error requiring wrong file extension ([5b1a3ab](https://github.com/LadislavSopko/cvm/commit/5b1a3ab))
- TypeScript errors and add proper stack underflow checks ([cf6943b](https://github.com/LadislavSopko/cvm/commit/cf6943b))
- MCP server now uses actual package version ([8d99d7b](https://github.com/LadislavSopko/cvm/commit/8d99d7b))

### ⚠️  Breaking Changes

- None - backward compatible with existing programs
- CVMObject.properties changed from Map<string, CVMValue> to Record<string, CVMValue> for JSON compatibility
- fs.listFiles() now returns array of absolute path strings instead of file objects

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.9.2 (2025-06-21)

### 🚀 Features

- **Universal toString() Method** - Add toString() support for all types
  - Works on strings, numbers, booleans, null, undefined, arrays, objects
  - Returns consistent string representations
  - Implemented as TO_STRING opcode

- **Implicit main() Execution** - Make main() function calls optional
  - Programs now execute automatically
  - Backward compatible with existing code
  - Simplifies program structure

### 🩹 Fixes

- Fix API.md documentation accuracy
  - Property access returns `undefined` (not `null`)
  - for-of loops snapshot only array length (not full array)

### ❤️ Thank You

- Ladislav Sopko @LadislavSopko

## 0.9.1 (2025-06-21)

### 🚀 Features

- **Universal toString() Method** - Add toString() support for all types
  - Works on strings, numbers, booleans, null, undefined, arrays, objects
  - Returns consistent string representations
  - Implemented as TO_STRING opcode

- **Implicit main() Execution** - Make main() function calls optional
  - Programs now execute automatically
  - Backward compatible with existing code
  - Simplifies program structure

### 📝 Documentation

- Sync cvm-server README with main project README
- Update copyright year to 2025
- Update API.md with toString() and optional main() documentation
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