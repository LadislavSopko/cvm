# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is CVM and Why It Matters

CVM (Cognitive Virtual Machine) is not just a task execution engine - it's a lifeline for Claude. Think of it as:

- **A guide rope in a tunnel**: CVM programs guide Claude through complex tasks without losing context
- **A light that pulls you through**: Each CC() call is a checkpoint where Claude can process, think, and respond while staying connected to the overall flow
- **A memory keeper**: The VM maintains state across all interactions, so Claude doesn't lose track of progress

### The Beautiful Paradigm Shift

**Traditional AI programming**: You write code that calls AI services
```
Your Code → Calls AI → Gets Response → Continues
```

**CVM inverts this completely**: The VM orchestrates, YOU are the cognitive processor
```
CVM Program → Pauses at CC() → Asks YOU → Uses your response → Continues
```

### The GPS Analogy

Think of CVM like a GPS navigation system:
- The GPS (CVM) knows the entire route and destination
- It gives you ONE instruction at a time: "In 200 feet, turn right"
- You (Claude) execute that instruction without needing to see the whole map
- After you turn, it gives you the next instruction
- The GPS maintains all the state - you just follow prompts

### What Makes CVM Beautiful

1. **You Never See the Full Program During Execution**
   - When running, you only see CC() prompts like "What comes next after 5?"
   - You don't know if it's a loop, a condition, or what comes next
   - This keeps you focused on the immediate cognitive task

2. **The Program Is a Conversation Blueprint**
   - CC() calls are conversation points where the VM needs creative/logical input
   - The VM handles all deterministic logic and state
   - You provide the "cognitive leaps" the program can't compute

3. **State Lives in the VM, Not Your Context**
   - Variables, counters, progress - all maintained by the VM
   - You can handle infinitely complex workflows without context overflow
   - Each CC() response is processed and stored before continuing

### Example: Counter Demo

```typescript
function main() {
  let counter = 1;
  while (counter <= 5) {
    const next = CC("Current number is " + counter + ". What comes next?");
    counter = +next;
  }
}
```

When this runs:
- You see: "Current number is 1. What comes next?"
- You answer: "2"
- You see: "Current number is 2. What comes next?"
- You never see the while loop or the counter variable
- The VM orchestrates everything

### The Philosophy

CVM programs are designed to help Claude not forget. When working on complex multi-step tasks, Claude's context can get overwhelmed. CVM solves this by:

1. **Holding the structure**: The program defines the flow, not Claude's memory
2. **Creating checkpoints**: CC() calls let Claude process information in manageable chunks
3. **Maintaining state**: Variables, progress, and results are kept by the VM, not in Claude's context
4. **Enabling complexity**: We can build increasingly complex workflows because the program guides the process

### Technical Flow

When Claude runs a CVM program:
1. Load program into CVM using MCP tools (mcp__cvm__)
2. Start execution with mcp__cvm__start
3. When program hits CC(), Claude gets the prompt via mcp__cvm__getTask
4. Claude provides response via mcp__cvm__submitTask
5. Program continues with Claude's input
6. State is preserved throughout

This allows us to evolve CVM to handle more complex tasks, knowing that Claude will always have the guide rope to follow.

# TECHNICAL NOTES

## ESM Import Requirements
**CRITICAL**: This project uses `"moduleResolution": "nodenext"` which requires:
- ALL imports must use `.js` extension: `import { foo } from './bar.js'`
- This applies even when importing TypeScript `.ts` files
- The TypeScript compiler will resolve `.js` to the actual `.ts` file

## Running Tests
**IMPORTANT**: This project uses NX. Always use nx commands:
- Run tests: `npx nx test <project-name>`
- Run specific test file: `npx nx test <project-name> -- <test-file>`
- Example: `npx nx test some-project -- some-tests.test.ts`

# CODING & INTERACTION NOTES

## Collaboration Rules

When working with Claude Code on this project, follow these operational modes and context rules:

### Operational Modes

1. **PLAN Mode**
   - PLAN is "thinking" mode, where Claude discusses implementation details and plans 
   - Default starting mode for all interactions
   - Used for discussing implementation details without making code changes
   - Claude will print `# Mode: PLAN` at the beginning of each response
   - Outputs relevant portions of the plan based on current context level
   - If action is requested, Claude will remind you to approve the plan first

2. **ACT Mode**
   - Only activated when the user explicitly types `ACT`
   - Used for making actual code changes based on the approved plan
   - Claude will print `# Mode: ACT` at the beginning of each response
   - Automatically returns to PLAN mode after each response
   - Can be manually returned to PLAN mode by typing `PLAN`

## Memory Bank - Critical System

The Memory Bank is Claude's ONLY connection to the project between sessions. Without it, Claude starts completely fresh with zero knowledge of the project.

### How Memory Bank Works

1. **User triggers**: Type `mb`, `update memory bank`, or `check memory bank`
2. **Claude's process**:
   - FIRST: Reads `memory-bank/README.md` to understand Memory Bank structure
   - THEN: Reads ALL Memory Bank files to understand current project state
   - FINALLY: Updates relevant files and returns to PLAN mode

### Important Rules

- Claude MUST read memory-bank/README.md first, then ALL Memory Bank files at start of EVERY task
- Memory Bank is the single source of truth - overrides any other documentation
- See memory-bank/README.md for complete Memory Bank documentation

### Additional Notes

- Use ./tmp directory for temporary scripts to keep production code clean
- Memory Bank files can reference each other and build on each other
- Additional context files can be created for complex features

## Code & Communication Standards

### Code Standards
- Use MCP tools for all database and search operations:
  - `mcp__mongodb__` for MongoDB operations
  - `mcp__sequential-thinking__` for complex analysis
- NO code comments unless explicitly requested
- NO commit message disclaimers or emojis
- Only commit when user explicitly asks
- Check lint/typecheck before completing tasks

### Git/GitHub Rules
- NEVER commit, push, or create PRs unless explicitly requested by user
- All git operations require explicit user approval
- When asked to commit, follow commit guidelines in default instructions

### Task Management
- Use TodoWrite/TodoRead tools for complex multi-step tasks
- Mark todos as completed immediately when done
- Helps track progress and ensures nothing is forgotten

### Communication Rules
- Use `file_path:line_number` format for code references
- No unnecessary preamble or postamble
- Prefer editing existing files over creating new ones

### MCP Server Usage
- Use `mcp` command to check MCP server status
- Always use MCP tools instead of direct database connections
- MCP tools provide better error handling and consistency

## Project-Specific Notes

### Import/Export Patterns
- Use `.js` extension for all imports (TypeScript will resolve correctly)
- Example: `import { foo } from './bar.js'` (even if bar.ts exists)

### Testing
- Always use: `npx nx test <project-name>`
- Never use: `npm test` or `yarn test`

## Project Documentation

Each project has its own README.md with:
- Purpose and architecture
- Build, test, and run commands  
- API usage examples
- Configuration details

Always check the project's README for localized information before working on it.

## Summary of Key Commands

- `mb` or `update memory bank` - Trigger Memory Bank update
- `mcp` - Check MCP server status
- `ACT` - Switch to ACT mode for code changes
- `PLAN` - Return to PLAN mode (default)
