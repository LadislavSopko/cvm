# Claude Implementation Prompts

## Phase 1: Core Foundation

### Prompt 1.1 - Project Setup
```
Create a Node.js TypeScript project structure for CVM with:
- Package.json with needed dependencies (TypeScript, MongoDB driver, Vitest)
- TSConfig for Node.js with ES modules (.js imports)
- Basic folder structure: src/, tests/, docs/
- Vitest configuration for TypeScript
- MongoDB connection module
```

### Prompt 1.2 - Core Types and VM
```
Implement the CVM core types and basic VM:

OpCodes: PUSH, POP, LOAD, STORE, CONCAT, CC, PRINT, HALT
VM needs:
- Instruction type with op, arg, line
- VMState with pc, stack, scopes array, status, output array  
- Scope type with variables Map
- Basic executor that fetches instruction at PC and executes it
- Stack operations push/pop
- Variable load/store searching scopes
- String concat operation
- Status: running, waiting_cc, complete, error

Write comprehensive tests first, then implementation.
```

### Prompt 1.3 - MongoDB State Persistence
```
Add MongoDB state persistence to the VM:
- Save VM state to 'executions' collection
- State includes pc, stack, scopes, status, output
- Save after every instruction initially
- Load state by execution ID
- Handle CC instruction: save with waiting_cc status and prompt
- Resume method that loads state, pushes CC result, continues execution

Test save/load cycle thoroughly.
```

### Prompt 1.4 - Minimal Parser
```
Create a minimal parser that handles:
- Tokenizer: let, =, strings "...", +, CC, (, ), print, identifiers, ;
- Parser: let x = expr; print(expr); let x = CC(expr);
- Expression: string literals, identifiers, concatenation with +
- Generate bytecode instructions from parsed AST

Grammar:
program = statement*
statement = assignment | print
assignment = "let" IDENT "=" expression ";"
print = "print" "(" expression ")" ";"
expression = primary ('+' primary)*
primary = STRING | IDENT | ccCall
ccCall = "CC" "(" expression ")"

Tests first: tokenizer tests, parser tests, bytecode generation tests.
```

### Prompt 1.5 - MCP Server
```
Implement MCP server using JSON-RPC 2.0 over stdio:

Methods needed:
- cvm/loadProgram(source): Parse and store program, return programId
- cvm/startExecution(programId): Create execution, return executionId
- cvm/getNext(executionId): Get next instruction or CC prompt
- cvm/reportCCResult(executionId, result): Report CC result and continue

The server should:
- Read JSON-RPC from stdin
- Parse request, route to method
- Execute appropriate VM operation
- Return JSON-RPC response to stdout

Test with mock stdio streams.
```

### Prompt 1.6 - Integration
```
Create integration test that:
1. Compiles program: let msg = CC("Hello"); print(msg);
2. Starts execution via MCP
3. Receives CC prompt
4. Reports CC result  
5. Continues execution
6. Verifies output

Fix any issues found during integration.
```

## Phase 2: Control Flow

### Prompt 2.1 - Comparison Operations
```
Add comparison to VM and parser:
- Add EQ, NEQ opcodes that pop two values, compare, push "true"/"false"
- Add == and != to tokenizer and parser
- Update expression parser for comparison operators
- Comparisons work on strings only for now

Test comparing strings and CC results.
```

### Prompt 2.2 - If Statement
```
Implement if/else statements:
- Add JUMP (unconditional) and JUMP_IF (pop condition, jump if "true") opcodes
- Parse if (condition) { statements } else { statements }
- Generate bytecode with correct jump addresses
- Handle nested if statements

Bytecode pattern:
  [condition]
  JUMP_IF else_label
  [then statements]
  JUMP end_label
else_label:
  [else statements]  
end_label:

Test single if, if/else, nested if.
```

## Phase 3: Loops

### Prompt 3.1 - While Loop
```
Add while loop support:
- Parse while (condition) { statements }
- Generate loop bytecode:
  loop_start:
    [condition]
    JUMP_IF loop_end
    [body]
    JUMP loop_start
  loop_end:

- Add loop iteration limit for safety
- Test loops with CC calls inside
```

### Prompt 3.2 - Foreach Loop
```
Implement foreach for future collection support:
- Parse foreach (item in collection) { statements }
- For now, error if used (no collections yet)
- Design bytecode pattern for future implementation
- Prepare iterator mechanism in VM
```

## Phase 4: Functions

### Prompt 4.1 - Function Support
```
Add functions to CVM:
- Parse function name(params) { statements; return expr; }
- Add CALL and RETURN opcodes
- CALL: push return address, push new scope, jump to function
- RETURN: pop result, restore scope, jump to return address
- Function table in program structure
- Parameters as local variables

Test function calls, returns, parameter passing.
```

### Prompt 4.2 - Scope Management
```
Implement proper scope chain:
- Each function call pushes new scope
- Variable lookup: current scope → parent scopes → global
- Local variables shadow globals
- Return pops scope
- Test nested function calls and recursion
```

## Phase 5: Collections

### Prompt 5.1 - Arrays
```
Add array support:
- Parse ["a", "b", "c"] literals
- Add ARRAY opcode: pop n items, create array
- Add GET_INDEX: pop array and index, push element
- SET_INDEX: pop array, index, value, update array
- Array stored as JSON internally
- .length property support

Test array creation, access, modification.
```

### Prompt 5.2 - Maps
```
Add map/object support:
- Parse { "key": "value" } literals
- Add MAP opcode: pop n key/value pairs, create map
- GET_PROP: get property by key
- SET_PROP: set property by key
- Stored as JSON internally

Test map operations and nested data structures.
```

## Testing Prompts

### Unit Test Prompt
```
Write comprehensive unit tests for [component]:
- Test happy path
- Test edge cases
- Test error conditions
- Aim for 100% coverage
- Use descriptive test names
- Mock external dependencies
```

### Integration Test Prompt
```
Create integration test for [feature] that:
- Uses real MongoDB connection
- Tests complete flow
- Verifies state persistence
- Handles errors gracefully
- Cleans up test data
```

## Debugging Prompts

### When Stuck
```
I have this test: [test code]
Implementation: [implementation code]
Error: [error message]

The test is failing. What's wrong and how do I fix it while keeping the architecture intact?
```

### Performance Issue
```
This operation is slow: [code]
MongoDB queries: [queries]
How can I optimize this without changing the architecture?
```

## Code Review Prompts

### After Each Phase
```
Review this implementation for:
1. Type safety - any 'any' types that should be specific?
2. Error handling - what errors am I not catching?
3. Edge cases - what inputs could break this?
4. MongoDB efficiency - are queries optimal?
5. Code clarity - what needs better names or comments?
```

## Documentation Prompts

### API Documentation
```
Generate API documentation for [module] including:
- Purpose and overview
- Public methods with parameters and returns
- Usage examples
- Error conditions
- MongoDB collections used
```

## Remember

- Always write tests first
- Keep VM simple and correct
- Don't add features not in current phase
- State must persist properly
- Every CC call must be resumable