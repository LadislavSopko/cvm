# CVM Evolution Development Manual

## Overview

This manual documents the proven methodology for evolving CVM (Cognitive Virtual Machine) by using CVM itself. This is a meta-development approach where CVM orchestrates its own evolution through guided TDD implementation.

## The Meta-Development Paradigm

**Core Concept**: Instead of manually implementing features, we create CVM programs that guide Claude through the implementation process using CC() calls. This leverages CVM's strength - breaking complex tasks into manageable cognitive checkpoints.

**Why This Works**:
- CVM maintains all state and progress
- Claude provides cognitive input at each decision point
- Complex multi-step implementations become guided workflows
- TDD methodology is enforced programmatically
- Error handling and debugging are built into the flow

## Evolution Development Process

### Phase 1: Planning & Analysis
1. **Create Detailed Implementation Plan**
   - Break features into atomic, testable steps
   - Specify exact file paths and line numbers
   - Include complete code samples for each step
   - Follow TDD methodology (test → implement → verify)
   - Cross-reference all components

2. **Cross-Check Plan Quality**
   - Verify architectural consistency with existing CVM patterns
   - Validate technical approaches
   - Ensure comprehensive test coverage
   - Check dependency ordering
   - Get second opinion validation

### Phase 2: Evolution Program Creation
1. **Study Pattern Example**
   - Reference `/home/laco/cvm/docs/CVM_EVOLUTION_PATTERN_EXAMPLE.ts`
   - Understand task structure patterns
   - Learn CC() prompt construction
   - Review error handling approaches

2. **Create Evolution Program**
   - Map plan steps to CVM tasks array
   - Connect each task to specific plan sections
   - Include exact line references for code samples
   - Implement proper TDD flow (test → implement → verify)
   - Add comprehensive error handling and debugging

3. **Cross-Check Program vs Plan**
   - Validate all line number references
   - Ensure task descriptions match plan content
   - Verify file paths are correct
   - Check dependency ordering

### Phase 3: Testing & Validation
1. **Dry-Run Testing**
   - Load program into CVM
   - Execute without performing actual tasks
   - Verify all code paths work correctly
   - Test error handling scenarios
   - Validate debugging loops

2. **Fix Issues**
   - Debug any control flow problems
   - Enhance error handling as needed
   - Improve logging and visibility
   - Add safety mechanisms (attempt counters, etc.)

### Phase 4: Production Execution
1. **Load and Execute**
   - Load finalized evolution program into CVM
   - Execute with real implementation
   - Follow TDD methodology strictly
   - Use debugging loops when tests fail

2. **Monitor Progress**
   - Track task completion
   - Ensure tests pass at each step
   - Commit progress incrementally
   - Maintain backward compatibility

## Key Principles

### 1. TDD Enforcement
Every feature implementation follows:
- Write failing tests first
- Implement minimal code to pass tests
- Verify tests pass
- Check types and lint
- Commit progress

### 2. Atomic Tasks
Each task should be:
- Independently testable
- Clearly defined with exact specifications
- Connected to specific plan sections
- Small enough to complete in one focused session

### 3. Error Handling
Programs must handle:
- Expected test failures (TDD)
- Unexpected test failures (debugging mode)
- Type errors
- Build failures
- Maximum retry limits

### 4. State Management
CVM programs maintain:
- Task progress tracking
- Completed task lists
- Error states and retry counts
- Context for each CC() call

### 5. Plan Integration
Evolution programs must:
- Reference exact plan line numbers
- Include complete context in CC() prompts
- Specify exact file paths and commands
- Connect tasks to implementation specifications

## Evolution Program Structure

### Core Components
```typescript
// Context setup
var contextPrompt = "CONTEXT: [Feature description and key points]";
var fileOpsBase = " " + contextPrompt + " [Tool usage instructions]";

// Task definitions
var tasks = [
    {
        name: "Task X.Y: [Descriptive name]",
        implement: "Follow plan Step X.Y: [Exact implementation instructions with line refs]",
        test: "[Exact test command with expected result]",
        expectFailure: true/false,
        project: "[parser/vm/integration/e2e]"
    }
];

// Task processing loop with error handling
while (i < tasks.length) {
    // Implementation phase
    CC(implementPrompt);
    
    // Test phase with debugging
    if (testResult == "failed" && !expectFailure) {
        // Enter debugging loop
        while (!allClean && debugAttempts < 5) {
            // Fix → Retest → Typecheck cycle
        }
    }
    
    // Progress tracking
    completedTasks.push(taskName);
    CC("Commit progress...");
}
```

### Task Categories
1. **Opcode Tasks**: Add new bytecode operations
2. **Test Tasks**: Create failing tests (TDD)
3. **Implementation Tasks**: Write code to pass tests
4. **Compiler Tasks**: Add parser/compiler support
5. **Integration Tasks**: End-to-end testing
6. **Validation Tasks**: Ensure no regressions

### Error Handling Patterns
1. **Expected Failures**: TDD tests that should fail initially
2. **Unexpected Failures**: Enter debugging mode with fix→retest cycle
3. **Type Errors**: Separate typecheck validation
4. **Build Failures**: Package rebuild verification
5. **Retry Limits**: Prevent infinite debugging loops

## CC() Prompt Design

### Context Injection
Every CC() call includes:
- Full feature context and mission
- Reference to detailed plan file
- Key requirements (imports, testing, TDD)
- Available tools and commands

### Task Specificity
Each prompt specifies:
- Exact plan step and line references
- Precise file paths and locations
- Complete implementation instructions
- Expected outcomes and verification

### Response Guidance
Prompts guide responses:
- "Submit 'done' when complete"
- "Submit 'passed'/'failed' for tests"
- "Submit 'clean'/'errors' for typechecks"

## Best Practices

### Planning Phase
- Create comprehensive implementation plans with exact specifications
- Include complete code samples, not just descriptions
- Verify all file paths and line numbers are accurate
- Cross-check with second agent for validation

### Program Creation
- Study the pattern example thoroughly
- Map every plan step to a specific task
- Include exact line references for all code samples
- Test error handling paths during dry-run

### Execution Phase
- Follow TDD methodology strictly
- Use debugging loops when tests fail unexpectedly
- Commit progress after each task completion
- Maintain comprehensive test coverage

### Quality Assurance
- Dry-run test all code paths before production
- Verify debugging loops work correctly
- Cross-check line references accuracy
- Test both success and failure scenarios

## Evolution History

This methodology has been refined through multiple iterations:
- **Iteration 1**: Basic evolution programs
- **Iteration 2**: Enhanced error handling
- **Iteration 3**: Perfected debugging loops and comprehensive testing

Each iteration has improved:
- Error handling robustness
- TDD methodology enforcement
- Progress tracking accuracy
- Context preservation across CC() calls

## Future Enhancements

The methodology continues to evolve:
- Enhanced debugging capabilities
- Better progress visualization
- Improved error recovery mechanisms
- More sophisticated task dependency management

## Usage Example

See `/home/laco/cvm/docs/CVM_EVOLUTION_PATTERN_EXAMPLE.ts` for a complete working example that demonstrates all principles and patterns described in this manual.

---

*This manual represents the distilled knowledge from multiple CVM evolution cycles and serves as the authoritative guide for future CVM development using CVM itself.*