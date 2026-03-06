# Product Context

## What is CVM?

CVM (Cognitive Virtual Machine) is an algorithmic TODO manager for Claude. It inverts the traditional AI integration pattern: instead of your code calling AI, CVM orchestrates while Claude acts as the cognitive processor.

## The Problem CVM Solves

When Claude processes complex multi-step tasks, context gets lost:
- "Analyze these 1000 files" → Claude forgets what was analyzed after file 50
- Chained operations lose state between calls
- Crashes mean starting over from the beginning
- No way to inspect progress or resume from failures

## How CVM Solves It

CVM provides a **guide rope through the tunnel** - a program that:
1. Breaks complex tasks into manageable cognitive checkpoints (CC calls)
2. Maintains all state between checkpoints
3. Allows pause, inspect, and resume at any point
4. Treats Claude as a stateless processor of individual tasks

## The Beautiful Paradigm Shift

**Traditional**: Your Code → Calls AI → Gets Response → Continues (stateless, fragile)

**CVM**: Program defines flow → Pauses at CC() → Claude processes → State preserved → Continues (stateful, resilient)

## Core Value Propositions

1. **Never Lose Progress**: State survives crashes, can resume from any point
2. **Perfect Memory**: Variables, progress, results maintained by VM, not Claude's context  
3. **Observable Execution**: Check status, inspect state, monitor progress anytime
4. **Systematic Processing**: Turn chaotic AI interactions into deterministic workflows

## The GPS Analogy

CVM is like a GPS navigation system:
- The GPS (CVM) knows the entire route
- Gives Claude ONE instruction at a time: "Turn right"
- Claude executes without seeing the whole map
- After each turn, GPS gives the next instruction
- GPS maintains all state - Claude just follows prompts

## Target Use Cases

- Document analysis pipelines (process 1000s of files systematically)
- Data extraction and transformation workflows
- Multi-step report generation
- Code refactoring across large codebases
- Any task requiring loops with cognitive processing

## What CVM is NOT

- NOT a general-purpose programming language
- NOT for complex computation or algorithms
- NOT a replacement for traditional scripting
- NOT trying to make Claude "smarter"

CVM makes Claude SYSTEMATIC - turning brilliant but chaotic into brilliant and methodical.

## Website: cvm.example4.ai

CVM has a public-facing website in `wwwroot/` with two pages:

### Landing Page (index.html) — "Experience CVM"
An interactive demo where the human becomes the CPU to understand CVM experientially.
- **Framing**: "I'm Your Task Manager" — friendly/challenging intro (CPU reveal comes at end)
- **4 rounds**: counting → patterns → discipline (no-escape loop) → TDDAB code cycle
- **Key moment**: Round 3 traps user in a loop — they can't skip, can't argue (mirrors CVM's no-escape loops)
- **Reveal section**: Shows program source, stats, CVM explanation, link to study page
- **Skip button**: Hidden on first visit (opacity 0.15), visible after completing once (localStorage)

### Study Page (study.html) — "CVM: The Third Paradigm"
Research report comparing CVM vs Claude Code vs LangGraph/frameworks.
- **CVM section (top)**: Paradigm comparison boxes, code example, unique features grid, 3-way radar chart, feature matrix table, "Nothing Comparable Exists" box with 6 closest alternatives, paradigm spectrum scatter chart
- **Market Research section (below)**: Stats, 4 Chart.js charts, timeline, verdict boxes
- **Research finding**: No existing framework inverts control the way CVM does

### Shared Features
- Dark/light theme toggle (localStorage key: `cvm-theme`, shared across pages)
- Footer: CVM + example4.ai + projects.0ics.ai + Author (Ladislav Sopko) + Apache 2.0
- Chart.js for data visualization, CSS custom properties for theming
- Pure HTML/CSS/JS — zero build step, zero dependencies (except Chart.js CDN)

## Ecosystem

- **example4.ai** — Real code examples for AI agents (MCP)
- **projects.0ics.ai** — AI-Powered Development Showcase
- **vs-mcp.example4.ai** — VS Extension + MCP
- **Author**: Ladislav Sopko — Senior Developer & AI Mentor

## Mission

**CVM's mission**: Be an algorithmic TODO manager that helps Claude work through complex tasks without losing context.