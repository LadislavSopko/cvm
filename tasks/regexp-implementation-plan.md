# RegExp Implementation Plan - TDD Atomic Blocks

## Overview
Implementing comprehensive RegExp support in CVM using Test-Driven Development with atomic implementation blocks. Each block represents a complete test → implement → verify cycle.

## Mission Alignment
RegExp support enables:
- **Input validation** for CC() responses
- **File pattern matching** for TODO orchestration  
- **Log processing** and error extraction
- **Configuration parsing** from strings
- **Text processing** workflows

## Implementation Architecture

### Core Components to Modify:
1. **Parser** (`@cvm/parser`) - Tokenize and parse regex literals/constructors
2. **VM** (`@cvm/vm`) - Execute regex operations  
3. **Bytecode** - New opcodes for regex operations
4. **Handlers** - VM handlers for regex methods

---

## TDD Atomic Block 1: Basic Regex Literal Parsing

### **Test Scope**: Parse regex literals `/pattern/flags`
### **Success Criteria**: Parser correctly tokenizes and compiles regex literals

#### Test Files to Create:
- `packages/parser/src/lib/__tests__/regex-literal.test.ts`
- `test/programs/regex/regex-literal-basic.ts`

#### Test Cases:
```typescript
// Basic regex literal
var pattern = /hello/;

// Regex with flags
var caseInsensitive = /hello/i;
var global = /hello/g;
var multiFlag = /hello/gi;

// Common patterns
var email = /\w+@\w+\.\w+/;
var digits = /\d+/;
var whitespace = /\s*/;
```

#### Implementation Steps:
1. **Lexer Changes**:
   - Add `REGEX_LITERAL` token type in `packages/parser/src/lib/lexer.ts`
   - Implement regex literal tokenization (handle `/pattern/flags`)
   - Handle escape sequences in regex patterns

2. **Parser Changes**:
   - Add regex literal parsing in `packages/parser/src/lib/parser.ts`
   - Create `RegexLiteral` AST node type
   - Handle regex as primary expression

3. **Compiler Changes**:
   - Add `LOAD_REGEX` opcode in `packages/parser/src/lib/bytecode.ts`
   - Compile regex literals to bytecode
   - Store pattern and flags separately

4. **VM Changes**:
   - Add `LoadRegexHandler` in `packages/vm/src/lib/handlers/`
   - Create regex objects using Node.js RegExp constructor
   - Store regex objects in heap

#### E2E Test:
```typescript
function main() {
  console.log("Testing regex literals");
  var pattern = /test/i;
  console.log("Pattern created: " + pattern.source);
  console.log("Flags: " + (pattern.ignoreCase ? "i" : ""));
  return 0;
}
```

---

## TDD Atomic Block 2: RegExp Constructor Support

### **Test Scope**: `new RegExp(pattern, flags)` constructor
### **Success Criteria**: Can create regex objects from strings

#### Test Files to Create:
- `packages/parser/src/lib/__tests__/regex-constructor.test.ts`
- `test/programs/regex/regex-constructor-basic.ts`

#### Test Cases:
```typescript
// Basic constructor
var pattern1 = new RegExp("hello");
var pattern2 = new RegExp("hello", "i");

// Dynamic patterns from variables
var userPattern = "test";
var dynamicRegex = new RegExp(userPattern + "$");

// Escaped patterns
var escaped = new RegExp("\\d+");
```

#### Implementation Steps:
1. **Parser Changes**:
   - Extend `NewExpression` handling for RegExp
   - Validate RegExp constructor arguments

2. **Compiler Changes**:
   - Add `NEW_REGEXP` opcode
   - Compile RegExp constructor calls

3. **VM Changes**:
   - Add `NewRegexpHandler`
   - Handle string-to-regex conversion
   - Validate flags parameter

#### E2E Test:
```typescript
function main() {
  console.log("Testing RegExp constructor");
  var pattern = new RegExp("test", "gi");
  console.log("Pattern: " + pattern.source);
  console.log("Global: " + pattern.global);
  console.log("IgnoreCase: " + pattern.ignoreCase);
  return 0;
}
```

---

## TDD Atomic Block 3: regex.test() Method

### **Test Scope**: `pattern.test(string)` returns boolean
### **Success Criteria**: Basic pattern matching works correctly

#### Test Files to Create:
- `packages/vm/src/lib/__tests__/regex-test.test.ts`
- `test/programs/regex/regex-test-method.ts`

#### Test Cases:
```typescript
// Basic test
var emailPattern = /\w+@\w+\.\w+/;
var validEmail = emailPattern.test("user@example.com");     // true
var invalidEmail = emailPattern.test("invalid-email");     // false

// Case sensitivity
var caseSensitive = /Hello/;
var caseInsensitive = /Hello/i;
console.log(caseSensitive.test("hello"));     // false
console.log(caseInsensitive.test("hello"));   // true

// Global flag behavior
var globalPattern = /test/g;
console.log(globalPattern.test("test test")); // true
console.log(globalPattern.test("test test")); // true (second match)
```

#### Implementation Steps:
1. **Bytecode Changes**:
   - Add `REGEX_TEST` opcode

2. **VM Changes**:
   - Add `RegexTestHandler`
   - Implement `test()` method call
   - Handle global flag state properly

3. **Property Access**:
   - Extend property access to handle regex methods
   - Map `.test` to regex test operation

#### E2E Test:
```typescript
function main() {
  console.log("Testing regex.test() method");
  
  var emailPattern = /\w+@\w+\.\w+/;
  var userInput = CC("Enter an email address:");
  
  if (emailPattern.test(userInput)) {
    console.log("Valid email format");
  } else {
    console.log("Invalid email format");
  }
  
  return 0;
}
```

---

## TDD Atomic Block 4: string.match() Method

### **Test Scope**: `string.match(regex)` returns array or null
### **Success Criteria**: Extract matches from strings

#### Test Files to Create:
- `packages/vm/src/lib/__tests__/string-match.test.ts`
- `test/programs/regex/string-match-method.ts`

#### Test Cases:
```typescript
// Basic match
var text = "Error: File not found";
var errorPattern = /Error:\s+(.+)/;
var match = text.match(errorPattern);
// match = ["Error: File not found", "File not found"]

// No match
var noMatch = "Success".match(/Error/);
// noMatch = null

// Global matches
var globalText = "cat bat rat";
var globalMatches = globalText.match(/\w+at/g);
// globalMatches = ["cat", "bat", "rat"]
```

#### Implementation Steps:
1. **String Method Extension**:
   - Extend existing string method handlers
   - Add `STRING_MATCH` opcode

2. **VM Changes**:
   - Add `StringMatchHandler`
   - Handle match result arrays
   - Handle null return for no matches

3. **Array Support**:
   - Ensure match result arrays work with existing array operations
   - Handle capture groups correctly

#### E2E Test:
```typescript
function main() {
  console.log("Testing string.match() method");
  
  var logLine = "2023-12-01 ERROR: Database connection failed";
  var logPattern = /(\d{4}-\d{2}-\d{2})\s+(ERROR|WARN):\s+(.+)/;
  
  var match = logLine.match(logPattern);
  if (match !== null) {
    console.log("Date: " + match[1]);
    console.log("Level: " + match[2]);  
    console.log("Message: " + match[3]);
  } else {
    console.log("No match found");
  }
  
  return 0;
}
```

---

## TDD Atomic Block 5: regex.exec() Method

### **Test Scope**: `pattern.exec(string)` with global state
### **Success Criteria**: Proper exec() behavior with lastIndex

#### Test Files to Create:
- `packages/vm/src/lib/__tests__/regex-exec.test.ts`
- `test/programs/regex/regex-exec-method.ts`

#### Test Cases:
```typescript
// Basic exec
var pattern = /\d+/;
var result = pattern.exec("abc 123 def");
// result = ["123"] with index properties

// Global exec iteration
var globalPattern = /\w+/g;
var text = "one two three";
var match1 = globalPattern.exec(text); // ["one"]
var match2 = globalPattern.exec(text); // ["two"]  
var match3 = globalPattern.exec(text); // ["three"]
var match4 = globalPattern.exec(text); // null (resets)

// With capture groups
var capturePattern = /(\w+)=(\w+)/;
var configLine = "host=localhost";
var configMatch = capturePattern.exec(configLine);
// configMatch = ["host=localhost", "host", "localhost"]
```

#### Implementation Steps:
1. **Bytecode Changes**:
   - Add `REGEX_EXEC` opcode

2. **VM Changes**:
   - Add `RegexExecHandler`
   - Maintain `lastIndex` property for global regexes
   - Return proper match object structure

3. **Match Object Structure**:
   - Create match arrays with index properties
   - Handle capture groups correctly

#### E2E Test:
```typescript
function main() {
  console.log("Testing regex.exec() method");
  
  var configText = "host=localhost port=3000 debug=true";
  var configPattern = /(\w+)=(\w+)/g;
  var config = {};
  var match;
  
  while ((match = configPattern.exec(configText)) !== null) {
    var key = match[1];
    var value = match[2];
    config[key] = value;
    console.log("Config: " + key + " = " + value);
  }
  
  return 0;
}
```

---

## TDD Atomic Block 6: string.replace() with RegExp

### **Test Scope**: `string.replace(regex, replacement)`
### **Success Criteria**: Pattern-based string replacement

#### Test Files to Create:
- `packages/vm/src/lib/__tests__/string-replace-regex.test.ts`
- `test/programs/regex/string-replace-regex.ts`

#### Test Cases:
```typescript
// Basic replace
var text = "Hello World";
var result = text.replace(/World/, "CVM");
// result = "Hello CVM"

// Global replace
var multiText = "foo bar foo";
var globalResult = multiText.replace(/foo/g, "baz");
// globalResult = "baz bar baz"

// Replacement with capture groups
var dateText = "2023-12-01";
var isoDate = dateText.replace(/(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1");
// isoDate = "01/12/2023"
```

#### Implementation Steps:
1. **Extend String Replace**:
   - Modify existing `STRING_REPLACE` handler
   - Add regex pattern support alongside string patterns

2. **Replacement Logic**:
   - Handle global vs single replacement
   - Support capture group substitution ($1, $2, etc.)

3. **Integration**:
   - Ensure compatibility with existing string.replace()
   - Handle both string and regex first arguments

#### E2E Test:
```typescript
function main() {
  console.log("Testing string.replace() with regex");
  
  var logText = "2023-12-01 10:30:45 ERROR Database connection timeout";
  var cleanLog = logText.replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+/, "");
  console.log("Cleaned: " + cleanLog);
  
  var sensitive = "Password: secret123 Token: abc456";
  var redacted = sensitive.replace(/(\w+):\s*\w+/g, "$1: [REDACTED]");
  console.log("Redacted: " + redacted);
  
  return 0;
}
```

---

## TDD Atomic Block 7: RegExp Properties

### **Test Scope**: Access regex properties (source, flags, global, etc.)
### **Success Criteria**: All standard regex properties work

#### Test Files to Create:
- `packages/vm/src/lib/__tests__/regex-properties.test.ts`
- `test/programs/regex/regex-properties.ts`

#### Test Cases:
```typescript
// Property access
var pattern = /hello/gi;
console.log(pattern.source);       // "hello"
console.log(pattern.global);       // true
console.log(pattern.ignoreCase);   // true
console.log(pattern.multiline);    // false
console.log(pattern.flags);        // "gi"

// lastIndex for global patterns
var globalPattern = /\d+/g;
console.log(globalPattern.lastIndex); // 0
globalPattern.exec("123 456");
console.log(globalPattern.lastIndex); // 3
```

#### Implementation Steps:
1. **Property Handlers**:
   - Add regex property access handlers
   - Support all standard RegExp properties

2. **Integration**:
   - Extend existing property access mechanism
   - Handle regex objects in property lookups

#### E2E Test:
```typescript
function main() {
  console.log("Testing regex properties");
  
  var userPattern = CC("Enter a search pattern:");
  var flags = CC("Enter flags (g, i, m):");
  
  var regex = new RegExp(userPattern, flags);
  
  console.log("Pattern source: " + regex.source);
  console.log("Is global: " + regex.global);
  console.log("Is case insensitive: " + regex.ignoreCase);
  console.log("All flags: " + regex.flags);
  
  return 0;
}
```

---

## TDD Atomic Block 8: Integration & Real-World Scenarios

### **Test Scope**: Complex regex usage in TODO orchestration scenarios
### **Success Criteria**: Real-world patterns work correctly

#### Test Files to Create:
- `test/programs/regex/file-processing-workflow.ts`
- `test/programs/regex/log-analysis-workflow.ts`
- `test/programs/regex/config-validation-workflow.ts`

#### Complex Scenarios:

**File Processing Workflow:**
```typescript
function main() {
  console.log("File Processing with RegExp");
  
  // File filtering patterns
  var jsPattern = /\.js$/;
  var testPattern = /\.test\./;
  var srcPattern = /^src\//;
  
  var files = fs.listFiles(".");
  var jsFiles = [];
  var testFiles = [];
  
  for (var file of files) {
    if (jsPattern.test(file)) {
      jsFiles.push(file);
      
      if (testPattern.test(file)) {
        testFiles.push(file);
      }
    }
  }
  
  console.log("JS files: " + jsFiles.length);
  console.log("Test files: " + testFiles.length);
  
  return 0;
}
```

**Log Analysis Workflow:**
```typescript
function main() {
  console.log("Log Analysis with RegExp");
  
  var logPattern = /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+(ERROR|WARN|INFO)\s+(.+)/;
  var errorPattern = /ERROR/;
  
  var logFile = fs.readFile("app.log");
  if (logFile === null) {
    console.log("No log file found");
    return 1;
  }
  
  var lines = logFile.split("\n");
  var errors = 0;
  var warnings = 0;
  
  for (var line of lines) {
    var match = logPattern.exec(line);
    if (match !== null) {
      var level = match[3];
      var message = match[4];
      
      switch (level) {
        case "ERROR":
          errors++;
          console.log("Error: " + message);
          break;
        case "WARN":
          warnings++;
          break;
      }
    }
  }
  
  console.log("Total errors: " + errors);
  console.log("Total warnings: " + warnings);
  
  return 0;
}
```

#### Implementation Steps:
1. **End-to-End Testing**:
   - Test all regex features together
   - Verify performance with complex patterns
   - Test edge cases and error conditions

2. **Integration Verification**:
   - Ensure regex works with all existing CVM features
   - Test with CC() integration
   - Verify file system integration

3. **Documentation**:
   - Update API documentation
   - Add regex examples to main documentation
   - Update feature list

---

## Implementation Order & Dependencies

### Phase 1: Foundation (Blocks 1-2)
- Basic regex literal parsing
- RegExp constructor support
- **Dependencies**: None
- **Estimated Effort**: 2-3 implementation cycles

### Phase 2: Core Methods (Blocks 3-4)  
- regex.test() method
- string.match() method
- **Dependencies**: Phase 1 complete
- **Estimated Effort**: 2-3 implementation cycles

### Phase 3: Advanced Methods (Blocks 5-6)
- regex.exec() method  
- string.replace() with regex
- **Dependencies**: Phase 2 complete
- **Estimated Effort**: 3-4 implementation cycles

### Phase 4: Polish & Integration (Blocks 7-8)
- RegExp properties
- Real-world integration scenarios
- **Dependencies**: Phase 3 complete
- **Estimated Effort**: 2-3 implementation cycles

## Success Metrics

### Technical Success:
- All E2E tests pass
- No regressions in existing functionality
- Performance acceptable for TODO orchestration use cases

### Mission Success:
- Enables sophisticated input validation via CC()
- Supports complex file pattern matching
- Enables log processing and configuration parsing
- Maintains CVM's simplicity and mission focus

### Code Quality:
- Comprehensive test coverage (>90%)
- Clean integration with existing architecture
- Proper error handling (returns null on failures)
- Documentation examples demonstrate TODO orchestration value

## Risk Mitigation

### Potential Issues:
1. **Regex Complexity**: Start with simple patterns, add complexity gradually
2. **Performance**: Monitor performance with large texts/complex patterns  
3. **Global State**: Carefully handle lastIndex for global regexes
4. **Memory**: Ensure regex objects are properly garbage collected

### Mitigation Strategies:
- Atomic TDD blocks prevent feature creep
- E2E tests catch integration issues early
- Performance benchmarks in each block
- Memory usage monitoring in integration tests

This implementation plan maintains CVM's mission focus while adding powerful pattern matching capabilities essential for sophisticated TODO orchestration workflows.