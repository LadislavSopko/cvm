# CVM Quick Start Guide

## What is CVM?

CVM (Cognitive Virtual Machine) is a bytecode VM that executes programs combining traditional control flow with AI operations via Claude.

## Core Concept

Instead of complex prompts, write simple programs:
```javascript
let email = "URGENT: Server down!";
let urgent = CC("Is this urgent? yes/no: " + email);
if (urgent == "yes") {
  let response = CC("Write urgent response to: " + email);
  print(response);
}
```

## Key Components

1. **Parser**: Converts source → bytecode
2. **VM**: Executes bytecode, pauses at CC calls
3. **MongoDB**: Persists state between CC calls
4. **MCP Server**: Communicates with Claude

## Development Steps

### 1. Setup Project
```bash
mkdir cvm
cd cvm
npm init -y
npm install typescript mongodb @types/node vitest @vitest/ui
```

### 2. Start with Phase 1
- Implement basic VM (8 opcodes)
- Add MongoDB state persistence
- Build minimal parser (let, CC, print)
- Create MCP server
- Test with simple program

### 3. Verify Foundation
Before moving forward, ensure:
- ✅ Can parse: `let x = CC("test"); print(x);`
- ✅ VM pauses at CC instruction
- ✅ State saves to MongoDB
- ✅ Can resume after CC result
- ✅ MCP protocol works

### 4. Add Features Incrementally
- Phase 2: Add if/else
- Phase 3: Add loops
- Phase 4: Add functions
- Phase 5: Add collections

## MongoDB Setup

```javascript
// Collections needed
db.programs     // Stored programs
db.executions   // Execution states
db.cc_history   // CC call history
db.logs         // Execution logs
```

## Testing Approach

1. **Unit tests first** - Test each component
2. **Integration tests** - Test complete flow
3. **Manual testing** - Test with Claude via MCP

## Architecture Rules

1. **No AST execution** - Always compile to bytecode
2. **MongoDB for all state** - No in-memory only state
3. **Single CC command** - Just CC(prompt)
4. **No refactoring** - Build it right first time

## First Milestone

Execute this program successfully:
```javascript
let message = "Hello Claude!";
let response = CC("Respond cheerfully to: " + message);
print("Claude says: " + response);
```

## Common Pitfalls to Avoid

1. **Over-engineering** - Start simple
2. **Skipping tests** - TDD is crucial
3. **Complex opcodes** - Keep bytecode minimal
4. **Memory-only state** - Always persist to MongoDB
5. **Feature creep** - Stick to roadmap phases

## Need Help?

1. Check SPECIFICATION.md for language details
2. Check ARCHITECTURE.md for system design
3. Check CLAUDE_PROMPTS.md for implementation prompts
4. Test with EXAMPLES.md programs

## Success Criteria

You know Phase 1 is complete when:
- Simple programs execute
- CC calls work with pause/resume
- State persists across restarts
- MCP integration is functional
- All tests pass

Then and only then, move to Phase 2!