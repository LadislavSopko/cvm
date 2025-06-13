# CVM Language Specification

## Language Overview

CVM is a simple language designed for cognitive operations. It starts minimal and grows by adding features without changing the core VM.

## Core Language (Version 1)

### Variables
```javascript
let name = "value";
let result = CC("prompt");
```
- Variables are dynamically typed
- All values stored as strings internally
- Scoped (global initially, function scopes later)

### Cognitive Operations
```javascript
let response = CC("Analyze this: " + data);
```
- Single function: `CC(prompt)`
- Always returns string
- Blocks execution until response received

### Output
```javascript
print("Hello");
print(variable);
```
- Prints to execution output
- Automatically converts to string

### String Operations
```javascript
let combined = "Hello " + name;
```
- String concatenation with `+`

## Future Language Features

### Control Flow (Version 2)
```javascript
if (condition) {
  // statements
}

if (response == "yes") {
  // statements  
} else {
  // statements
}
```

### Loops (Version 3)
```javascript
foreach (item in collection) {
  // statements
}

while (condition) {
  // statements
}
```

### Functions (Version 4)
```javascript
function processEmail(email) {
  let urgent = CC("Is urgent: " + email);
  return urgent;
}

let result = processEmail(data);
```

### Collections (Version 5)
```javascript
let items = ["a", "b", "c"];
let first = items[0];

let map = {
  "key": "value",
  "name": "test"
};
let value = map["key"];
```

## Type System

### Primitive Types
- **string**: All values internally
- **number**: Converted from string when needed
- **boolean**: "true" or "false" strings

### Composite Types (Future)
- **array**: Ordered collection
- **map**: Key-value pairs

## Operators

### Current
- `+` : String concatenation
- `=` : Assignment

### Future
- `==`, `!=` : Equality
- `<`, `>`, `<=`, `>=` : Comparison  
- `&&`, `||`, `!` : Logical
- `-`, `*`, `/` : Arithmetic

## Execution Model

### Program Structure
- Statements execute sequentially
- Execution starts from top
- No main function required initially

### Variable Scope
- Global scope for all variables (v1)
- Function scopes (v4)
- Block scopes in loops (v3)

### Cognitive Execution
1. Evaluate prompt expression
2. VM pauses with prompt
3. External system (Claude) processes
4. Result returned as string
5. Execution continues

## Grammar (EBNF)

### Version 1 Grammar
```ebnf
program     = statement*
statement   = assignment | ccCall | printStmt
assignment  = "let" IDENT "=" expression ";"
ccCall      = "let" IDENT "=" "CC" "(" expression ")" ";"  
printStmt   = "print" "(" expression ")" ";"
expression  = string | IDENT | expression "+" expression
string      = '"' CHAR* '"'
IDENT       = [a-zA-Z_][a-zA-Z0-9_]*
```

## Error Handling

### Syntax Errors
- Missing semicolon
- Unclosed string
- Invalid identifier

### Runtime Errors  
- Undefined variable
- CC timeout
- Stack overflow

## Examples

### Hello World
```javascript
print("Hello World");
```

### Simple CC Call
```javascript
let prompt = "What is 2+2?";
let answer = CC(prompt);
print("Answer: " + answer);
```

### Email Processor (Future)
```javascript
function processEmail(email) {
  let urgent = CC("Is this urgent? Reply yes/no: " + email);
  
  if (urgent == "yes") {
    let response = CC("Write urgent response to: " + email);
    return response;
  } else {
    return "Noted for later";
  }
}

let emails = load("emails.json");
foreach (email in emails) {
  let response = processEmail(email);
  save(response, "response_" + index + ".txt");
}
```