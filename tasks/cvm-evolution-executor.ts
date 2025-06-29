/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Evolution Plan Executor Started ===");
    
    // Base context prompt for every task
    var contextPrompt = "CONTEXT: You are working on CVM (Cognitive Virtual Machine) - a system that turns Claude into a systematic processor by executing programs one cognitive task at a time. " +
        "CVM is NOT a JavaScript runtime but a custom interpreter that: 1) Parses TypeScript-like code into bytecode, 2) Executes it in a VM with pause/resume capability, 3) Pauses at CC() calls for Claude to process tasks, 4) Preserves complete state between pauses. " +
        "PROJECT STRUCTURE: This is an Nx monorepo with packages: @cvm/parser (compiles TS to bytecode), @cvm/types (CVMValue type system), @cvm/vm (executes bytecode), @cvm/mcp-server (MCP integration), @cvm/storage (state persistence). " +
        "CURRENT MISSION: Fix critical architectural flaws identified in comprehensive analysis. The [] accessor system is fundamentally broken - obj[123] fails, array['0'] doesn't work like JavaScript, and the compiler emits wrong opcodes. " +
        "CRITICAL: Read the detailed plan at /home/laco/cvm/tasks/cvm-evolution-plan-atomic-steps.md for exact specifications. The line numbers in each task refer to this plan document. " +
        "METHODOLOGY: Follow TDD rigorously - write failing tests FIRST, then implement fixes. Use 'npx nx test <project>' for testing. Each atomic step has clear dependencies - ensure prerequisites are met. ";
    
    console.log("Context prompt created");
    console.log("Evolution plan document: /home/laco/cvm/tasks/cvm-evolution-plan-atomic-steps.md");
    
    // Additional context about the fixes
    var fixContext = "KEY PROBLEMS WE'RE FIXING: " +
        "1) [] ACCESSOR BUG: Line 114 in arrays.ts does 'const key = index as string' which breaks obj[123] access. " +
        "2) SILENT FAILURES: Compiler silently ignores unsupported syntax instead of reporting errors. " +
        "3) NO STACK SAFETY: Handlers do stack.pop()! without checking, causing crashes. " +
        "4) MEMORY LEAKS: VMs never removed from cache on deletion. " +
        "5) TYPE CONFUSION: Arrays enforce numeric indices only, breaking array['0'] JavaScript behavior. " +
        "6) NO ERROR HANDLING: Any error crashes the entire VM with no recovery. " +
        "SUCCESS CRITERIA: After fixes, CVM will have JavaScript-compliant [] accessors (array['0'] == array[0], obj[123] == obj['123']), " +
        "proper error reporting, safe stack operations, no memory leaks, and basic error recovery through CC(). ";
    
    // Common prompt parts
    var fileOpsBase = " " + contextPrompt + fixContext + "Use Read, Write, Edit tools for file operations. Use Bash tool for running commands. ";
    var submitDone = " Submit task with 'done' when complete.";
    var submitTest = " Submit 'passed' if tests pass, 'failed' if they fail.";
    var runTest = "Run tests using 'npx nx test' command with Bash tool. ";
    var buildProject = "Build project using 'npx nx build' command with Bash tool. ";
    var findCode = "Use Grep and Read tools to search and analyze code. ";
    
    console.log("Common prompts initialized");
    
    // Track completed tasks for debugging/recovery
    var completedTasks = [];
    
    // Define all evolution tasks with line references to atomic plan
    var tasks = [
        // PHASE 1: Foundation (No Dependencies)
        {
            name: "Step 1: Create Stack Safety Utils",
            implement: "Create stack safety utilities following plan lines 23-63. Create /packages/vm/src/lib/stack-utils.ts with safePop and isVMError functions.",
            test: "Create and run tests for stack-utils following lines 28-45.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 2: Update CVMArray Type",
            implement: "Update CVMArray type definition following plan lines 65-91. Add properties field to CVMArray interface in /packages/types/src/lib/cvm-value.ts.",
            test: "Create and run tests for CVMArray with properties following lines 70-82.",
            expectFailure: false,
            project: "types"
        },
        
        {
            name: "Step 3: Add Error Collection to Compiler",
            implement: "Add error collection array to compiler following plan lines 93-111. Add errors array at top of compile function in /packages/parser/src/lib/compiler.ts.",
            test: "Create and run tests for compiler error collection following lines 98-110.",
            expectFailure: false,
            project: "parser"
        },
        
        {
            name: "Step 4: VM Cache Memory Leak Fix",
            implement: "Fix VM cache memory leak following plan lines 113-134. Update deleteExecution method in /packages/vm/src/lib/vm-manager.ts line ~346.",
            test: "Create and run VM cache cleanup test following lines 118-130.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 10: Database Transaction Safety", 
            implement: "Implement database transactions following plan lines 136-175. Update deleteExecution in /packages/mongodb/src/lib/mongodb-adapter.ts.",
            test: "Create and run atomic deletion test following lines 141-155.",
            expectFailure: false,
            project: "mongodb"
        },
        
        // PHASE 2: Primitive Extraction Fixes (Depends on Phase 1)
        {
            name: "Step 5: Fix Object Property Key Extraction",
            implement: "Fix object property key extraction (Bug #6.1) following plan lines 179-210. Fix line 114 in /packages/vm/src/lib/handlers/arrays.ts.",
            test: "Create and run object property key tests following lines 184-203.",
            expectFailure: true, // TDD - test should fail first
            project: "vm"
        },
        
        {
            name: "Step 6: Write Array Index Tests",
            implement: "Write comprehensive array index handling tests following plan lines 212-235. Create tests for numeric indices, string-to-number conversion, and non-numeric properties.",
            test: "Run the new array index tests (should fail initially).",
            expectFailure: true, // TDD - tests should fail before fix
            project: "vm"
        },
        
        {
            name: "Step 6: Fix Array GET Index Extraction",
            implement: "Fix array GET index extraction (Bug #6.2) following plan lines 237-255. Update line 139 in arrays.ts with JavaScript-compliant logic.",
            test: "Run array index tests - GET tests should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 6: Fix Array SET Index Extraction", 
            implement: "Fix array SET index extraction (Bug #6.3) following plan lines 257-282. Update line 211 in arrays.ts with JavaScript-compliant assignment.",
            test: "Run array index tests - all should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 6.4: Fix Object Assignment Key",
            implement: "Fix object assignment key extraction (Bug #6.4) following plan lines 284-303. Fix line 187 in arrays.ts.",
            test: "Create and run object assignment key test following lines 289-297.",
            expectFailure: true, // TDD
            project: "vm"
        },
        
        // PHASE 3: Compiler Error Reporting (Depends on Step 3)
        {
            name: "Step 7: Implement Compiler Error Reporting",
            implement: "Implement full compiler error reporting following plan lines 307-362. Update reportError function, visitor else clause, and return statement in compiler.ts.",
            test: "Create and run compiler error reporting tests following lines 312-326.",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 4: Apply Stack Safety Everywhere (Depends on Step 1)
        {
            name: "Step 8: Update Arithmetic Handlers",
            implement: "Update arithmetic.ts with stack safety following plan lines 366-396. Replace all stack.pop()! with safePop pattern.",
            test: "Create and run arithmetic stack safety tests following lines 371-383.",
            expectFailure: true, // TDD
            project: "vm"
        },
        
        {
            name: "Step 8: Update Comparison Handlers",
            implement: "Update comparison.ts with stack safety following plan lines 366-396. Apply safePop pattern to all handlers.",
            test: "Run comparison handler tests.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 8: Update Logical Handlers",
            implement: "Update logical.ts with stack safety following plan lines 366-396. Apply safePop pattern to all handlers.",
            test: "Run logical handler tests.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 8: Update Object Handlers",
            implement: "Update objects.ts with stack safety following plan lines 366-396. Apply safePop pattern to all handlers.",
            test: "Run object handler tests.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 8: Update String Handlers",
            implement: "Update strings.ts with stack safety following plan lines 366-396. Apply safePop pattern to all handlers.",
            test: "Run string handler tests.",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 5: State Management (Depends on Primitive Extraction)
        {
            name: "Step 9: Create State Serialization Tests",
            implement: "Create centralized state serialization tests following plan lines 400-419. Test serialize/deserialize cycle.",
            test: "Run the new state serialization tests (may fail if not implemented).",
            expectFailure: true,
            project: "vm"
        },
        
        {
            name: "Step 9: Implement State Serialization",
            implement: "Implement centralized state serialization following plan lines 421-461. Create serializeVMState and deserializeVMState methods in vm-manager.ts.",
            test: "Run state serialization tests - should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 9: Replace State Copying Code",
            implement: "Replace all 6+ manual state copying locations following plan lines 463-467. Use the new serialization methods.",
            test: "Run all VM manager tests to ensure refactoring works.",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 6: Type System and Error Handling (Depends on Stack Safety)
        {
            name: "Step 11: Fix Type Detection Tests",
            implement: "Create ADD opcode type handling tests following plan lines 471-486. Test string concatenation behavior.",
            test: "Run the new type detection tests (should fail).",
            expectFailure: true,
            project: "vm"
        },
        
        {
            name: "Step 11: Fix Type Detection Heuristics",
            implement: "Fix type detection heuristics following plan lines 488-515. Remove compiler heuristic and update ADD handler in VM.",
            test: "Run type detection tests - should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 12: Error Propagation Through CC",
            implement: "Implement error propagation through CC() following plan lines 517-543. Update VM execute loop to allow CC() to handle errors.",
            test: "Create and run CC error handling tests following lines 522-536.",
            expectFailure: true,
            project: "vm"
        },
        
        // PHASE 7: JavaScript Compliance Testing (Depends on Primitive Extraction)
        {
            name: "Step 13: JavaScript Compliance Tests",
            implement: "Create comprehensive JavaScript compliance test suite following plan lines 547-607. Test array[\"0\"] equals array[0], obj[123] equals obj[\"123\"], string indexing, etc.",
            test: "Run the JavaScript compliance tests (many will fail initially).",
            expectFailure: true,
            project: "vm"
        },
        
        // PHASE 8: Missing Features (Depends on Previous Phases)
        {
            name: "Step 14: String Character Access Tests",
            implement: "Create string character access tests following plan lines 611-625. Test \"hello\"[0] returns \"h\".",
            test: "Run string character access tests (will fail - not implemented).",
            expectFailure: true,
            project: "vm"
        },
        
        {
            name: "Step 14: Implement String Character Access",
            implement: "Implement string character access following plan lines 627-650. Add string handling to ARRAY_GET handler.",
            test: "Run string character access tests - should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 15: Stack Manipulation Opcodes",
            implement: "Implement stack manipulation opcodes following plan lines 652-717. Add DUP, SWAP, DUP2 to bytecode.ts and create handlers.",
            test: "Create and run stack manipulation tests following lines 657-677.",
            expectFailure: false,
            project: "vm"
        },
        
        {
            name: "Step 16: Array Methods Without Functions",
            implement: "Implement array methods without functions following plan lines 719-772. Add ARRAY_MAP_PROP and ARRAY_FILTER_PROP opcodes.",
            test: "Create and run array method tests following lines 724-742.",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 9: Architectural Improvements (Depends on Multiple Phases)
        {
            name: "Step 17: Unified GET/SET Design Tests",
            implement: "Create unified GET/SET opcode tests following plan lines 776-805. Test GET on arrays, objects, and strings.",
            test: "Run unified GET tests (will fail - not implemented).",
            expectFailure: true,
            project: "vm"
        },
        
        {
            name: "Step 17: Implement Unified GET/SET",
            implement: "Implement unified GET/SET opcodes following plan lines 807-835. Add new opcodes and create unified handler.",
            test: "Run unified GET/SET tests - should now pass.",
            expectFailure: false,
            project: "vm"
        },
        
        // PHASE 10: Integration and Documentation
        {
            name: "Step 19: Integration Test Suite",
            implement: "Create full integration test suite following plan lines 858-883. Test complete TypeScript to result pipeline.",
            test: "Run integration tests to validate all fixes work together.",
            expectFailure: false,
            project: "integration"
        },
        
        {
            name: "Step 20: Update Documentation",
            implement: "Update technical debt documentation following plan lines 885-891. Remove obsolete TODOs, update API docs.",
            test: "",
            expectFailure: false,
            project: ""
        }
    ];
    
    // Process all tasks
    console.log("Starting task processing. Total tasks: " + tasks.length);
    var i = 0;
    while (i < tasks.length) {
        console.log("\n=== Task " + (i + 1) + " of " + tasks.length + " ===");
        var task = tasks[i];
        
        var taskName = task["name"];
        var taskImplement = task["implement"];
        var taskTest = task["test"];
        var taskProject = task["project"];
        
        console.log("Task: " + taskName);
        
        // First, have Claude read the relevant section of the plan
        var readPlanPrompt = "" + "[" + taskName + "]: " + fileOpsBase + "Read the atomic plan section for " + taskName + " in /home/laco/cvm/tasks/cvm-evolution-plan-atomic-steps.md. " + taskImplement + " Then proceed with implementation." + submitDone;
        CC(readPlanPrompt);
        
        var continueOnFeature = true;

        // Test phase if task has tests
        if (taskTest != "") {
            console.log("Running tests for: " + taskName);
            var expectFailure = task["expectFailure"];
            var testPrompt = "" + fileOpsBase + taskTest + " " + runTest + taskProject + submitTest;
            var testResult = CC(testPrompt);
            
            // For TDD: some tests are expected to fail initially
            if (expectFailure && testResult == "failed") {
                console.log("Test failed as expected (TDD). Continue with implementation.");
            } else if (expectFailure && testResult == "passed") {
                // Test was expected to fail but passed
                console.log("TDD: Test passed but was expected to fail. Feature may already be implemented.");
                var checkFeature = CC("The test for '" + taskName + "' passed but was expected to fail. Check if the feature is already implemented or if the test needs adjustment. Submit 'implemented' if feature exists, 'adjust' if test needs fixing.");
                continueOnFeature = checkFeature != "implemented";
                if (checkFeature == "adjust") {
                    CC("" + fileOpsBase + "Adjust the test to properly capture the expected failure condition, then re-run." + submitDone);
                    testResult = CC(testPrompt);
                }
            } else if (!expectFailure && testResult == "failed") {
                // Test should pass but failed - need to fix
                while (testResult != "passed") {
                    console.log("Tests failing. Debugging and fixing...");
                    CC("" + fileOpsBase + findCode + "Fix the implementation for " + taskName + ". Check the atomic plan for exact specifications. Make minimal changes to make tests pass." + submitDone);
                    testResult = CC("" + fileOpsBase + runTest + taskProject + " to verify fixes." + submitTest);
                }
            }
        }
        
        if(continueOnFeature) {           
            // Simple commit without parsing task name
            CC("" + fileOpsBase + "Git add and commit changes with message: 'fix(cvm): " + taskName + "' - Include brief description of what was fixed." + submitDone);
        }
        
        completedTasks.push(taskName);
        console.log("Completed: " + taskName);
        
        i = i + 1;
    }
    
    // Final verification
    console.log("\n=== Running Final Verification ===");
    
    // Test each package
    var packages = ["types", "parser", "vm", "mongodb"];
    var p = 0;
    while (p < packages.length) {
        var pkg = packages[p];
        var pkgTests = CC("" + fileOpsBase + runTest + pkg + " - Run all " + pkg + " package tests." + submitTest);
        while (pkgTests != "passed") {
            CC("" + fileOpsBase + "Fix any remaining " + pkg + " test failures." + submitDone);
            pkgTests = CC("" + fileOpsBase + runTest + pkg + " - Re-run " + pkg + " tests." + submitTest);
        }
        p = p + 1;
    }
    
    // Run integration tests
    CC("" + fileOpsBase + "Run any integration tests to verify cross-package functionality." + submitDone);
    
    // Final code review
    CC("" + fileOpsBase + "Use mcp__zen__codereview to review all changes against the original issues in /home/laco/cvm/tasks/1-almost-all.md and /home/laco/cvm/tasks/1-mostly-focus-on-vm.md. Ensure all critical issues are resolved." + submitDone);
    
    // Update Memory Bank
    CC("" + fileOpsBase + "Update Memory Bank with completion status of CVM Evolution Plan Phase 1. Document which steps were completed and any deviations from the plan." + submitDone);
    
    console.log("\n=== CVM Evolution Plan Execution Complete! ===");
    console.log("Completed tasks: " + completedTasks.length);
    var summary = "Evolution Plan Complete. Completed " + completedTasks.length + " tasks.";
    
    // Create completion report
    var report = CC("" + fileOpsBase + "Create a completion report listing: 1) All completed fixes, 2) Test coverage improvements, 3) Any remaining issues for future phases. Save as /home/laco/cvm/tasks/evolution-phase1-complete.md" + submitDone);
    
    return summary;
}