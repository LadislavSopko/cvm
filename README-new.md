# CVM: Turn Claude into a Systematic Processor

**Stop writing fragile AI scripts. Write programs that Claude executes one thought at a time.**

[![npm version](https://badge.fury.io/js/cvm-server.svg)](https://www.npmjs.com/package/cvm-server)

```text
         TRADITIONAL SCRIPT                                    CVM
         ─────────────────                                    ───
         
         for file in files:                                   for file in files:
           claude.call("analyze")                                CC("analyze file")
                │                                                      │
                └─> PUSH to Claude                                     V
                                                               [ CVM PAUSES & WAITS ]
         (Amnesia on each call)                                        ^         │
         Human locked out                                              │         │ 2. "analyze file"
         State is fragile                                    1. getTask()        V
                                                               [ Claude pulls task ]
                                                                       │         │
                                                             3. submits result   │ 4. CVM continues
                                                                       └─────────┘
```

## See It In Action: From Fragile to Resilient

**Without CVM**, you manually chain calls. If it crashes, state is lost:

```typescript
// Fragile, stateless, and hard to inspect
const result1 = await claude.call("Step 1: Analyze this");
const result2 = await claude.call("Step 2: Based on '" + result1 + "', do this");
// If this fails, you have to start over from scratch
```

**With CVM**, you write a simple program. The VM manages state:

```typescript
// Resilient, stateful, and observable
function main() {
  const step1 = CC("Step 1: Analyze this");
  const step2 = CC("Step 2: Based on '" + step1 + "', do this");
  return step2;
}
```

The magic: CVM saves `step1` before moving to `step2`. You can stop, inspect, and resume anytime.

## Try It Now

Save this as `counter.ts`:

```typescript
function main() {
  let count = 0;
  while (count < 5) {
    const next = CC("Current number is " + count + ". What's the next number?");
    count = +next;
  }
  return count;
}
```

Tell Claude: **"Run counter.ts with CVM"**

What happens:
1. CVM loads your program and starts execution
2. At each `CC()`, CVM pauses and waits
3. Claude pulls the next task: "Current number is 0. What's the next number?"
4. Claude submits "1"
5. CVM updates `count` and continues the loop
6. Repeat until done

## The Paradigm Shift: Claude as the CPU

Think of it this way:
- **Your Code** = The motherboard (defines logic and structure)
- **CVM** = The RAM (holds all variables and state)
- **Claude** = The CPU (processes each `CC()` instruction)
- **You** = The operator (can inspect state anytime)

Traditional scripts treat Claude as a service. CVM treats Claude as a processor.

## CC() is a PAUSE, Not a Call

`CC(prompt)` doesn't mean "call Claude." It means:
1. **Package** the prompt into a task
2. **PAUSE** the program at this exact spot
3. **WAIT** for Claude to pull this task
4. **RESUME** with the result when Claude provides it

It's like `yield` in Python or `await` in JavaScript, but for cognitive tasks.

## Real-World Example

```typescript
function main() {
  const files = fs.listFiles("./docs");
  const summaries = []; // State lives safely in CVM
  
  for (const file of files) {
    // PAUSE: Ask Claude to summarize this file
    const content = CC("Read and summarize: " + file);
    summaries.push({ filename: file, summary: content });
    // CVM automatically resumes here with content
  }
  
  // PAUSE: Ask Claude to create final report
  const report = CC("Create report from: " + JSON.stringify(summaries));
  return report;
}
```

CVM turns this into a resilient workflow. If it fails on file 500 of 1000, the first 499 summaries are safely stored in CVM's state.

## Why Not Just Write a Python Script?

| Your Script | CVM |
| :--- | :--- |
| ❌ **Stateless:** Each API call starts fresh | ✅ **Stateful:** All variables persist automatically |
| ❌ **Fragile:** Crash = start over | ✅ **Resilient:** State survives, resume anytime |
| ❌ **Opaque:** Can't see progress | ✅ **Observable:** Check status anytime |
| ❌ **Rigid:** Can't intervene | ✅ **Flexible:** Paused by default at each CC() |

## Installation

Add to Claude's MCP settings:

```json
{
  "mcpServers": {
    "cvm": {
      "command": "npx",
      "args": ["cvm-server@latest"]
    }
  }
}
```

## Core Concepts

**Language**: TypeScript-like with:
- Variables, loops, conditionals
- Arrays, objects, JSON operations
- `CC()` for cognitive tasks
- `fs.listFiles()` for file operations
- `console.log()` for output

**How Claude Interacts**:
- `load(programId, source)` - Load a program
- `start(programId, executionId)` - Start execution
- `getTask(executionId)` - Pull next task
- `submitTask(executionId, result)` - Submit result
- `status(executionId)` - Check state anytime

[→ Full API Documentation](docs/API.md)

## The Key Insight

CVM doesn't make Claude smarter. It makes Claude systematic.

Without CVM: Brilliant but chaotic
With CVM: Brilliant with perfect memory and a checklist

---

Copyright 2025 Ladislav Sopko. Licensed under Apache 2.0.