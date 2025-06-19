# CVM Execution Model

## Critical Understanding

**CVM is NOT active - it's a passive state machine driven entirely by the AI.**

## Execution Flow

```
AI (Claude) drives everything:
1. load(program) → CVM compiles and stores
2. start(execution) → CVM initializes state
3. getTask() → CVM returns next task or "no task"
4. submitTask(result) → CVM processes result
5. Repeat getTask() until program completes
```

## Key Points

- **CVM NEVER initiates communication**
- **CVM NEVER "calls" the AI**
- **AI must continuously poll via getTask()**
- **CC() is just a task type, not a "call"**

## What CC() Really Is

When CVM encounters `CC("prompt")`:
1. It stores the prompt in execution state
2. It waits for AI to call getTask()
3. It returns: `{ type: "CC", prompt: "..." }`
4. It waits for AI to submitTask(result)
5. It continues execution with the result

## Common Misconceptions

❌ "CVM calls the AI when it hits CC()"
✅ CVM waits for AI to ask what to do next

❌ "CC stands for Cognitive Call to AI"
✅ CC is just an instruction that becomes a task

❌ "CVM pauses and returns control to AI"
✅ CVM always waits; AI always has control

## Implementation in Practice

```typescript
// What happens in Claude's execution loop:
while (true) {
  const task = await getTask(executionId);
  
  if (!task) {
    // CVM is executing internal operations
    continue;
  }
  
  if (task.type === 'CC') {
    const response = processPrompt(task.prompt);
    await submitTask(executionId, response);
  }
  
  if (task.type === 'completed') {
    break;
  }
}
```

## Remember for Next Session

When you (Claude) see CVM next time:
1. YOU drive the execution
2. YOU pull tasks from CVM
3. YOU push results to CVM
4. CVM is just responding to your requests
5. Check README.md for the execution flow diagram