# CVM Testing Strategy

## Overview
Testing CVM requires special consideration because of the cognitive interrupt (CC) mechanism. Programs will hang at CC instructions unless there's an active client responding to them.

## Test Client Requirements
A test client must:
1. Connect to CVM server via MCP protocol (JSON-RPC over stdio)
2. Continuously poll `getTask` to check execution state
3. When state is `AWAITING_COGNITIVE_RESULT`, provide a response via `submitTask`
4. Continue until execution is `COMPLETED` or `ERROR`

## Test Design Principles
Since test clients can only provide pre-programmed responses:
- Design tests with predictable CC prompts
- Use simple responses that don't require intelligence
- Test the mechanism, not the cognitive quality

Example test-friendly program:
```typescript
function main() {
  // Simple prompt with any response acceptable
  const name = CC("Enter test name:");
  console.log("Name: " + name);
  
  // Numeric prompt where any number works
  const count = CC("Enter count:");
  console.log("Count: " + count);
}
```

## Output Testing
As of the recent refactoring:
- Console.log output is stored separately from execution state
- FileStorageAdapter writes to `.cvm/outputs/{executionId}.output`
- MongoDBAdapter stores in `outputs` collection
- Test clients should verify output files are created correctly

## Integration Test Flow
1. Start CVM server with `CVM_STORAGE=file` for easy testing
2. Load test program via MCP `load` tool
3. Start execution via MCP `start` tool
4. Poll with `getTask` and respond to CC prompts
5. Verify execution completes
6. Check output file exists and contains expected content

## Limitations
- Cannot test complex cognitive reasoning
- Cannot test open-ended creative responses
- Limited to mechanical response patterns
- Best suited for testing VM mechanics, not AI integration