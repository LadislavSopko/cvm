# CVM Usage Instructions for Claude

## Overview
The CVM (Cognitive Virtual Machine) server is now available as an MCP tool. You can use it to load and execute CVM programs that combine deterministic logic with AI reasoning.

## Available Tools
The CVM server provides these tools:

### 1. `cvm_loadProgram`
Loads a CVM program from source code.
- Parameters:
  - `programId`: Unique identifier for the program
  - `source`: TypeScript source code (must have a main() function)

### 2. `cvm_startExecution`
Starts executing a loaded program.
- Parameters:
  - `programId`: ID of the program to execute
  - `executionId`: Unique identifier for this execution

### 3. `cvm_getNext`
Gets the next action from the VM (either a CC prompt or completion).
- Parameters:
  - `executionId`: ID of the running execution
- Returns: Either a CC prompt to process, or execution completion

### 4. `cvm_reportCCResult`
Reports the result of processing a CC prompt.
- Parameters:
  - `executionId`: ID of the running execution
  - `result`: The cognitive response to the CC prompt

### 5. `cvm_getExecutionState`
Gets the current state of an execution.
- Parameters:
  - `executionId`: ID of the execution

## Example Usage Flow

1. Load a simple program:
```typescript
function main() {
  const greeting = CC("What's a friendly greeting for a new user?");
  console.log(greeting);
  
  const joke = CC("Tell me a short programming joke");
  console.log(joke);
}
```

2. Start execution with a unique ID

3. Call getNext - it will return the first CC prompt

4. Process the prompt and send back a response with reportCCResult

5. Continue calling getNext and reportCCResult until execution completes

## Example Test Program
Here's a simple test program you can use:

```typescript
function main() {
  console.log("Starting CVM test...");
  
  const name = CC("What's a good name for a virtual machine?");
  console.log("VM Name: " + name);
  
  const feature = CC("What's one cool feature this VM could have?");
  console.log("Cool Feature: " + feature);
  
  console.log("Test complete!");
}
```

## Notes
- Programs must be valid TypeScript with a main() function
- Only string operations are currently supported
- CC() is the cognitive interrupt that pauses execution for AI processing
- All state is persisted in MongoDB between calls