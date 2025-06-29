# CVM: Turn Claude into a Systematic Processor

**Stop writing fragile AI scripts. Write programs that Claude executes one thought at a time.**

[![npm version](https://badge.fury.io/js/cvm-server.svg)](https://www.npmjs.com/package/cvm-server)

**TRADITIONAL SCRIPT**

🔘 Gray = Script Operations

```mermaid
flowchart TD
    Start([Start]) --> Loop{More files?}
    Loop -->|Yes| Call[Call Claude API]
    Call --> Response[Get Response]
    Response --> Lost[❌ Context Lost]
    Lost --> Loop
    Loop -->|No| End([End])
    
    Response -.->|Crash| Restart[Start Over From Beginning]
    
    classDef script fill:#e0e0e0,stroke:#666,color:#000
    
    class Start,Loop,Call,Response,Lost,End,Restart script
```

**CVM ARCHITECTURE**

🟢 Green = CVM Operations | 🔵 Blue = Claude Actions | 🟡 Yellow = Human Control

```mermaid
flowchart TD
    Start([Start]) --> Loop{More files?}
    Loop -->|Yes| CC[CC: analyze file]
    CC --> Pause((⏸️ PAUSE))
    Pause --> Wait[Wait for Claude]
    Wait --> GetTask[Claude: getTask]
    GetTask --> Process[Claude processes]
    Process --> Submit[Claude: submitTask]
    Submit --> Save[✓ State saved]
    Save --> Loop
    Loop -->|No| End([End])
    
    Pause -.->|Can inspect| Status[Check Progress]
    Submit -.->|Crash| Resume[Resume from here]
    
    classDef cvm fill:#d4ffd4,stroke:#090,color:#000
    classDef claude fill:#d4d4ff,stroke:#00d,color:#000
    classDef human fill:#ffffd4,stroke:#990,color:#000
    
    class Start,Loop,CC,Pause,Wait,Save,End cvm
    class GetTask,Process,Submit claude
    class Status,Resume human
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

```mermaid
graph LR
    subgraph "CVM as a Computer"
        CODE["📜 Your Code<br/>(Motherboard)"]-->|"defines logic<br/>& structure"| CVM["💾 CVM<br/>(RAM)"]
        CVM-->|"holds state<br/>& variables"| CLAUDE["🧠 Claude<br/>(CPU)"]
        CLAUDE-->|"processes each<br/>CC() instruction"| CVM
        YOU["👤 You<br/>(Operator)"]-."inspect state<br/>anytime".->CVM
    end
```

Traditional scripts treat Claude as a service. CVM treats Claude as a processor.

## CC() is a PAUSE, Not a Call

`CC(prompt)` doesn't mean "call Claude." It means:

```mermaid
stateDiagram-v2
    [*] --> Package: CC(analyze this)
    Package --> PAUSE: Create task
    PAUSE --> WAIT: Execution stops here
    WAIT --> PULL: Claude calls getTask
    PULL --> PROCESS: Claude processes
    PROCESS --> RESUME: Claude submits result
    RESUME --> [*]: Continue with result
    
    state Package {
        [*] --> p1: Package prompt
        p1 --> p2: Into task object
    }
    
    state PAUSE {
        [*] --> pause: ⏸️ Program paused
        pause --> save: State saved
    }
    
    state WAIT {
        [*] --> waiting: 🔄 Waiting for Claude
    }
```

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

```mermaid
flowchart TD
    START([Start]) --> LIST[fs.listFiles]
    LIST --> INIT[summaries = empty array]
    INIT --> LOOP{For each file}
    
    LOOP -->|Has files| CC1[CC: Read and summarize file]
    CC1 --> PAUSE1[⏸️ CVM Pauses]
    PAUSE1 --> CLAUDE1[Claude pulls task]
    CLAUDE1 --> SUMMARY[Claude returns summary]
    SUMMARY --> SAVE[Push to summaries array]
    SAVE --> LOOP
    
    LOOP -->|No more files| CC2[CC: Create final report]
    CC2 --> PAUSE2[⏸️ CVM Pauses]
    PAUSE2 --> CLAUDE2[Claude creates report]
    CLAUDE2 --> RETURN[Return report]
    RETURN --> END([End])
    
    CRASH{{If crash at file 500}} -.-> STATE[(CVM State:<br/>499 summaries<br/>preserved)]
    STATE -.-> RESUME[Can resume<br/>from file 500]
    
```

CVM turns this into a resilient workflow. If it fails on file 500 of 1000, the first 499 summaries are safely stored in CVM's state.

## Why Not Just Write a Python Script?

```mermaid
graph LR
    subgraph YourScript["Your Script"]
        S1[❌ Stateless]
        S2[❌ Fragile]
        S3[❌ Opaque]
        S4[❌ Rigid]
        
        S1 --> API1[API Call 1]
        API1 --> S2
        S2 --> API2[API Call 2]
        API2 --> S3
        S3 --> CRASH[💥 Crash = Start Over]
    end
    
    subgraph CVMArch["CVM"]
        C1[✅ Stateful]
        C2[✅ Resilient]
        C3[✅ Observable]
        C4[✅ Flexible]
        
        C1 --> TASK1[Task 1]
        TASK1 --> STATE1[(State Preserved)]
        STATE1 --> TASK2[Task 2]
        TASK2 --> STATE2[(State Updated)]
        STATE2 --> PAUSE[⏸️ Can Pause/Resume]
    end
    
```

| Your Script | CVM |
| :--- | :--- |
| ❌ **Stateless:** Each API call starts fresh | ✅ **Stateful:** All variables persist automatically |
| ❌ **Fragile:** Crash = start over | ✅ **Resilient:** State survives, resume anytime |
| ❌ **Opaque:** Can't see progress | ✅ **Observable:** Check status anytime |
| ❌ **Rigid:** Can't intervene | ✅ **Flexible:** Paused by default at each CC() |

## How It Works Under the Hood

CVM is a passive MCP server. Claude actively drives execution:

```mermaid
sequenceDiagram
    participant Claude
    participant CVM
    participant State as CVM State
    
    Claude->>CVM: load("counter", "...program code...")
    CVM->>State: Store program
    
    Claude->>CVM: start("counter", "exec-123")
    CVM->>State: Initialize count = 0
    
    loop While count < 5
        Claude->>CVM: getTask("exec-123")
        CVM-->>Claude: "Current number is 0. What's the next number?"
        Claude->>Claude: Process task
        Claude->>CVM: submitTask("exec-123", "1")
        CVM->>State: count = 1
        Note over CVM: Continue loop execution
    end
    
    Claude->>CVM: getTask("exec-123")
    CVM-->>Claude: "Execution completed with result: 5"
```

**CVM is completely passive** - it never initiates anything. Claude drives everything.

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

**State Management**: While Claude processes tasks, CVM maintains:
- All variables and their values
- Current execution position
- Loop counters and conditions
- Arrays, objects, and complex data structures

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

## Use Cases

Perfect for any workflow where Claude needs to process many items systematically:
- Document analysis pipelines
- Data extraction from multiple sources
- Report generation with multiple inputs
- Code refactoring across many files
- Any task requiring loops with AI processing

[→ Full API Documentation](docs/API.md)

## The Key Insight

CVM doesn't make Claude smarter. It makes Claude systematic.

Without CVM: Brilliant but chaotic
With CVM: Brilliant with perfect memory and a checklist

---

Copyright 2025 Ladislav Sopko. Licensed under Apache 2.0.