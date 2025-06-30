# CVM Execution Model

## Critical Understanding

**CVM is NOT active - it's a passive state machine driven entirely by the AI.**

## Execution Flow

```
AI (Claude) drives everything via MCP tools:
1. mcp__cvm__load(programId, source) → CVM compiles and stores
2. mcp__cvm__start(programId, executionId) → CVM initializes state
3. mcp__cvm__getTask(executionId) → CVM returns prompt or null
4. mcp__cvm__submitTask(executionId, result) → CVM processes result
5. Repeat getTask() until execution completes
```

## Key Points

- **CVM NEVER initiates communication**
- **CVM NEVER "calls" the AI**
- **AI must poll via getTask() to check for tasks**
- **CC() is just a pause point, not a "call"**

## What CC() Really Is

When CVM encounters `CC("prompt")`:
1. It stores the prompt in execution state
2. It sets state to 'AWAITING_COGNITIVE_RESULT'
3. It waits for AI to call getTask()
4. getTask() returns the prompt string (or null if not waiting)
5. It waits for AI to submitTask(result)
6. It continues execution with the result

## Common Misconceptions

❌ "CVM calls the AI when it hits CC()"
✅ CVM waits for AI to ask what to do next

❌ "CC stands for Cognitive Call"
✅ CC creates a Cognitive Checkpoint - a pause point for AI input

❌ "CVM pauses and returns control to AI"
✅ CVM always waits; AI always has control

## Implementation in Practice

```typescript
// What actually happens in Claude's interaction:
let result = await mcp__cvm__start("myProgram", "exec-123");

while (result.type === 'waiting') {
  // Get the task (CC prompt)
  const task = await mcp__cvm__getTask("exec-123");
  
  if (!task) {
    // No task ready yet (shouldn't happen after 'waiting' result)
    continue;
  }
  
  // Process the cognitive task
  const response = processPrompt(task.prompt);
  
  // Submit the result
  result = await mcp__cvm__submitTask("exec-123", response);
}

// result.type === 'completed' with final return value
// or result.type === 'error' with error message
```

## State Machine View

```
READY → RUNNING → AWAITING_COGNITIVE_RESULT → RUNNING → ... → COMPLETED
                          ↑                        ↓
                          └────── CC() pause ──────┘
```

## MCP Tools Reference

- **`load`**: Load program source code
- **`loadFile`**: Load program from file
- **`start`**: Begin execution (returns initial result)
- **`getTask`**: Get current CC prompt (returns null if not waiting)
- **`submitTask`**: Submit cognitive result (returns next state)
- **`status`**: Check execution state anytime

See [MCP Server README](../../../packages/mcp-server/README.md) for detailed tool documentation.

## Remember for Next Session

When you (Claude) see CVM next time:
1. YOU drive the execution through MCP tools
2. YOU pull tasks from CVM when it reports 'waiting'
3. YOU push results to CVM to continue execution
4. CVM is just responding to your MCP tool calls
5. Check [ARCHITECTURE_UNDERSTANDING.md](./ARCHITECTURE_UNDERSTANDING.md) for system overview