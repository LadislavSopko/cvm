# Development Guide

## Working with CVM

### Project Structure
```
cvm/
├── packages/
│   └── cvm/              # Core VM implementation
│       └── src/
│           ├── vm.ts     # VM execution engine
│           ├── vm-manager.ts  # High-level orchestration
│           ├── parser.ts      # Source → AST
│           └── compiler.ts    # AST → Bytecode
├── apps/
│   └── cvm-server/       # MCP server interface
└── test/
    ├── programs/         # Test CVM programs
    └── integration/      # Integration tests
```

### Development Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Build Project**
```bash
npx nx build cvm
npx nx build cvm-server
```

3. **Run Tests**
```bash
# Run all tests
npx nx test cvm

# Run specific test file
npx nx test cvm -- vm.test.ts

# Run integration tests
cd test/integration && npm test
```

### Writing CVM Programs

#### Basic Template
```typescript
function main() {
  // Your program logic
  const result = CC("Prompt for Claude");
  console.log("Result: " + result);
  return result;
}

main();
```

#### Best Practices
1. **Always validate CC responses**
```typescript
const input = CC("Enter a number:");
const num = parseInt(input);
if (isNaN(num)) {
  console.log("Invalid number, using default");
  num = 0;
}
```

2. **Use meaningful prompts**
```typescript
// Bad
const x = CC("Value?");

// Good
const userName = CC("Please enter the user's full name:");
```

3. **Structure for resumability**
```typescript
// Process items one at a time
for (const file of files) {
  const analysis = CC("Analyze this file: " + file);
  results.push({file: file, analysis: analysis});
  // State saved after each iteration
}
```

### Testing CVM Programs

#### Manual Testing with Claude
```
1. Tell Claude: "Load and run test.ts with CVM"
2. Claude will use mcp__cvm__load and mcp__cvm__start
3. Respond to CC prompts as they appear
4. Check output and final result
```

#### Automated Testing
```typescript
// In test file
const result = await vmManager.execute(programId, executionId, [
  "response1",  // First CC response
  "response2"   // Second CC response
]);
```

### Debugging

#### Check Execution Status
```typescript
mcp__cvm__status({ executionId: "test-1" })
// Returns current state, stack, variables
```

#### Common Issues

1. **"Undefined variable"**
   - Check variable spelling
   - Ensure variable declared before use
   - Note: No hoisting except functions

2. **"Stack underflow"**
   - Usually from syntax errors
   - Check expression structure
   - Verify operator usage

3. **CC not pausing**
   - Ensure CC result is used/stored
   - Check if in dead code path

### Adding Features

#### New Built-in Function
1. Add opcode in `vm.ts`
2. Handle in `executeInstruction()`
3. Add compiler support in `compiler.ts`
4. Add parser recognition if needed
5. Write tests

#### New Language Feature
1. Update parser grammar if needed
2. Add AST node handling in compiler
3. Generate appropriate bytecode
4. Update VM to execute new opcodes
5. Comprehensive testing

### Code Style

- TypeScript with strict mode
- ESM imports with .js extension
- Comprehensive error messages
- Validate inputs at boundaries
- Prefer explicit over implicit

### Common Patterns

#### File Processing
```typescript
function main() {
  const files = fs.list("./docs");
  const summaries = [];
  
  for (const file of files) {
    const content = fs.readFile(file.name);
    if (content) {
      const summary = CC("Summarize: " + content);
      summaries.push(summary);
    }
  }
  
  return summaries;
}
```

#### Interactive Workflow
```typescript
function main() {
  let continue = true;
  const items = [];
  
  while (continue) {
    const item = CC("Enter item (or 'done'):");
    if (item === "done") {
      continue = false;
    } else {
      items.push(item);
    }
  }
  
  return items;
}
```

### Performance Tips

1. **Minimize heap usage** - Large objects impact serialization
2. **Batch operations** - Reduce CC calls when possible
3. **Use appropriate data structures** - Arrays for lists, objects for maps
4. **Clear output periodically** - Output buffer grows with console.log

### Contributing

1. **Follow existing patterns** - Consistency matters
2. **Write tests first** - TDD helps catch edge cases
3. **Document opcodes** - Explain what each does
4. **Update Memory Bank** - Keep documentation current
5. **Consider security** - Maintain sandboxing