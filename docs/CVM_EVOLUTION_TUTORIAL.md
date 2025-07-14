# CVM Evolution Tutorial: How to Create Self-Improving Programs

## Introduction

CVM Evolution represents a revolutionary approach to software development where **CVM can evolve itself** through guided TypeScript programs. This meta-development paradigm transforms complex implementations into manageable, systematic workflows that Claude can execute step-by-step.

### What is CVM Evolution?

Instead of manually implementing features, you create CVM programs that guide Claude through the implementation process using `CC()` calls. This leverages CVM's core strength: breaking complex tasks into manageable cognitive checkpoints while maintaining all state and progress.

## Step 1: Planning - Create Detailed Implementation Plan

The foundation of successful CVM evolution is a comprehensive implementation plan with exact specifications, complete code samples, and precise file paths. This is the most critical step that determines the success of your evolution program.

### Why Detailed Planning Matters

- **Exact Specifications**: Prevents ambiguity during implementation
- **Complete Code Samples**: Provides full context for Claude to work with
- **File Path Accuracy**: Ensures code goes in the right locations
- **TDD Methodology**: Plans the test-first approach from the beginning
- **Dependency Mapping**: Identifies all component relationships

### Plan Structure Template

```markdown
# Feature Implementation Plan

## Overview
Brief description of the feature and its purpose

## Implementation Steps

### Step 1.1: [Component Name]
- **File**: `/exact/path/to/file.ts`
- **Location**: After line X (provide context)
- **Action**: Add/modify/create
- **Code**: 
    ```typescript
    // Complete code sample here
    // Code not must be included, but its nice to have it. You can use pseudo-code or comments to indicate where code should go.
    ```
- **Test**: Exact command to run
- **Expected**: Pass/fail and why

### Step 1.2: [Next Component Name]
- **File**: `/exact/path/to/next-file.ts`
- **Action**: Add/modify/create
- **Code**: 
    ```typescript
    // Complete code sample here
    ```
- **Test**: Exact command to run
- **Expected**: Pass/fail and why

.... // next steps as needed

## Dependencies
- List all file dependencies
- Order of implementation
- Cross-references between components

## Testing Strategy
- Unit tests → Implementation → Integration → E2E
- TDD approach with failing tests first
```

### Plan Quality Checklist

✅ **Complete Code Samples**: Include full code, not just descriptions  
✅ **Exact File Paths**: Specify precise locations with line numbers  
✅ **Test Commands**: Provide exact commands to run tests  
✅ **Dependencies**: Map all component relationships  
✅ **TDD Flow**: Test → implement → verify cycle  
✅ **Cross-References**: Link all components and their interactions
✅ **Architecture Validation**: Ensure consistency with existing patterns
✅ **Edge Cases**: Consider error conditions and boundary scenarios

### Planning Best Practices

#### 1. Break Down Into Atomic Steps
Each step should be:
- Independently implementable
- Clearly testable
- Small enough to complete in one focused session
- Connected to specific plan sections

#### 2. Include Complete Context
For each implementation step:
- Show the exact file location
- Provide surrounding code context
- Explain why the change is needed
- Specify expected outcomes

#### 3. Map Dependencies Carefully
- List all files that will be modified
- Identify the order of implementation
- Note which components depend on others
- Plan for potential circular dependencies

## Step 2: Study - Review Pattern Example

Before creating your evolution program, Claude must understand the CVM evolution pattern. This involves studying an example that demonstrates the task structure, CC() prompt design, error handling, and debugging loops. Use this template Prompt to guide Claude's understanding:

### Template Prompt for Claude

```
Read @docs/README_EVOLUTION_DOCS.md to understand CVM evolution methodology.
Study the pattern in docs/CVM_EVOLUTION_PATTERN_EXAMPLE.ts for proper structure.
```

### Required Reading

1. **Study the Pattern**: `docs/CVM_EVOLUTION_PATTERN_EXAMPLE.ts`
   - Understand task structure patterns
   - Learn CC() prompt construction techniques
   - Review error handling approaches
   - See debugging loop implementations

2. **Review Methodology**: `docs/CVM_EVOLUTION_DEVELOPMENT_MANUAL.md`
   - Complete evolution development process
   - TDD enforcement patterns
   - Error handling best practices
   - Progress tracking techniques

## Step 3: Create - Build Evolution Program

Now that you have a detailed plan and claude understand the pattern, use this template prompt to have Claude create your evolution program.

### Template Prompt for Claude

```
Create a CVM evolution program from the implementation plan in [plan-file.md]. 
Follow TDD approach with proper error handling and debugging loops.

Key Requirements:
- Use exact file paths and line numbers from the plan
- Include complete context in CC() prompts
- Implement proper TDD flow (test → implement → verify)
- Add debugging loops for unexpected failures
- Follow the task structure pattern from the example
```

### What Claude Will Create

Claude will generate a TypeScript file with:
- Context setup with feature description
- Task array mapping plan steps to CVM tasks
- Implementation phase with CC() calls
- Test phase with TDD validation
- Debugging loops for error handling
- Progress tracking and state management

### Example Evolution Program Structure

```typescript
function main() {
    // Context setup
    var contextPrompt = "CONTEXT: [Feature description and requirements]";
    var fileOpsBase = " " + contextPrompt + " [Tool usage instructions]";
    
    // Task definitions
    var tasks = [
        {
            name: "Task 1.1: Add Feature Component",
            implement: "Follow plan Step 1.1: [exact implementation instructions]",
            test: "Run 'npx nx test project' (should pass/fail)",
            expectFailure: true/false,
            project: "parser/vm/integration"
        }
    ];
    
    // Task processing loop
    var i = 0;
    while (i < tasks.length) {
        var task = tasks[i];
        
        // Implementation phase
        CC("[" + task.name + "]: " + fileOpsBase + task.implement);
        
        // Test phase with debugging
        if (task.test != "") {
            var testResult = CC(fileOpsBase + task.test);
            
            // Handle unexpected failures with debugging loop
            if (!task.expectFailure && testResult == "failed") {
                var debugAttempts = 0;
                while (debugAttempts < 5 && testResult == "failed") {
                    CC(fileOpsBase + "Debug and fix implementation");
                    testResult = CC(fileOpsBase + "Re-run test");
                    debugAttempts++;
                }
            }
        }
        
        i++;
    }
}
```

### Cross-Check Program vs Plan

Before executing, validate your evolution program:

#### ✅ Verification Checklist
- **Line Number Accuracy**: All references match current file state
- **Task Descriptions**: Match plan content exactly
- **File Paths**: All paths are correct and accessible
- **Dependency Order**: Tasks are sequenced properly
- **Error Handling**: Debugging loops are implemented
- **Context Completeness**: All CC() prompts have full context

#### ✅ Program Quality Validation
- Map every plan step to a specific task
- Include exact line references for all code samples
- Connect tasks to implementation specifications
- Test error handling paths during creation

## Step 4: Test - Dry-Run Validation

Before production execution, thoroughly test your evolution program to validate all code paths work correctly.

### Dry-Run Testing Process

#### 1. Load Program into CVM
```
Tell Claude: "Load this evolution program into CVM for testing"
```

#### 2. Validate Task Flow
- Check that all tasks are properly structured
- Verify CC() prompts contain complete context
- Ensure task dependencies are correctly ordered
- Test that loops and conditionals work as expected

#### 3. Test Error Handling
- Simulate test failures to verify debugging loops
- Check retry limits and safety mechanisms
- Validate graceful degradation scenarios
- Ensure state tracking works correctly

#### 4. Fix Issues Found
- Debug any control flow problems
- Enhance error handling as needed
- Improve logging and visibility
- Add missing safety mechanisms

### Testing Best Practices

#### Mock Execution
- Run through tasks without actual implementation
- Verify prompt structure and content
- Check variable scoping and state management
- Test edge cases and error conditions

#### Code Path Validation
- Ensure all branches of conditionals are reachable
- Verify loop termination conditions
- Check that debugging loops don't become infinite
- Test both success and failure scenarios

## Step 5: Execute - Run Evolution Program

### Loading and Running

1. **Load the Program**:
   ```
   Tell Claude: "Load this evolution program into CVM"
   ```
   Claude will use: `mcp__cvm__load("program-id", "...typescript code...")`

2. **Start Execution**:
   ```
   Tell Claude: "Start the evolution program"
   ```
   Claude will use: `mcp__cvm__start("program-id", "execution-id")`

3. **Monitor Progress**:
   ```
   Tell Claude: "Check status of the evolution program"
   ```
   Claude will use: `mcp__cvm__status("execution-id")`

### Execution Flow

1. **CVM pauses at first CC() call**
2. **Claude pulls the task** using `getTask()`
3. **Claude processes the implementation request**
4. **Claude submits result** using `submitTask()`
5. **CVM continues to next CC() call**
6. **Process repeats until completion**

### Monitoring Commands

- `mcp__cvm__getTask(executionId)` - Get current task
- `mcp__cvm__submitTask(executionId, result)` - Submit task result
- `mcp__cvm__status(executionId)` - Check execution status

## Complete Example Walkthrough

### Example: Adding String.trim() Method

#### 1. Create Implementation Plan
```markdown
# String.trim() Implementation Plan

## Step 1.1: Add STRING_TRIM Opcode
- **File**: `/packages/parser/src/lib/bytecode.ts`
- **Location**: After line 98 (after STRING_SLICE)
- **Code**: `STRING_TRIM = 'STRING_TRIM',`
- **Test**: `npx nx test parser` (should pass)

## Step 1.2: Write VM Handler Test
- **File**: `/packages/vm/src/lib/handlers/strings-trim.spec.ts`
- **Code**: [Complete test code]
- **Test**: `npx nx test vm -- strings-trim.spec.ts` (should fail)

## Step 1.3: Implement Handler
- **File**: `/packages/vm/src/lib/handlers/strings.ts`
- **Code**: [Complete handler implementation]
- **Test**: `npx nx test vm -- strings-trim.spec.ts` (should pass)
```

#### 2. Generate Evolution Program
```
Read @docs/README_EVOLUTION_DOCS.md and create evolution program 
from string-trim-plan.md following TDD methodology.
```

#### 3. Execute Program
```
Load and run the evolution program for String.trim() implementation.
```

## Best Practices

### Planning Phase

#### ✅ Write Comprehensive Plans
- Include complete code samples, not just descriptions
- Specify exact file paths and line numbers
- Provide context for where code should be placed
- Cross-reference all components and dependencies

#### ✅ Follow TDD Methodology
- Write failing tests first
- Implement minimal code to pass tests
- Verify tests pass before moving to next step
- Include integration and E2E tests

#### ✅ Validate Architecture
- Ensure consistency with existing CVM patterns
- Check that new components fit the overall design
- Verify import/export patterns are correct
- Consider performance implications

### Program Creation

#### ✅ Study Pattern Examples
- Reference `docs/CVM_EVOLUTION_PATTERN_EXAMPLE.ts` thoroughly
- Understand task structure and CC() prompt design
- Learn error handling patterns and debugging loops
- Follow proven methodologies from successful evolutions

#### ✅ Map Plan to Tasks
- Every plan step becomes a specific CVM task
- Include exact line references for all code samples
- Connect tasks to implementation specifications
- Maintain proper dependency ordering

#### ✅ Design Effective CC() Prompts
- Include full context in every prompt
- Reference the detailed plan file
- Specify exact file paths and commands
- Guide Claude's responses with clear instructions

### Execution Phase

#### ✅ Follow TDD Strictly
- Ensure tests fail before implementation
- Fix failing tests immediately
- Don't skip verification steps
- Maintain comprehensive test coverage

#### ✅ Use Debugging Loops
- Handle unexpected test failures gracefully
- Implement retry mechanisms with limits
- Log debug information for troubleshooting
- Don't get stuck in infinite loops

#### ✅ Monitor Progress
- Check execution status regularly
- Commit progress after each major milestone
- Track completed tasks and remaining work
- Be prepared to intervene if needed

### Quality Assurance

#### ✅ Dry-Run Testing
- Test all code paths before production execution
- Verify debugging loops work correctly
- Check both success and failure scenarios
- Validate error handling mechanisms

#### ✅ Comprehensive Testing
- Unit tests for individual components
- Integration tests for component interaction
- E2E tests for complete feature workflows
- Regression tests to prevent breaking changes

#### ✅ Code Quality
- Follow existing code style and patterns
- Ensure proper TypeScript typing
- Add appropriate comments and documentation
- Maintain backward compatibility

### Safety Mechanisms
- **Retry Limits**: Prevent infinite debugging loops
- **Attempt Counters**: Track debugging iterations
- **State Validation**: Ensure program state remains consistent
- **Graceful Degradation**: Handle maximum retry scenarios

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Evolution Program Gets Stuck
**Symptoms**: Program doesn't progress through tasks
**Solutions**:
- Check CC() prompt formatting
- Verify task array structure
- Ensure proper loop conditions
- Add debugging output

#### Issue: Tests Keep Failing
**Symptoms**: Debugging loop exceeds retry limit
**Solutions**:
- Review implementation plan accuracy
- Check file paths and line numbers
- Verify test expectations are correct
- Manually debug the specific issue

#### Issue: Context Loss
**Symptoms**: Claude doesn't understand task requirements
**Solutions**:
- Enhance contextPrompt with more details
- Include plan file references in every CC() call
- Add specific tool usage instructions
- Provide more implementation context

#### Issue: Type Errors
**Symptoms**: TypeScript compilation fails
**Solutions**:
- Add proper type annotations
- Check import/export patterns
- Verify interface compatibility
- Run typecheck after each implementation

### Performance Optimization

#### Efficient Task Design
- Keep tasks focused and atomic
- Avoid overly complex single tasks
- Balance task granularity with execution efficiency
- Group related operations when appropriate

#### Minimize CC() Calls
- Combine related operations in single prompts
- Use batch processing for similar tasks
- Avoid unnecessary verification steps
- Optimize prompt content for clarity

#### State Management
- Track only necessary state variables
- Clean up completed task data
- Minimize memory usage in long executions
- Use efficient data structures