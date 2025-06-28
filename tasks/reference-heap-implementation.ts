/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Reference Heap Implementation Program Started ===");
    
    // Base context prompt for every task
    var contextPrompt = "CONTEXT: You are implementing reference-based object storage for CVM to solve disk storage explosion with large arrays/objects. CRITICAL: Read the detailed plan at /home/laco/cvm/reference-heap-implementation-plan.md for exact specifications. The line numbers in each task refer to this plan document. Follow TDD rigorously - write failing tests first, then implement. Use 'npx nx test <project>' for testing. Read existing code before modifying. ";
    
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
    
    // Define all implementation tasks as array with line references to plan
    var tasks = [
        // Phase 1: Type System Foundation (Day 1 Morning)
        {
            name: "Reference Type Tests",
            implement: "Create reference type tests following plan lines 58-75 (Phase 1.1). Write failing tests for CVMArrayRef and CVMObjectRef type guards.",
            test: "Run the newly created type guard tests.",
            project: "types"
        },
        
        {
            name: "Reference Type Implementation",
            implement: "Implement reference types following plan lines 77-82 (Phase 1.2). Add CVMArrayRef, CVMObjectRef interfaces and update CVMValue union.",
            test: "Run type guard tests to ensure they pass.",
            project: "types"
        },
        
        {
            name: "Heap Type Tests",
            implement: "Create heap tests following plan lines 84-107 (Phase 1.3). Test heap allocation, ID increment, and invalid reference handling.",
            test: "Run the heap operation tests.",
            project: "vm"
        },
        
        {
            name: "Heap Implementation",
            implement: "Implement VM heap following plan lines 109-113 (Phase 1.4). Create vm-heap.ts with heap management functions.",
            test: "Run heap tests to ensure they pass.",
            project: "vm"
        },
        
        // Phase 2: Array Creation and Basic Operations (Day 1 Afternoon)
        {
            name: "Array Reference Tests",
            implement: "Create array reference tests following plan lines 117-141 (Phase 2.1). Test ARRAY_NEW returns references and ARRAY_PUSH works with refs.",
            test: "Run array reference handler tests.",
            project: "vm"
        },
        
        {
            name: "Array Reference Implementation",
            implement: "Update array handlers following plan lines 143-147 (Phase 2.2). Modify ARRAY_NEW, ARRAY_PUSH, ARRAY_GET, ARRAY_SET, ARRAY_LENGTH.",
            test: "Run array handler tests and ensure no existing tests break.",
            project: "vm"
        },
        
        // Phase 3: Object Creation and Property Access (Day 2 Morning)
        {
            name: "Object Reference Tests",
            implement: "Create object reference tests following plan lines 151-177 (Phase 3.1). Test OBJECT_CREATE returns refs and PROPERTY_SET works.",
            test: "Run object reference handler tests.",
            project: "vm"
        },
        
        {
            name: "Object Reference Implementation",
            implement: "Update object handlers following plan lines 179-183 (Phase 3.2). Modify OBJECT_CREATE, PROPERTY_GET, PROPERTY_SET, PROPERTY_DELETE.",
            test: "Run object handler tests and ensure no existing tests break.",
            project: "vm"
        },
        
        // Phase 4: Reference Semantics and Variable Storage (Day 2 Afternoon)
        {
            name: "Reference Semantics Tests",
            implement: "Create reference semantics tests following plan lines 187-212 (Phase 4.1). Test shared mutations and nested structures.",
            test: "Run reference semantics integration tests.",
            project: "vm"
        },
        
        {
            name: "Variable Reference Fix",
            implement: "Ensure variables store references correctly following plan lines 214-218 (Phase 4.2). STORE and LOAD should handle refs properly.",
            test: "Run all variable and reference tests.",
            project: "vm"
        },
        
        // Phase 5: Serialization and Persistence (Day 3 Morning)
        {
            name: "Serialization Tests",
            implement: "Create heap serialization tests following plan lines 222-249 (Phase 5.1). Test heap persistence across CC() calls.",
            test: "Run VM manager heap tests.",
            project: "vm"
        },
        
        {
            name: "Serialization Implementation", 
            implement: "Update VM manager serialization following plan lines 251-256 (Phase 5.2). Add heap to execution state serialization.",
            test: "Run VM manager tests and integration tests.",
            project: "vm"
        },
        
        // Phase 6: Equality and Type Operations (Day 3 Afternoon)
        {
            name: "Equality Operator Tests",
            implement: "Create reference equality tests following plan lines 260-280 (Phase 6.1). Test === for references and typeof behavior.",
            test: "Run operator reference tests.",
            project: "vm"
        },
        
        {
            name: "Equality Operator Implementation",
            implement: "Update comparison operators following plan lines 282-287 (Phase 6.2). Handle reference equality and typeof for refs.",
            test: "Run all operator tests.",
            project: "vm"
        },
        
        // Phase 7: Integration and Migration (Day 4)
        {
            name: "Backward Compatibility Tests",
            implement: "Create compatibility tests following plan lines 291-301 (Phase 7.1). Ensure existing programs still work.",
            test: "Run compatibility tests.",
            project: "vm"
        },
        
        {
            name: "Performance Benchmark",
            implement: "Create performance benchmarks following plan lines 303-312 (Phase 7.2). Measure serialization and access performance.",
            test: "Run performance benchmarks and verify no major regression.",
            project: "vm"
        },
        
        // Phase 8: Cleanup and Documentation
        {
            name: "Code Cleanup",
            implement: "Clean up code following Phase 8 guidelines. Extract common helpers, add JSDoc comments, update exports.",
            test: "Run all tests to ensure nothing broke during cleanup.",
            project: "vm"
        },
        
        {
            name: "Integration Test Suite",
            implement: "Create 10k files integration test. Test the original problematic scenario with fs.listFiles() and multiple CC() calls.",
            test: "Run the integration test suite.",
            project: "vm"
        },
        
        // Final verification
        {
            name: "Full Test Suite",
            implement: "Run complete test suite following plan lines 336-339. Ensure 100% backward compatibility.",
            test: "Verify all tests pass.",
            project: "vm"
        },
        
        {
            name: "Build Verification",
            implement: "Verify builds following plan success criteria. Run nx build for vm and types packages.",
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
        
        // Test phase if task has tests
        if (taskTest != "") {
            console.log("Running tests for: " + taskName);
            var testPrompt = "" + fileOpsBase + taskTest + " " + runTest + taskProject + submitTest;
            var testResult = CC(testPrompt);
            
            // Fix failing tests in TDD style
            while (testResult != "passed") {
                console.log("Tests failing as expected in TDD. Implementing solution...");
                CC("" + fileOpsBase + findCode + "Fix the failing tests for " + taskName + ". Make minimal changes to make tests pass. Follow TDD principles." + submitDone);
                testResult = CC("" + fileOpsBase + runTest + taskProject + " to verify fixes." + submitTest);
            }
        }
        
        // Commit after each task
        CC("" + fileOpsBase + "Git add and commit changes with message: 'feat(heap): " + taskName + "' - Include what was implemented." + submitDone);
        
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
    
    // Cross-check implementation
    CC("" + fileOpsBase + "Use mcp__zen__codereview to review the complete reference heap implementation against the plan in /home/laco/cvm/reference-heap-implementation-plan.md. Ensure all requirements are met and no regressions introduced." + submitDone);
    
    // Final summary
    CC("" + fileOpsBase + "Create a summary of the implementation in /home/laco/cvm/reference-heap-summary.md including: 1) What was implemented, 2) Performance improvements measured, 3) Any deviations from the plan, 4) Next steps for reference counting when functions are added." + submitDone);
    
    console.log("\n=== CVM Reference Heap Implementation Complete! ===");
    console.log("Completed tasks: " + completedTasks.length);
    return "Reference Heap Implementation Complete";
}