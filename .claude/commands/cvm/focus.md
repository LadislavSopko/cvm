# CVM Focus - Initialize Claude's Context

Use `/mcp__cvm__restart` to load the focus program:
- programId: "focus"
- filePath: "test/programs/focus.ts"

if not loaded :

Use `/mcp__cvm__loadFile` to load the focus program:
- programId: "focus"
- filePath: "test/programs/focus.ts"

Then use `/mcp__cvm__start` to run it:
- programId: "focus"
- executionId: "focus-session"
- setCurrent: true

Finally, repeat  `/mcp__cvm__getTask` until no more tasks there last session id is current so no need to call it every time. 