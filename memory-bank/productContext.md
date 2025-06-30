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

## Mission

**CVM's mission**: Be an algorithmic TODO manager that helps Claude work through complex tasks without losing context.