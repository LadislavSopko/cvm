/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Evolution Plan Executor Started ===");
    
    // Shorter, focused context
    var projectContext = "You are fixing CVM (Cognitive Virtual Machine). " +
        "Project structure: @cvm/parser (TS→bytecode), @cvm/types (type system), @cvm/vm (executes bytecode), @cvm/mcp-server (MCP), @cvm/storage (persistence). " +
        "Use 'npx nx test <project>' for testing. ";
    
    // Critical rule - make it stand out
    var criticalRule = "CRITICAL RULE: DO NOT GUESS! ALWAYS read existing code with Read tool BEFORE making any changes. " +
        "The atomic plan has EXACT line numbers - use them! ";
    
    // TDD methodology reminder
    var tddRule = "TDD METHODOLOGY: 1) Write failing test FIRST, 2) Run test to verify it fails, 3) Write minimal code to pass, 4) Run test to verify it passes. ";
    
    // Tool usage
    var toolUsage = "Use Read for reading files, Edit/Write for changes, Bash for commands. ";
    
    // Atomic plan location
    var atomicPlan = "/home/laco/cvm/tasks/cvm-evolution-plan-atomic-steps.md";
    
    console.log("Context initialized");
    console.log("Atomic plan: " + atomicPlan);
    
    // Track completed tasks
    var completedTasks = [];
    
    // Define evolution tasks - simplified and focused
    var tasks = [
        // PHASE 1: Foundation (No Dependencies) - Commented out as completed
        // {
        //     name: "Step 1: Create Stack Safety Utils",
        //     planLines: "lines 23-63",
        //     targetFile: "new file /packages/vm/src/lib/stack-utils.ts",
        //     targetLine: "n/a",
        //     testLocation: "lines 28-45",
        //     bugDescription: "No stack safety utilities exist",
        //     fixDescription: "Create safePop and isVMError functions",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 2: Update CVMArray Type",
        //     planLines: "lines 65-91",
        //     targetFile: "/packages/types/src/lib/cvm-value.ts",
        //     targetLine: "CVMArray interface",
        //     testLocation: "lines 70-82",
        //     bugDescription: "CVMArray can't store string properties",
        //     fixDescription: "Add optional properties field to CVMArray interface",
        //     expectFailure: false,
        //     project: "types"
        // },
        
        // {
        //     name: "Step 3: Add Error Collection to Compiler",
        //     planLines: "lines 93-111",
        //     targetFile: "/packages/parser/src/lib/compiler.ts",
        //     targetLine: "top of compile function",
        //     testLocation: "lines 98-110",
        //     bugDescription: "Compiler doesn't collect errors",
        //     fixDescription: "Add errors array to compile function",
        //     expectFailure: false,
        //     project: "parser"
        // },
        
        // {
        //     name: "Step 4: VM Cache Memory Leak Fix",
        //     planLines: "lines 113-134",
        //     targetFile: "/packages/vm/src/lib/vm-manager.ts",
        //     targetLine: "line ~346 in deleteExecution",
        //     testLocation: "lines 118-130",
        //     bugDescription: "VMs never removed from cache on deletion",
        //     fixDescription: "Add this.vms.delete(executionId) to deleteExecution",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 10: Database Transaction Safety",
        //     planLines: "lines 136-175",
        //     targetFile: "/packages/mongodb/src/lib/mongodb-adapter.ts",
        //     targetLine: "deleteExecution method",
        //     testLocation: "lines 141-155",
        //     bugDescription: "Deletion operations not atomic",
        //     fixDescription: "Implement MongoDB transactions for deletion",
        //     expectFailure: false,
        //     project: "mongodb"
        // },
        
        // PHASE 2: Primitive Extraction Fixes
        // {
        //     name: "Step 5: Fix Object Property Key Extraction",
        //     planLines: "lines 179-210",
        //     targetFile: "/packages/vm/src/lib/handlers/arrays.ts",
        //     targetLine: "line 114",
        //     testLocation: "lines 184-203",
        //     bugDescription: "const key = index as string - assumes index is already string",
        //     fixDescription: "Use cvmToString(index) to properly convert any type to string",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 6: Write Array Index Tests", 
        //     planLines: "lines 212-235",
        //     targetFile: "new test file",
        //     targetLine: "n/a",
        //     testLocation: "lines 212-235",
        //     bugDescription: "No tests for array index handling",
        //     fixDescription: "Create comprehensive tests for numeric indices, string-to-number conversion, and non-numeric properties",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 6: Fix Array GET Index Extraction",
        //     planLines: "lines 237-255",
        //     targetFile: "/packages/vm/src/lib/handlers/arrays.ts",
        //     targetLine: "line 139",
        //     testLocation: "from previous step",
        //     bugDescription: "Array access doesn't handle JavaScript-compliant string indices",
        //     fixDescription: "Implement logic where array['0'] equals array[0], and array['foo'] stores as property",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 6: Fix Array SET Index Extraction",
        //     planLines: "lines 257-282", 
        //     targetFile: "/packages/vm/src/lib/handlers/arrays.ts",
        //     targetLine: "line 211",
        //     testLocation: "from Step 6 tests",
        //     bugDescription: "Array assignment doesn't handle JavaScript-compliant indices",
        //     fixDescription: "Implement proper index handling for assignment matching GET behavior",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 6.4: Fix Object Assignment Key",
        //     planLines: "lines 284-303",
        //     targetFile: "/packages/vm/src/lib/handlers/arrays.ts", 
        //     targetLine: "line 187",
        //     testLocation: "lines 289-297",
        //     bugDescription: "Object assignment has same string assumption bug",
        //     fixDescription: "Use proper key extraction for object property assignment",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // // PHASE 3: Compiler Error Reporting
        // {
        //     name: "Step 7: Implement Compiler Error Reporting",
        //     planLines: "lines 307-362",
        //     targetFile: "/packages/parser/src/lib/compiler.ts",
        //     targetLine: "reportError function and visitor else clause",
        //     testLocation: "lines 312-326",
        //     bugDescription: "Compiler silently ignores unsupported syntax",
        //     fixDescription: "Implement error reporting for unsupported syntax like switch/try-catch",
        //     expectFailure: false,
        //     project: "parser"
        // },
        
        // // PHASE 4: Apply Stack Safety Everywhere
        // {
        //     name: "Step 8: Update Arithmetic Handlers",
        //     planLines: "lines 366-396",
        //     targetFile: "/packages/vm/src/lib/handlers/arithmetic.ts",
        //     targetLine: "all handlers with stack.pop()",
        //     testLocation: "lines 371-383",
        //     bugDescription: "No stack underflow protection",
        //     fixDescription: "Replace all stack.pop()! with safePop pattern",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 8: Update Comparison Handlers",
        //     planLines: "lines 366-396",
        //     targetFile: "/packages/vm/src/lib/handlers/comparison.ts",
        //     targetLine: "all handlers with stack.pop()",
        //     testLocation: "existing tests",
        //     bugDescription: "No stack underflow protection",
        //     fixDescription: "Apply safePop pattern to all handlers",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 8: Update Logical Handlers",
        //     planLines: "lines 366-396",
        //     targetFile: "/packages/vm/src/lib/handlers/logical.ts",
        //     targetLine: "all handlers with stack.pop()",
        //     testLocation: "existing tests",
        //     bugDescription: "No stack underflow protection",
        //     fixDescription: "Apply safePop pattern to all handlers",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 8: Update Object Handlers",
        //     planLines: "lines 366-396",
        //     targetFile: "/packages/vm/src/lib/handlers/objects.ts",
        //     targetLine: "all handlers with stack.pop()",
        //     testLocation: "existing tests",
        //     bugDescription: "No stack underflow protection",
        //     fixDescription: "Apply safePop pattern to all handlers",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 8: Update String Handlers",
        //     planLines: "lines 366-396",
        //     targetFile: "/packages/vm/src/lib/handlers/strings.ts",
        //     targetLine: "all handlers with stack.pop()",
        //     testLocation: "existing tests",
        //     bugDescription: "No stack underflow protection",
        //     fixDescription: "Apply safePop pattern to all handlers",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // // PHASE 5: State Management
        // {
        //     name: "Step 9: Create State Serialization Tests",
        //     planLines: "lines 400-419",
        //     targetFile: "new test in vm-manager.spec.ts",
        //     targetLine: "n/a",
        //     testLocation: "lines 405-418",
        //     bugDescription: "No centralized state serialization",
        //     fixDescription: "Create tests for serialize/deserialize VM state",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 9: Implement State Serialization",
        //     planLines: "lines 421-461",
        //     targetFile: "/packages/vm/src/lib/vm-manager.ts",
        //     targetLine: "add new methods",
        //     testLocation: "from previous step",
        //     bugDescription: "State serialization duplicated 6+ places",
        //     fixDescription: "Create serializeVMState and deserializeVMState methods",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 9: Replace State Copying Code",
        //     planLines: "lines 463-467",
        //     targetFile: "/packages/vm/src/lib/vm-manager.ts",
        //     targetLine: "lines 129-141, 151-159, 241-250, 261-269",
        //     testLocation: "all vm-manager tests",
        //     bugDescription: "Manual state copying in 6+ places",
        //     fixDescription: "Replace with centralized serialization methods",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // // PHASE 6: Type System and Error Handling
        // {
        //     name: "Step 11: Fix Type Detection Tests",
        //     planLines: "lines 471-486",
        //     targetFile: "new tests for ADD opcode",
        //     targetLine: "n/a",
        //     testLocation: "lines 476-485",
        //     bugDescription: "No tests for ADD type handling",
        //     fixDescription: "Test string concatenation vs numeric addition",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 11: Fix Type Detection Heuristics",
        //     planLines: "lines 488-515",
        //     targetFile: "/packages/parser/src/lib/compiler/statements/expression-statement.ts",
        //     targetLine: "lines 41-45",
        //     testLocation: "from previous step",
        //     bugDescription: "Compiler guesses ADD vs CONCAT based on literals",
        //     fixDescription: "Remove heuristic, always emit ADD, let VM decide at runtime",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 12: Error Propagation Through CC",
        //     planLines: "lines 517-543",
        //     targetFile: "/packages/vm/src/lib/vm.ts",
        //     targetLine: "execute loop error handling",
        //     testLocation: "lines 522-536",
        //     bugDescription: "Errors crash VM with no recovery",
        //     fixDescription: "Allow CC() to handle runtime errors",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // // PHASE 7: JavaScript Compliance Testing
        // {
        //     name: "Step 13: JavaScript Compliance Tests",
        //     planLines: "lines 547-607",
        //     targetFile: "new file arrays.javascript-compliance.spec.ts",
        //     targetLine: "n/a",
        //     testLocation: "lines 552-606",
        //     bugDescription: "No JavaScript compliance tests",
        //     fixDescription: "Test array['0']==array[0], obj[123]==obj['123'], etc",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // // PHASE 8: Missing Features
        // {
        //     name: "Step 14: String Character Access Tests",
        //     planLines: "lines 611-625",
        //     targetFile: "new tests for string indexing",
        //     targetLine: "n/a",
        //     testLocation: "lines 616-624",
        //     bugDescription: "No string character access tests",
        //     fixDescription: "Test 'hello'[0] returns 'h'",
        //     expectFailure: true,
        //     project: "vm"
        // },
        
        // {
        //     name: "Step 14: Implement String Character Access",
        //     planLines: "lines 627-650",
        //     targetFile: "/packages/vm/src/lib/handlers/arrays.ts",
        //     targetLine: "ARRAY_GET handler",
        //     testLocation: "from previous step",
        //     bugDescription: "ARRAY_GET doesn't handle strings",
        //     fixDescription: "Add string handling to ARRAY_GET",
        //     expectFailure: false,
        //     project: "vm"
        // },
        
        {
            name: "Step 15: Stack Manipulation Opcodes",
            planLines: "lines 765-839",
            targetFile: "multiple files - bytecode.ts and new handlers",
            targetLine: "n/a",
            testLocation: "lines 771-794",
            bugDescription: "No stack manipulation opcodes",
            fixDescription: "Add DUP, SWAP, DUP2 opcodes and handlers",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 16: Array Methods Without Functions",
            planLines: "lines 841-905",
            targetFile: "multiple files - bytecode.ts and handlers",
            targetLine: "n/a",
            testLocation: "lines 847-867",
            bugDescription: "No array methods without function support",
            fixDescription: "Add ARRAY_MAP_PROP and ARRAY_FILTER_PROP opcodes",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 9: Architectural Improvements
        {
            name: "Step 17: Unified GET/SET Design Tests",
            planLines: "lines 909-940",
            targetFile: "new tests for unified opcodes",
            targetLine: "n/a",
            testLocation: "lines 915-938",
            bugDescription: "No unified GET/SET tests",
            fixDescription: "Test unified GET on arrays, objects, strings",
            expectFailure: true,
            project: "vm"
        },
        
        {
            name: "Step 17: Implement Unified GET/SET",
            planLines: "lines 942-970",
            targetFile: "multiple files - bytecode.ts and handlers",
            targetLine: "n/a",
            testLocation: "from previous step",
            bugDescription: "Separate ARRAY_GET/PROPERTY_GET opcodes",
            fixDescription: "Create unified GET/SET opcodes",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 10: Integration and Documentation
        {
            name: "Step 19: Integration Test Suite",
            planLines: "lines 1010-1041",
            targetFile: "new integration tests",
            targetLine: "n/a",
            testLocation: "lines 1016-1040",
            bugDescription: "No integration tests",
            fixDescription: "Test complete TypeScript to result pipeline",
            expectFailure: false,
            project: "integration"
        },
        
        {
            name: "Step 20: Update Documentation",
            planLines: "lines 1043-1049",
            targetFile: "various documentation files",
            targetLine: "n/a",
            testLocation: "n/a",
            bugDescription: "Outdated technical debt docs",
            fixDescription: "Remove obsolete TODOs, update API docs",
            expectFailure: false,
            project: ""
        }
    ];
    
    // Process tasks with clearer prompts
    console.log("Starting task processing. Total tasks: " + tasks.length);
    var i = 0;
    while (i < tasks.length) {
        console.log("\n=== Task " + (i + 1) + " of " + tasks.length + " ===");
        var task = tasks[i];
        
        var taskName = task["name"];
        var planLines = task["planLines"];
        var targetFile = task["targetFile"];
        var targetLine = task["targetLine"];
        var testLocation = task["testLocation"];
        var bugDescription = task["bugDescription"];
        var fixDescription = task["fixDescription"];
        var expectFailure = task["expectFailure"];
        var taskProject = task["project"];
        
        console.log("Task: " + taskName);
        console.log("Bug: " + bugDescription);
        
        // Step 1: Read the atomic plan section
        var readPlanPrompt = "" + criticalRule + 
            "STEP 1: Read the atomic plan at " + planLines + " in " + atomicPlan + ". " +
            "Focus on understanding the exact requirements. " +
            "Submit 'understood' when done.";
        CC(readPlanPrompt);
        
        // Step 2: Read existing code (if fixing existing file)
        if (targetFile != "new test file") {
            var readCodePrompt = "" + criticalRule + 
                "STEP 2: Read the EXISTING code at " + targetLine + " in " + targetFile + ". " +
                "Understand the current implementation BEFORE making changes. " +
                "The bug is: " + bugDescription + ". " +
                "Submit 'analyzed' when done.";
            CC(readCodePrompt);
        }
        
        // Step 3: Write or run tests (TDD phase 1)
        var testPrompt = "";
        var isWriteTestTask = false;
        // Check if task name contains "Write" and "Tests"
        if (taskName == "Step 6: Write Array Index Tests" || 
            taskName == "Step 9: Create State Serialization Tests" ||
            taskName == "Step 11: Fix Type Detection Tests" ||
            taskName == "Step 13: JavaScript Compliance Tests" ||
            taskName == "Step 14: String Character Access Tests" ||
            taskName == "Step 17: Unified GET/SET Design Tests") {
            isWriteTestTask = true;
        }
        
        if (isWriteTestTask) {
            // This is a "write tests" task
            testPrompt = "" + tddRule + criticalRule +
                "STEP 3: Write NEW tests based on " + testLocation + " in the atomic plan. " +
                "These tests MUST fail initially (TDD). " + 
                "Tests should cover: " + fixDescription + ". " +
                "Submit 'tests-written' when done.";
            CC(testPrompt);
        } else {
            // This is a "fix implementation" task
            testPrompt = "" + tddRule + 
                "STEP 3: First, FIND and READ the existing test file based on " + testLocation + " in the atomic plan. " +
                "If tests don't exist yet, write them based on the plan. " +
                "Submit 'tests-ready' when tests are prepared.";
            CC(testPrompt);
        }
        
        // Step 4: Run tests to verify they fail (TDD phase 2)
        if (expectFailure) {
            var runFailingTestPrompt = "" + tddRule + 
                "STEP 4: Run tests with 'npx nx test " + taskProject + "' to VERIFY they fail. " +
                "This confirms we're testing the right thing (TDD). " +
                "Submit 'failed' if tests fail as expected, 'passed' if they unexpectedly pass.";
            var testResult = CC(runFailingTestPrompt);
            
            if (testResult == "passed") {
                // Tests passed when they should fail
                var investigatePrompt = "" + criticalRule +
                    "The test passed but should have failed. " +
                    "Either the feature is already implemented OR the test isn't testing the right thing. " +
                    "Investigate and fix the test if needed. " +
                    "Submit 'fixed-test' when done.";
                CC(investigatePrompt);
            }
        }
        
        // Step 5: Implement the fix (TDD phase 3)
        if (targetFile != "new test file") {
            var implementPrompt = "" + tddRule + criticalRule +
                "STEP 5: Now implement the fix. " +
                "File: " + targetFile + " at " + targetLine + ". " +
                "Current bug: " + bugDescription + ". " +
                "Required fix: " + fixDescription + ". " +
                "Make MINIMAL changes - just enough to pass tests. " +
                "Submit 'implemented' when done.";
            CC(implementPrompt);
        }
        
        // Skip test/typecheck steps if no project specified (e.g., documentation tasks)
        if (taskProject != "") {
            // Step 6: Run tests to verify they pass (TDD phase 4)
            var runPassingTestPrompt = "" + tddRule +
                "STEP 6: Run tests with 'npx nx test " + taskProject + "' to verify they now PASS. " +
                "Submit 'passed' if all tests pass, 'failed' if any fail.";
            var finalTestResult = CC(runPassingTestPrompt);
            
            // Step 7: Fix if tests still fail - keep trying until resolved
            var attempts = 0;
            while (finalTestResult == "failed") {
                attempts = attempts + 1;
                var debugPrompt = "" + criticalRule +
                    "Tests are still failing (attempt " + attempts + "). " +
                    "Read the test output carefully to understand the failure. " +
                    "Read the atomic plan again at " + planLines + ". " +
                    "Read the existing code again to understand what's wrong. " +
                    "Make minimal fixes to pass tests. Do NOT give up! " +
                    "Submit 'fixed' when done.";
                CC(debugPrompt);
                
                finalTestResult = CC(runPassingTestPrompt);
            }
            
            // Step 8: Run typecheck until it passes
            var typecheckPrompt = "" + projectContext +
                "STEP 8: Run 'npx nx typecheck " + taskProject + "' to ensure no type errors. " +
                "Submit 'types-clean' if no errors, 'type-errors' if there are errors.";
            var typecheckResult = CC(typecheckPrompt);
            
            // Fix type errors if any
            while (typecheckResult == "type-errors") {
                var fixTypesPrompt = "" + criticalRule +
                    "Type errors found. Read the typecheck output carefully. " +
                    "Fix the type errors while maintaining test compatibility. " +
                    "Submit 'types-fixed' when done.";
                CC(fixTypesPrompt);
                
                // Re-run tests to ensure fixes didn't break anything
                var retestPrompt = "" + tddRule +
                    "Re-run tests with 'npx nx test " + taskProject + "' to ensure type fixes didn't break tests. " +
                    "Submit 'passed' if tests pass, 'failed' if any fail.";
                var retestResult = CC(retestPrompt);
                
                // If tests broke, fix them
                while (retestResult == "failed") {
                    var fixTestsAgainPrompt = "" + criticalRule +
                        "Tests broke after type fixes. Fix the issues while maintaining type safety. " +
                        "Submit 'fixed' when done.";
                    CC(fixTestsAgainPrompt);
                    retestResult = CC(retestPrompt);
                }
                
                // Try typecheck again
                typecheckResult = CC(typecheckPrompt);
            }
        }
        
        // Step 9: Commit changes
        var commitPrompt = "" + projectContext +
            "STEP 9: Git add and commit with message: 'fix(cvm): " + taskName + "'. " +
            "Include what was fixed in the message. " +
            "Submit 'committed' when done.";
        CC(commitPrompt);
        
        completedTasks.push(taskName);
        console.log("Completed: " + taskName);
        
        i = i + 1;
    }
    
    // Final summary
    console.log("\n=== Evolution Plan Progress ===");
    console.log("Completed tasks: " + completedTasks.length);
    
    return "Completed " + completedTasks.length + " evolution tasks.";
}