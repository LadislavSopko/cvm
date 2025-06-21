# CVM - Cognitive Virtual Machine

**A deterministic execution environment that lets Claude (and other AI) run stateful, observable programs through the Model Context Protocol.**

[![npm version](https://badge.fury.io/js/cvm-server.svg)](https://www.npmjs.com/package/cvm-server)

## 🚀 Quick Start

```bash
npx cvm-server@latest
```

## ⚠️ Add to .gitignore
```gitignore
# CVM data directory
.cvm/
```

---

## 🎯 What CVM Is

CVM is **NOT** another AI coding assistant or framework. It's a **deterministic virtual machine** that Claude controls through MCP tools.

Think of it as **giving Claude a calculator**: Claude can load programs, execute them step by step, and handle complex stateful logic without having to keep everything in context.

## 🤔 The Problem CVM Solves

When Claude tries to do complex, stateful tasks, several problems arise:

- **🧠 Context Limits**: Complex state quickly fills up Claude's context window
- **🔁 Repetitive Logic**: Simple loops require multiple expensive LLM calls  
- **🐛 Non-Deterministic**: Same task might produce different results
- **👀 No Observability**: Hard to debug what actually happened
- **💾 No Persistence**: State is lost between conversations

## ✨ How CVM Works

```
┌─────────────┐                    ┌─────────────┐
│   Claude    │                    │     CVM     │
│  (via MCP)  │                    │   Server    │
└─────────────┘                    └─────────────┘
      │                                   │
      │  1. load(program)                │
      ├──────────────────────────────────>│
      │                                   │
      │  2. start(executionId)           │
      ├──────────────────────────────────>│
      │                                   │
      │  3. getTask() - loop until done  │
      ├──────────────────────────────────>│
      │                                   │
      │  4. submitTask(result)           │
      ├──────────────────────────────────>│
```

1. **Claude loads a program** - TypeScript-like syntax with deterministic execution
2. **CVM executes deterministically** - Variables, loops, conditionals work perfectly
3. **When CVM hits `CC()`** - It pauses and asks Claude for cognitive input
4. **Claude provides the answer** - CVM continues with that result
5. **Repeat until complete** - Deterministic + cognitive reasoning combined

## 🔥 Key Benefits

### 🎮 **Deterministic Execution**
- Same program always produces the same result
- Perfect for testing and reliable automation
- No "it worked yesterday" problems

### 📊 **Stateful Programming**
- Variables, arrays, and objects that persist
- Complex logic without context window bloat
- Real programming constructs (loops, conditionals)

### 👁️ **Full Observability**
- Complete execution trace of every step
- Debug exactly what happened and when
- Audit trails for critical processes

### 💰 **Cost Efficient**
- One LLM call to load the program
- Deterministic execution runs locally
- Only cognitive tasks require Claude

### 🔄 **Cognitive + Deterministic**
- Best of both worlds: logic + reasoning
- Claude handles creative/analytical tasks
- CVM handles data processing and control flow

## 📝 Simple Example

Instead of Claude juggling state across multiple messages:

```typescript
function main() {
  const scores = [];
  
  for (let i = 0; i < 3; i++) {
    const score = CC("Rate this article from 1-10: " + articles[i]);
    scores.push(parseInt(score));
  }
  
  const average = scores.reduce((a, b) => a + b) / scores.length;
  console.log("Average score: " + average);
  
  if (average > 7) {
    const summary = CC("Write a summary of these highly-rated articles");
    console.log("Summary: " + summary);
  }
}
```

**What happens:**
- CVM handles the loop, array, and math deterministically
- Claude only gets called for the cognitive tasks (rating, summarizing)
- State persists perfectly throughout execution
- Full execution trace available for debugging

## 🆚 CVM vs. Other Solutions

| Approach | State Management | Determinism | Cost | Debugging |
|----------|-----------------|-------------|------|-----------|
| **Pure Claude** | Context window | ❌ Non-deterministic | 💸 High | 🤷 Black box |
| **LangChain/AutoGen** | External state | ❌ Non-deterministic | 💸 High | 🔍 Limited |
| **Code Interpreters** | Session-based | ⚠️ Environment dependent | 💰 Medium | 🔧 Complex |
| **CVM** | Built-in VM | ✅ Fully deterministic | 💚 Low | 👁️ Complete |

## 🚀 Installation & Setup

### As an MCP Server (Recommended)

Add to your `.mcp.json`:
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

### Global Installation
```bash
npm install -g cvm-server
cvm-server
```

## 📚 Language Features

CVM supports a TypeScript-like language with:

- **✅ Variables & Types**: `let`, `const`, strings, numbers, booleans, arrays
- **✅ Control Flow**: `if/else`, `while`, `for-of` loops, `break`, `continue`
- **✅ Operators**: Arithmetic, comparison, logical, string concatenation
- **✅ String Operations**: `.length`, `.substring()`, `.split()`, etc.
- **✅ Array Operations**: Literals, indexing, `.push()`, `.length`
- **✅ Cognitive Calls**: `CC("prompt")` for AI reasoning
- **✅ File System**: `fs.listFiles()` with sandboxing
- **✅ Output**: `console.log()` for results

[→ **Full API Documentation**](docs/API.md)

## 🛠️ Available MCP Tools

When CVM is connected, Claude gets these tools:

- **`load(programId, source)`** - Load a TypeScript program
- **`start(programId, executionId)`** - Start program execution  
- **`getTask(executionId)`** - Get next cognitive task or completion
- **`submitTask(executionId, result)`** - Provide cognitive response
- **`status(executionId)`** - Check execution state

## 🏗️ Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CVM_STORAGE_TYPE` | Storage backend: "file" or "mongodb" | "file" |
| `CVM_DATA_DIR` | Directory for file storage | ".cvm" |
| `CVM_LOG_LEVEL` | Logging level | "info" |
| `MONGODB_URI` | MongoDB connection string | - |

## 🧪 Real-World Use Cases

- **📊 Data Processing**: Complex analysis with cognitive insights
- **🔄 Workflow Automation**: Deterministic steps with AI decision points
- **📝 Content Generation**: Structured content with AI creativity
- **🧮 Calculations**: Math + reasoning in one seamless flow
- **📋 Report Generation**: Systematic data gathering + AI analysis

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

Copyright 2024 Ladislav Sopko

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

---

**Ready to give Claude superpowers?** [Get started with CVM →](#-quick-start)