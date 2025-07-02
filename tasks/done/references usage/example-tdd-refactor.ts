/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Reference Heap Fix Program Started ===");
    
    // Base context prompt for every task
    var contextPrompt = "CONTEXT: You are fixing remaining issues in the CVM reference heap implementation. CRITICAL: Read the detailed fix plan at /home/laco/cvm/tasks/reference-heap-detailed-fix-plan.md for exact specifications. The line numbers in each task refer to this plan document. Follow TDD rigorously - write failing tests first, then implement fixes. Use 'npx nx test <project>' for testing. ";
    
    console.log("Context prompt created");
    console.log("contextPrompt: " + contextPrompt);
    
    // Common prompt parts
    var fileOpsBase = contextPrompt + "Use Read, Write, Edit tools for file operations. Use Bash tool for running commands. ";
    console.log("fileOpsBase: " + fileOpsBase);
    
    var submitDone = " Submit task with 'done' when complete.";
    console.log("submitDone: " + submitDone);
    
    var submitTest = " Submit 'passed' if tests pass, 'failed' if they fail.";
    console.log("submitTest: " + submitTest);
    
    var runTest = "Run tests using 'npx nx test' command with Bash tool. ";
    console.log("runTest: " + runTest);
    
    var buildProject = "Build project using 'npx nx build' command with Bash tool. ";
    console.log("buildProject: " + buildProject);
    
    var findCode = "Use Grep and Read tools to search and analyze code. ";
    console.log("findCode: " + findCode);
    
    console.log("Common prompts initialized");
    
    // Track completed tasks for debugging/recovery
    var completedTasks = [];
    
    // Define all fix tasks as array with line references to plan
    var tasks = [
        // Issue 1: VM Crash on Invalid Heap Access
        // {
        //     name: "Write Test: Invalid Heap Access",
        //     implement: "Create test for invalid heap access following plan lines 34-44 (section 1.2). Write test that expects undefined instead of thrown error.",
        //     expectFailure: true,
        //     test: "Run the newly created heap test to verify it fails (TDD).",
        //     project: "vm"
        // },
        
        // {
        //     name: "Fix: Heap Get Method",
        //     implement: "Fix heap.get() method following plan lines 46-50 (section 1.3). Change line 60 from throwing error to returning undefined.",
        //     expectFailure: false,
        //     test: "Run heap tests to ensure they now pass.",
        //     project: "vm"
        // },
        
        // Issue 2: Stack Overflow in Serialization
        // {
        //     name: "Write Test: Deep Nesting",
        //     implement: "Create deep nesting test following plan lines 65-89 (section 2.3). Test should create 1000-level deep nested object.",
        //     expectFailure: true,
        //     test: "Run the new serialization test (should fail with stack overflow).",
        //     project: "vm"
        // },
        
        {
            name: "Fix: Extract Serialization Function",
            implement: "Extract duplicated serialization code following plan lines 91-107 (section 2.4). Create serializeHeap private method.",
            expectFailure: false,
            test: "Run VM manager tests to ensure refactoring didn't break anything.",
            project: "vm"
        },
        
        {
            name: "Fix: Replace Duplicated Code",
            implement: "Replace duplicated code following plan lines 109-112 (section 2.5). Use the new serializeHeap method in both locations.",
            expectFailure: false,
            test: "Run VM manager tests again.",
            project: "vm"
        },
        
        {
            name: "Fix: Implement Safe Serialization",
            implement: "Implement safe serialization following plan lines 113-142 (section 2.6). Use the JSON.parse(JSON.stringify(data, replacer)) pattern to serialize each heap object's data individually. This handles deep nesting and circular references.",
            expectFailure: false,
            test: "Run deep nesting test - should now pass.",
            project: "vm"
        },
        
        {
            name: "Fix: Implement Safe Deserialization",
            implement: "Implement safe deserialization following plan lines 144-204 (section 2.6). Create deserializeHeap and restoreReferences private methods as specified. Then find where execution.heap is assigned to state.heap and use the new deserializeHeap method.",
            expectFailure: false,
            test: "Create a test that saves state with heap references, then loads it back and verifies references are correctly restored.",
            project: "vm"
        },
        
        // Issue 3: ARRAY_GET/SET Handle Objects
        {
            name: "Write Test: Array-Only Access",
            implement: "Create tests for array-only access following plan lines 218-233 (section 3.3). Test that ARRAY_GET rejects object access.",
            expectFailure: true,
            test: "Run the new array handler tests (should fail).",
            project: "vm"
        },
        
        {
            name: "Fix: Remove Object Handling from ARRAY_GET",
            implement: "Remove object handling from ARRAY_GET following plan lines 234-238 (section 3.4). Remove lines 97-107 and 135-149.",
            expectFailure: false,
            test: "Run array handler tests - ARRAY_GET tests should pass.",
            project: "vm"
        },
        
        {
            name: "Write Test: ARRAY_SET Array-Only",
            implement: "Create tests for ARRAY_SET array-only access following plan lines 239-253 (section 3.5). Test that ARRAY_SET rejects object access.",
            expectFailure: true,
            test: "Run the ARRAY_SET tests (should fail).",
            project: "vm"
        },
        
        {
            name: "Fix: Remove Object Handling from ARRAY_SET",
            implement: "Apply fixes to ARRAY_SET following plan lines 255-261 (section 3.6). Remove object handling code from ARRAY_SET handler.",
            expectFailure: false,
            test: "Run all array handler tests.",
            project: "vm"
        },
        
        // Issue 4: Inconsistent Undefined Handling
        {
            name: "Write Test: Undefined Handling",
            implement: "Create undefined handling test following plan lines 269-284 (section 4.2). Test missing array elements return undefined.",
            expectFailure: true,
            test: "Run the new undefined test (should fail - returns null).",
            project: "vm"
        },
        
        {
            name: "Fix: Undefined Returns",
            implement: "Fix undefined handling following plan lines 286-290 (section 4.3). Import createCVMUndefined and use it instead of null.",
            expectFailure: false,
            test: "Run undefined handling tests - should now pass.",
            project: "vm"
        },
        
        // Issue 5: Missing Heap Behavior Tests
        {
            name: "Create Heap Behavior Tests",
            implement: "Create comprehensive heap behavior tests following plan lines 297-323 (section 5.2). Test array/object literals create heap refs.",
            expectFailure: false,
            test: "Run the new heap behavior tests.",
            project: "vm"
        },
        
        {
            name: "Create Integration Tests",
            implement: "Create heap efficiency integration tests following plan lines 325-330 (section 5.3). Test 10k element arrays.",
            expectFailure: false,
            test: "Run integration tests to verify efficiency.",
            project: "vm"
        },
        
        // Issue 6: Performance Verification
        {
            name: "Create Performance Benchmarks",
            implement: "Create performance benchmarks following plan lines 333-343 (sections 6.1-6.2). Compare inline vs heap performance.",
            expectFailure: false,
            test: "Run benchmarks and verify performance targets.",
            project: "vm"
        },
        
        // Final Verification
        {
            name: "Full Test Suite",
            implement: "Run complete test suite following plan lines 346-349 (section 7.1). Ensure all tests pass.",
            expectFailure: false,
            test: "Verify all VM tests pass.",
            project: "vm"
        },
        
        {
            name: "Build Verification",
            implement: "Perform full build following plan lines 351-355 (section 7.2). Reset nx and rebuild all packages.",
            expectFailure: false,
            test: "",
            project: ""
        },
        
        {
            name: "Integration Test Suite",
            implement: "Run integration tests following plan lines 357-361 (section 7.3). Test with complex CVM programs.",
            expectFailure: false,
            test: "",
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
        
        // Implementation phase
        var implementPrompt = "" + fileOpsBase + taskImplement + submitDone;
        CC(implementPrompt);
        
        // maybe feature is already implemented, but it will be found when we try write failing test and test is requested, set it true as default
        var continueOnFeature = true;

        // Test phase if task has tests
        if (taskTest != "") {
            console.log("Running tests for: " + taskName);
            var expectFailure = task["expectFailure"];
            var testPrompt = "" + fileOpsBase + taskTest + " " + runTest + taskProject + submitTest;
            var testResult = CC(testPrompt);
            
            // For TDD: some tests are expected to fail initially
            if (expectFailure && testResult == "failed") {
                console.log("Test failed as expected (TDD). Moving to next task for implementation.");
            } else if (expectFailure && testResult == "passed") {
                // Test was expected to fail but passed - this indicates a problem with the test
                console.log("TDD ERROR: Test was expected to fail but passed. The test may not be correctly capturing the bug.");
                var featureImplemented = CC("TDD ERROR: The test for '" + taskName + "' was expected to fail but it passed. Please review the test implementation in the plan and the code it's testing to ensure it correctly captures the failure condition. Fix the test and re-run. Submit 'fixed' when done. but feature can be already implemented submit 'implemented'");
                // feature mey be done
                continueOnFeature = featureImplemented != 'implemented';
            } else if (!expectFailure && testResult == "failed") {
                // Test should pass but failed - need to fix
                while (testResult != "passed") {
                    console.log("Tests unexpectedly failing. Fixing implementation...");
                    CC("" + fileOpsBase + findCode + "Fix the implementation for " + taskName + ". Check the detailed plan for guidance. Make minimal changes to make tests pass." + submitDone);
                    testResult = CC("" + fileOpsBase + runTest + taskProject + " to verify fixes." + submitTest);
                }
            }
        }
        
        if(continueOnFeature) {
            // Commit after each major fix
            if (taskName.indexOf("Test") == -1 && taskName.indexOf("Verification") == -1) {
                CC("" + fileOpsBase + "Git add and commit changes with message: 'fix(heap): " + taskName + "' - Include what was fixed." + submitDone);
            }
        }
        
        completedTasks.push(taskName);
        console.log("Completed: " + taskName);
        
        i = i + 1;
    }
    
    // Final verification
    var allVmTests = CC("" + fileOpsBase + runTest + "vm - Run entire VM test suite." + submitTest);
    while (allVmTests != "passed") {
        CC("" + fileOpsBase + "Fix any remaining VM test failures." + submitDone);
        allVmTests = CC("" + fileOpsBase + runTest + "vm - Re-run VM tests." + submitTest);
    }
    
    // Cross-check fixes
    CC("" + fileOpsBase + "Use mcp__zen__codereview to review all heap fixes against the issues in /home/laco/cvm/tasks/reference-heap-findings.md. Ensure all issues are resolved." + submitDone);
    
    // Update Memory Bank
    CC("" + fileOpsBase + "Update /home/laco/cvm/memory-bank/progress.md with completion of heap reference fixes. Note all issues resolved and any performance improvements measured." + submitDone);
    
    console.log("\n=== CVM Reference Heap Fixes Complete! ===");
    console.log("Completed tasks: " + completedTasks.length);
    return "Reference Heap Fixes Complete";
}