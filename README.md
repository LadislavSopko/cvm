# CVM: Stateful Task Engine for Claude

**Stop Claude from losing track. CVM is a passive state machine that Claude queries for tasks, maintaining perfect execution flow across complex operations.**

[![npm version](https://badge.fury.io/js/cvm-server.svg)](https://www.npmjs.com/package/cvm-server)

## The Problem

"Claude, analyze these 1000 files and create a report" → Claude gets confused, loses context, forgets what it's doing.

## The Solution

CVM is a passive MCP server that holds program state. You write a program with loops and logic, but Claude only sees one task at a time. Claude asks "what's next?", completes the task, and asks again.

The magic: CVM never pushes tasks. Claude pulls tasks when ready, maintaining perfect control while CVM quietly manages state between requests.

## What CVM Really Is

CVM is an **algorithmic TODO manager**. Think of it as:
- A TODO list that can have loops ("do this 5 times")
- A TODO list that can have conditions ("if X then do Y") 
- A TODO list that maintains variables between tasks
- A TODO list shaped like a program

When your program hits `CC("analyze this file")`, CVM doesn't call Claude. Instead:
1. CVM creates a TODO: "analyze this file"
2. CVM pauses execution and waits
3. Claude asks CVM: "What should I do next?"
4. CVM responds: "analyze this file"
5. Claude does the analysis and submits the result
6. CVM updates its state and moves to the next instruction

**CVM is completely passive** - it never initiates anything. Claude drives everything.

## Try It Now

Save this as `counter.ts`:
```typescript
function main() {
  let count = 0;
  while (count < 5) {
    const next = CC("Current number is " + count + ". What's the next number?");
    count = +next;
    console.log("Count is now: " + count);
  }
  return count;  // Returns 5
}
main();
```

Then tell Claude: **"Run counter.ts with CVM"**

What actually happens:
- CVM loads the program and starts execution
- When it hits `CC()`, CVM creates a task and waits
- Claude asks CVM for tasks using `getTask()`
- CVM gives Claude: "Current number is 0. What's the next number?"
- Claude figures out the answer is "1" and submits it
- CVM continues the loop with count=1
- Process repeats until done

## How It Works

CVM is a passive MCP server. Claude actively drives execution:

```
Claude: load("counter", "...program code...")
Claude: start("counter", "exec-123")
Claude: getTask("exec-123") → CVM: "Current number is 0. What's the next number?"
Claude: submitTask("exec-123", "1") → CVM sets count=1, continues loop
Claude: getTask("exec-123") → CVM: "Current number is 1. What's the next number?"
Claude: submitTask("exec-123", "2") → CVM sets count=2, continues loop
...
Claude: getTask("exec-123") → CVM: "Execution completed with result: 5"
```

## Why This Architecture

**Traditional approach**: Claude tries to maintain state in its context window
- ❌ Loses track in complex flows
- ❌ Forgets variables between steps
- ❌ Can't handle real loops or conditions reliably

**CVM approach**: State lives in CVM, Claude just processes individual tasks
- ✅ Perfect state management
- ✅ Real loops and conditions that work
- ✅ Claude's context stays clean
- ✅ Complex workflows become simple task sequences

## Real Example

```typescript
function main() {
  const files = fs.listFiles("./docs", { filter: "*.txt" });
  const summaries = [];
  
  for (const file of files) {
    // This creates a task for Claude, doesn't "call" Claude
    const content = CC("Read and summarize this file: " + file);
    // Now we can use objects!
    summaries.push({
      filename: file,
      summary: content
    });
    console.log("Processed: " + file);
  }
  
  // Convert summaries array to JSON for the final task
  const summariesJson = JSON.stringify(summaries);
  const report = CC("Create a final report from these file summaries: " + summariesJson);
  console.log("Final Report: " + report);
  
  return report;
}
main();
```

CVM turns this into a dynamic TODO list:
1. Task: "Read and summarize this file: ./docs/file1.txt"
2. Task: "Read and summarize this file: ./docs/file2.txt"
3. Task: "Read and summarize this file: ./docs/file3.txt"
4. Task: "Create a final report from these summaries: [...]"

Claude works through these tasks one by one, while CVM maintains the loop state, the summaries array, and the execution position.

## Key Concepts

### CC() - Cognitive Context
`CC(prompt)` doesn't mean "call Claude". It means:
- Create a task with this prompt
- Pause execution here
- Wait for Claude to ask for the next task
- Resume when Claude provides a result

### CVM is Passive
- CVM never sends messages to Claude
- CVM never initiates actions
- CVM only responds when Claude asks
- Claude drives everything via MCP tools

### State Management
While Claude processes tasks, CVM maintains:
- All variables and their values
- Current execution position
- Loop counters and conditions
- Arrays, objects, and complex data structures

## Installation

Add to Claude's `.mcp.json`:
```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server@latest"],
      "env": {
        "CVM_STORAGE_TYPE": "file",
        "CVM_DATA_DIR": ".cvm"
      }
    }
  }
}
```

## MCP Tools

Claude uses these tools to interact with CVM:

- **`load(programId, source)`** - Load a program into CVM
- **`loadFile(programId, filePath)`** - Load from file
- **`start(programId, executionId)`** - Start execution
- **`getTask(executionId)`** - Get next task (CVM waits for this)
- **`submitTask(executionId, result)`** - Submit task result
- **`status(executionId)`** - Check execution state

## Language Features

CVM executes a TypeScript-like language:
- Variables, arrays, objects, loops, conditions
- String/array operations
- Object literals and property access
- `JSON.stringify()` and `JSON.parse()`
- `CC()` for task creation
- `fs.listFiles()` for file operations
- `console.log()` for output

[→ Full API Documentation](docs/API.md)

## Use Cases

Perfect for any workflow where Claude needs to process many items systematically:
- Document analysis pipelines
- Data extraction from multiple sources
- Report generation with multiple inputs
- Any task requiring loops with AI processing

## Summary

CVM is a passive, stateful task engine. It turns programs into smart TODO lists that Claude can work through systematically without losing context. The program defines the workflow, Claude provides the intelligence, and CVM quietly maintains the state between them.

---

Copyright 2024 Ladislav Sopko. Licensed under Apache 2.0.