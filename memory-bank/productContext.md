# Product Context - CVM (Cognitive Virtual Machine)

## Mission
Build a deterministic bytecode virtual machine that seamlessly integrates AI cognitive operations into traditional program execution, creating a new paradigm for AI-enhanced programming.

## Vision
Enable developers to write programs that combine deterministic logic with AI reasoning in a predictable, debuggable, and reproducible way.

## Problem Being Solved
Current AI integration in applications is ad-hoc and unpredictable. Developers struggle to:
- Combine deterministic logic with AI reasoning
- Debug AI-enhanced programs
- Ensure reproducible execution paths
- Separate concerns between logic and cognition

## How CVM Works
1. **Deterministic Execution**: Programs run in a bytecode VM with predictable state
2. **Cognitive Interrupts**: CC() instructions pause execution and expose prompts
3. **AI Processing**: External AI agents (like Claude) process prompts and return responses
4. **State Persistence**: MongoDB stores all state, enabling pause/resume across sessions
5. **Clean Protocol**: MCP provides standardized communication between VM and AI

## User Experience Goals
- **Developers** write simple programs combining logic and AI reasoning
- **Programs** execute deterministically with cognitive enhancement
- **Debugging** is straightforward via state inspection in MongoDB
- **AI Agents** of varying capabilities can drive the same programs
- **Execution** can span long periods with persistent state

## Key Innovation
CVM treats AI cognition as a first-class primitive operation, just like arithmetic or I/O in traditional programming languages. This creates a new programming paradigm where deterministic execution and creative AI reasoning work in harmony.

## Success Metrics
- Clean separation between deterministic VM and creative AI
- Programs that are both intelligent and predictable
- Easy debugging and state inspection
- Support for multiple AI agents with varying capabilities
- Robust handling of long-running cognitive programs

## Current Status
CVM has achieved significant maturity:
- ✅ Complete language feature set (operators, control flow, types)
- ✅ Robust VM with 400+ passing tests
- ✅ Production-ready MCP integration
- ✅ Multiple storage backends (File/MongoDB)
- ✅ Comprehensive integration testing
- ✅ Published npm package (cvm-server)