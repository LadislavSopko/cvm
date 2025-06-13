# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
