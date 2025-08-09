Generate CVM (Claude Virtual Machine) program from TDDAB plan for CVM/TypeScript development.

## INHERITS FROM BASE MINDSET
**FIRST**: Apply `/user:cvm-senior` base mindset (read Memory Bank, understand context)
**THEN**: Generate CVM program from the specified plan

Examples:
- `/generate-cvm-program /tasks/parseInt-implementation-plan.md` - Generate CVM program from plan
- `/generate-cvm-program /tasks/plan.md --pattern /tasks/example.ts` - Use specific pattern

## MANDATORY RULES - NO EXCEPTIONS

- Inherits all rules from `/user:cvm-senior` command

### 1. Pattern Following - THIS IS NON-NEGOTIABLE
- **FOLLOW example program structure** from successful CVM implementations
- **NEVER invent new structures** - use what works
- Always include:
  - Same console.log format
  - Same contextPrompt structure
  - Same fileOpsBase + submitDone pattern
  - Same test loop with no escape
  - Submit info must be one word as result: done|passed|failed|fixed|analyzed

### 2. Plan Back-References - SOURCE OF TRUTH
- **Every TDDAB MUST reference source plan** with exact line numbers
- Format: `planReference: "/path/to/plan.md lines X-Y"`
- **NO EXCEPTIONS** - every task needs traceability
- Example:
  ```typescript
  {
      name: "TDDAB-1: Add PARSE_INT Opcode",
      planReference: "/tasks/parseInt-implementation-plan.md lines 14-35",
      description: "Define the bytecode operation for parseInt"
  }
  ```

### 3. Self-Sufficient Prompts - FRESH CONTEXT READY
- **Each CC() call must work independently** - no memory between calls
- Include full context in every prompt:
  - Project details (CVM, TypeScript, Nx monorepo)
  - Technology stack (TypeScript, Jest, Nx)
  - Specific task
  - Tool instructions
  - Expected result format

### 4. Simple Result Words - AUTOMATION READY
- **ALWAYS specify exact words to submit**:
  - "done" - task completed
  - "passed" - tests pass
  - "failed" - tests fail
  - "fixed" - issue resolved
  - "analyzed" - dry-run analysis
- Add to every prompt: `" Submit 'done' when complete."`

### 5. Atomic Commits - CLEAN HISTORY
- **After each successful TDDAB**: git add and commit
- **Technical commit messages only** - no emojis, no attributions
- Format: `"feat(area): description"` or `"fix(area): description"`

## CVM/TypeScript Project Rules - CRITICAL

### Testing Commands:
```typescript
// For unit tests:
"Run tests using 'npx nx test <project>' with Bash tool"

// For E2E tests:  
"Run E2E tests using './test/programs/run-category.sh <category>' with Bash tool"

// For all tests:
"Run all tests using 'npx nx run-many --target=test --all' with Bash tool"
```

### Build Commands:
```typescript
// Build single project:
"Build using 'npx nx build <project>' with Bash tool"

// Build all:
"Build all using 'npx nx run-many --target=build --all' with Bash tool"

// Reset and rebuild:
"Reset using 'npx nx reset' then build with 'npx nx run-many --target=build --all'"
```

### BTLT Process:
```typescript
// Build, TypeCheck, Lint, Test - the four pillars:
"Run BTLT: 'npx nx run-many --target=build --all && npx nx run-many --target=typecheck --all && npx nx run-many --target=lint --all && npx nx run-many --target=test --all'"
```

## Program Structure Template

When generating, follow this exact pattern:

```typescript
function main() {
    console.log("=== CVM parseInt() Implementation ===");
    
    var contextPrompt = "CONTEXT: You are implementing parseInt() support for CVM. " +
                       "CVM is a TypeScript-based virtual machine in an Nx monorepo. " +
                       "Follow TDD: write tests first, then implementation. ";
    
    var fileOpsBase = contextPrompt + "Use Read, Write, Edit tools for file operations. ";
    var submitDone = " Submit 'done' when complete.";
    var submitTest = " Submit 'passed' if tests pass, 'failed' if tests fail.";
    
    var tddBlocks = [
        {
            name: "TDDAB-1: Add PARSE_INT Opcode",
            planReference: "/tasks/parseInt-implementation-plan.md lines 14-35",
            description: "Define the bytecode operation for parseInt",
            testCommand: "npx nx test types",
            project: "types"
        },
        {
            name: "TDDAB-2: Compiler Support",
            planReference: "/tasks/parseInt-implementation-plan.md lines 38-102",
            description: "Make compiler recognize parseInt() calls",
            testCommand: "npx nx test parser",
            project: "parser"
        }
        // ... more TDDABs
    ];
    
    var blockIndex = 0;
    while (blockIndex < tddBlocks.length) {
        var block = tddBlocks[blockIndex];
        console.log("\n=== Starting " + block.name + " ===");
        
        // Write tests first (TDD)
        var testPrompt = fileOpsBase + 
            "Write tests for " + block.name + 
            " as specified in " + block.planReference + 
            ". Focus on the 'Tests First' section." + submitDone;
        CC(testPrompt);
        
        // Run tests - they should fail (red phase)
        var failPrompt = fileOpsBase + 
            "Run tests using '" + block.testCommand + "' with Bash tool. " +
            "Tests should fail since implementation doesn't exist yet." + submitTest;
        var testResult = CC(failPrompt);
        
        // Implement the feature (green phase)
        var implPrompt = fileOpsBase + 
            "Implement " + block.name + 
            " as specified in " + block.planReference + 
            ". Focus on the 'Implementation' section." + submitDone;
        CC(implPrompt);
        
        // Test loop - NO ESCAPE until tests pass
        var testPassPrompt = fileOpsBase + 
            "Run tests again using '" + block.testCommand + "' with Bash tool." + submitTest;
        testResult = CC(testPassPrompt);
        
        while (testResult === "failed") {
            var fixPrompt = fileOpsBase + 
                "Fix the failing tests. Check error messages and correct the implementation." + submitDone;
            CC(fixPrompt);
            
            testResult = CC(testPassPrompt);
        }
        
        // Commit atomically
        var commitPrompt = fileOpsBase + 
            "Commit changes using git add and git commit with message: " +
            "'feat(" + block.project + "): " + block.description + "'" + submitDone;
        CC(commitPrompt);
        
        console.log("✓ Completed " + block.name);
        blockIndex = blockIndex + 1;
    }
    
    console.log("\n=== All TDDABs Complete ===");
    
    // Final integration test
    var integrationPrompt = fileOpsBase + 
        "Run full BTLT process to ensure everything works: " +
        "'npx nx run-many --target=build --all && " +
        "npx nx run-many --target=test --all' with Bash tool." + submitTest;
    var finalResult = CC(integrationPrompt);
    
    if (finalResult === "passed") {
        console.log("✓ parseInt() implementation complete and verified!");
    }
}
```

## Memory Bank Rules
- Inherits Memory Bank rules from `/user:cvm-senior`
- Check activeContext.md to understand current work
- Generated programs should align with current project state

## Active Mode Behaviors

When this command is invoked, I will:
- **APPLY** base cvm-senior mindset first
- **READ** the specified plan file completely
- **EXTRACT** all TDDAB blocks with line numbers
- **ADAPT** for CVM/TypeScript context (not C#!)
- **GENERATE** complete CVM program with all 5 rules
- **SAVE** as `[plan-basename]-cvm-program.ts`
- **VERIFY** all planReference fields are complete
- **ENSURE** proper Nx/TypeScript/Jest commands

**MY GOLDEN RULE: Follow TDD strictly - Red, Green, Refactor!**