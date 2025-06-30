
# Project: CVM

## 🎯 CVM's Mission

**CVM is an algorithmic TODO manager for Claude.** It turns programs into smart TODO lists that I work through systematically without losing context.

## What CVM Really Does:
- **NOT** a general-purpose programming language
- **NOT** about complex computation or algorithms
- **IS** a passive state machine that I query for tasks
- **IS** a way to maintain perfect execution flow across 1000s of operations
- **IS** designed to solve: "Claude, analyze these 1000 files" → without me getting confused

## Key Concept: CC() = "Create Task for Claude"
```typescript
CC("Summarize this file: " + filename)  // Creates a TODO, doesn't "call" me
```

## Architecture:
```
Claude → asks "what's next?" → CVM gives task → Claude completes → repeat
```
