/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== String & Array Methods Implementation Program (TDD) ===");
    
    // Base context for all tasks
    var contextPrompt = "CONTEXT: You are implementing string and array methods for CVM (Cognitive Virtual Machine) using TDD. " +
        "CVM is a custom TypeScript interpreter that compiles to bytecode and executes in a VM. " +
        "You are adding 12 string methods and 3 array methods that don't require callback functions. " +
        "REFERENCE DOCS: Use /home/laco/cvm/tasks/string-array-methods-ordered-plan.md which contains line references " +
        "to the detailed implementation at /home/laco/cvm/tasks/string-array-methods-implementation-plan.md. " +
        "KEY POINTS: 1) All imports must use .js extension even for .ts files, 2) Use npx nx test for testing, " +
        "3) Follow TDD - write failing tests first, 4) Methods must be JavaScript-compliant.";
    
    console.log("Context created. Starting TDD implementation...");
    
    // Common prompts
    var fileOpsBase = " " + contextPrompt + " Use Read, Write, Edit, MultiEdit tools for file operations. Use Bash tool for running commands. ";
    var submitDone = " Submit task with 'done' when complete.";
    var submitTest = " Submit 'passed' if tests pass, 'failed' if they fail.";
    var runTest = "Run tests using appropriate nx command based on project type with Bash tool. ";
    var findCode = "Use Grep and Read tools to search and analyze code. ";
    var rebuildNote = " Remember: After implementing handlers or compiler changes, rebuild affected packages before running integration/E2E tests. ";
    
    // Track progress
    var completedTasks = [];
    
    // TDD Tasks - Test First, Then Implement
    var tasks = [
        // PHASE 1: Foundation - Opcodes (No tests needed, just setup)
        {
            name: "Task 1: Add Opcodes to Bytecode",
            implement: "Follow ordered plan Lines 8-15. Add all 15 opcodes to /home/laco/cvm/packages/parser/src/lib/bytecode.ts OpCode enum: STRING_INCLUDES, STRING_ENDS_WITH, STRING_STARTS_WITH, STRING_TRIM, STRING_TRIM_START, STRING_TRIM_END, STRING_REPLACE, STRING_REPLACE_ALL, STRING_LAST_INDEX_OF, STRING_REPEAT, STRING_PAD_START, STRING_PAD_END, ARRAY_SLICE, ARRAY_JOIN, ARRAY_INDEX_OF. Reference: Implementation plan lines 507-529.",
            test: "",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 2: String Checking Methods (includes, endsWith, startsWith)
        {
            name: "Task 2: Write VM Unit Tests for String Checking Methods",
            implement: "Create unit test file 'strings-checking.spec.ts' in /home/laco/cvm/packages/vm/src/lib/handlers/. Write tests for STRING_INCLUDES, STRING_ENDS_WITH, STRING_STARTS_WITH handlers. Test the handler functions directly with mock VM state. Reference: Implementation plan lines 52-115 for handler behavior.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-checking.spec.ts' (should fail - handlers not implemented).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 3: Implement String Checking Handlers",
            implement: "Follow ordered plan Lines 34-41. Implement in /home/laco/cvm/packages/vm/src/lib/handlers/advanced.ts: STRING_INCLUDES handler (Implementation plan lines 52-67), STRING_ENDS_WITH handler (Implementation plan lines 76-91), STRING_STARTS_WITH handler (Implementation plan lines 100-115). Make sure handlers are registered in the handlers map.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-checking.spec.ts' (should now pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 4: Add Compiler Support for String Checking",
            implement: "Follow ordered plan Lines 28-30. Add compiler support for string checking methods in /home/laco/cvm/packages/parser/src/lib/compiler/expressions/call-expression.ts. Add cases for includes, endsWith, startsWith that emit the new opcodes. Reference: Implementation plan lines 455-468.",
            test: "Build parser package with 'npx nx build parser' to verify compilation.",
            expectFailure: false,
            project: "parser"
        },
        {
            name: "Task 5: Write Integration Tests for String Checking",
            implement: "Create integration test in /home/laco/cvm/packages/integration/src/ called 'string-checking-methods.spec.ts'. Test complete flow: compile TypeScript code using the methods -> execute in VM -> verify results. Reference: Implementation plan lines 580-590 for test cases.",
            test: "Run integration tests with 'npx nx test integration -- string-checking-methods.spec.ts' (should pass).",
            expectFailure: false,
            project: "integration"
        },
        
        // PHASE 3: String Trim Methods
        {
            name: "Task 6: Write VM Unit Tests for String Trim Methods",
            implement: "Create unit test file 'strings-trim.spec.ts' in /home/laco/cvm/packages/vm/src/lib/handlers/. Write tests for STRING_TRIM, STRING_TRIM_START, STRING_TRIM_END handlers. Test whitespace removal behavior. Reference: Implementation plan lines 124-137, 209-233.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-trim.spec.ts' (should fail).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 7: Implement Trim Handlers",
            implement: "Follow ordered plan Lines 56-60. Implement STRING_TRIM handler (Implementation plan lines 124-137), STRING_TRIM_START and STRING_TRIM_END handlers (Implementation plan lines 209-233) in advanced.ts.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-trim.spec.ts' (should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 8: Add Compiler Support for Trim Methods",
            implement: "Follow ordered plan Lines 52-54. Add compiler support for trim methods. Add cases for trim, trimStart, trimEnd. Reference: Implementation plan lines 470-473, 536-543.",
            test: "Build parser package.",
            expectFailure: false,
            project: "parser"
        },
        {
            name: "Task 9: Write Integration Tests for Trim Methods",
            implement: "Add trim method tests to the integration test file. Test whitespace removal from user input. Reference: Implementation plan lines 598-601.",
            test: "Run integration tests (should pass).",
            expectFailure: false,
            project: "integration"
        },
        
        // PHASE 4: String Replace Methods
        {
            name: "Task 10: Write VM Unit Tests for String Replace Methods",
            implement: "Create unit test file 'strings-replace.spec.ts' in /home/laco/cvm/packages/vm/src/lib/handlers/. Write tests for STRING_REPLACE and STRING_REPLACE_ALL handlers. Test single vs all occurrences. Reference: Implementation plan lines 146-199.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-replace.spec.ts' (should fail).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 11: Implement Replace Handlers",
            implement: "Follow ordered plan Lines 75-79. Implement STRING_REPLACE handler - FIRST occurrence only (Implementation plan lines 146-169), and STRING_REPLACE_ALL handler (Implementation plan lines 178-199).",
            test: "Run VM unit tests with 'npx nx test vm -- strings-replace.spec.ts' (should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 12: Add Compiler Support for Replace Methods",
            implement: "Follow ordered plan Lines 71-73. Add compiler support for replace and replaceAll. Reference: Implementation plan lines 474-479, 544-549.",
            test: "Build parser package.",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 5: String Utility Methods (lastIndexOf, repeat)
        {
            name: "Task 13: Write VM Unit Tests for String Utility Methods",
            implement: "Create unit test file 'strings-utility.spec.ts' in /home/laco/cvm/packages/vm/src/lib/handlers/. Write tests for STRING_LAST_INDEX_OF and STRING_REPEAT handlers. Reference: Implementation plan lines 242-283.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-utility.spec.ts' (should fail).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 14: Implement Utility Handlers",
            implement: "Follow ordered plan Lines 94-98. Implement STRING_LAST_INDEX_OF handler (Implementation plan lines 242-257) and STRING_REPEAT handler (Implementation plan lines 266-283).",
            test: "Run VM unit tests with 'npx nx test vm -- strings-utility.spec.ts' (should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 15: Add Compiler Support for Utility Methods",
            implement: "Follow ordered plan Lines 90-92. Add compiler support for lastIndexOf and repeat. Reference: Implementation plan lines 550-558.",
            test: "Build parser package.",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 6: String Padding Methods
        {
            name: "Task 16: Write VM Unit Tests for String Padding Methods",
            implement: "Add tests to 'strings-utility.spec.ts' for STRING_PAD_START and STRING_PAD_END handlers. Test padding with different fill strings. Reference: Implementation plan lines 294-336.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-utility.spec.ts' (padding tests should fail).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 17: Implement Padding Handlers",
            implement: "Follow ordered plan Lines 113-114. Implement STRING_PAD_START and STRING_PAD_END handlers. Reference: Implementation plan lines 294-336.",
            test: "Run VM unit tests with 'npx nx test vm -- strings-utility.spec.ts' (all should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 18: Add Compiler Support for Padding Methods",
            implement: "Follow ordered plan Lines 109-111. Add compiler support for padStart and padEnd. Reference: Implementation plan lines 560-571.",
            test: "Build parser package.",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 7: Array Methods
        {
            name: "Task 19: Write VM Unit Tests for Array Methods",
            implement: "Create unit test file 'arrays-new-methods.spec.ts' in /home/laco/cvm/packages/vm/src/lib/handlers/. Write tests for ARRAY_SLICE, ARRAY_JOIN, and ARRAY_INDEX_OF handlers. Reference: Implementation plan lines 347-446.",
            test: "Run VM unit tests with 'npx nx test vm -- arrays-new-methods.spec.ts' (should fail).",
            expectFailure: true,
            project: "vm"
        },
        {
            name: "Task 20: Implement Array Handlers",
            implement: "Follow ordered plan Lines 132-139. Implement in /home/laco/cvm/packages/vm/src/lib/handlers/arrays.ts: ARRAY_SLICE handler (Implementation plan lines 347-379), ARRAY_JOIN handler (Implementation plan lines 388-413), ARRAY_INDEX_OF handler (Implementation plan lines 422-446).",
            test: "Run VM unit tests with 'npx nx test vm -- arrays-new-methods.spec.ts' (should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 21: Add Compiler Support for Array Methods",
            implement: "Follow ordered plan Lines 125-128. Add compiler support for slice, join, indexOf. Note: slice needs special handling for optional second argument. Reference: Implementation plan lines 481-501.",
            test: "Build parser package.",
            expectFailure: false,
            project: "parser"
        },
        
        // PHASE 8: Integration Testing
        {
            name: "Task 22: Write Comprehensive Integration Tests",
            implement: "Create comprehensive integration test in /home/laco/cvm/packages/integration/src/ called 'string-array-all-methods.spec.ts'. Test all 15 methods working together through the full compile->execute pipeline. Reference: Implementation plan lines 575-638.",
            test: "Run integration tests with 'npx nx test integration -- string-array-all-methods.spec.ts' (should pass).",
            expectFailure: false,
            project: "integration"
        },
        
        // PHASE 9: E2E Testing
        {
            name: "Task 23: Write E2E Test Program",
            implement: "Create E2E test program /home/laco/cvm/test/programs/09-comprehensive/string-array-methods-all.ts that demonstrates all 15 methods in a realistic CVM program with CC() calls. Reference: Implementation plan lines 575-638. Read how run e2e in /home/laco/cvm/memory-bank/docs/E2E_TESTING.md)",
            test: "Run E2E test with MCP client from test/integration directory: 'npx tsx mcp-test-client.ts ../programs/09-comprehensive/string-array-methods-all.ts [responses]' (should pass).",
            expectFailure: false,
            project: "e2e"
        },
        
        // PHASE 10: Final Validation
        {
            name: "Task 24: Run All VM Tests",
            implement: "Ensure no regressions in existing VM functionality.",
            test: "Run all VM package tests with 'npx nx test vm' (all should pass).",
            expectFailure: false,
            project: "vm"
        },
        {
            name: "Task 25: Run All Parser Tests",
            implement: "Ensure parser changes don't break existing code.",
            test: "Run all parser package tests with 'npx nx test parser' (all should pass).",
            expectFailure: false,
            project: "parser"
        },
        {
            name: "Task 26: Update Documentation",
            implement: "Update /home/laco/cvm/docs/API.md to mark all methods as 'Implemented & Tested'. Remove them from roadmap section.",
            test: "",
            expectFailure: false,
            project: "docs"
        }
    ];
    
    // Process all tasks
    console.log("Starting TDD task processing. Total tasks: " + tasks.length);
    console.log("Task flow: VM Unit Tests -> Implementation -> Parser Support -> Integration Tests -> E2E Tests");
    var i = 0;
    while (i < tasks.length) {
        console.log("\n=== Task " + (i + 1) + " of " + tasks.length + " ===");
        var task = tasks[i];
        
        var taskName = task["name"];
        var taskImplement = task["implement"];
        var taskTest = task["test"];
        var taskProject = task["project"];
        
        console.log("Task: " + taskName);
        console.log("Project: " + (taskProject || "none"));
        
        // Implementation phase
        var implementPrompt = "[" + taskName + "]: " + fileOpsBase + "Read the ordered plan at the specified lines if mentioned. " + taskImplement + submitDone;
        CC(implementPrompt);
        
        var continueOnFeature = true;
        
        // Test phase if task has tests
        if (taskTest != "") {
            console.log("Test type: " + (taskProject == "e2e" ? "E2E Test" : (taskProject || "validation") + " tests"));
            var expectFailure = task["expectFailure"];
            
            // The test description contains the exact command to run
            var testPrompt = fileOpsBase + taskTest + " " + submitTest;
            var testResult = CC(testPrompt);
            
            // TDD: Handle expected failures
            if (expectFailure && testResult == "failed") {
                console.log("Test failed as expected (TDD). Continue with implementation.");
            } else if (expectFailure && testResult == "passed") {
                console.log("TDD: Test passed but was expected to fail.");
                var checkFeature = CC("The test for '" + taskName + "' passed but was expected to fail. Check if the feature is already implemented or if the test needs adjustment. Submit 'implemented' if feature exists, 'adjust' if test needs fixing.");
                continueOnFeature = checkFeature != "implemented";
                if (checkFeature == "adjust") {
                    CC(fileOpsBase + "Adjust the test to properly capture the expected failure condition, then re-run." + submitDone);
                    testResult = CC(testPrompt);
                }
            } else if (!expectFailure && testResult == "failed") {
                // Test should pass but failed - need to fix
                var allClean = false;
                while (!allClean) {
                    if (testResult != "passed") {
                        console.log("Tests failing. Debugging and fixing...");
                        CC(fileOpsBase + findCode + "Fix the implementation for " + taskName + ". Check the implementation plan for exact specifications. Make minimal changes to make tests pass." + submitDone);
                        // Re-run the test using the command from task description
                        testResult = CC(fileOpsBase + "Re-run the test to verify fixes. " + taskTest + " " + submitTest);
                    } else {
                        // Tests pass, now check types
                        var typecheckResult = CC(fileOpsBase + "Run typecheck for " + taskProject + " package using 'npx nx run " + taskProject + ":typecheck' command. If there are type errors, fix them. Submit 'clean' if no errors, 'errors' if there are errors to fix." + submitDone);
                        if (typecheckResult == "clean") {
                            allClean = true;
                        } else {
                            // Re-run tests after type fixes to ensure nothing broke
                            testResult = CC(fileOpsBase + "Re-run test to verify type fixes didn't break anything. " + taskTest + " " + submitTest);
                        }
                    }
                }
            }
        }
        
        completedTasks.push(taskName);
        console.log("Completed: " + taskName);
        
        i = i + 1;
        CC("Commit progress: Completed " + (i) + " of " + tasks.length + " tasks. Continue to next task. IMPORTANT: Use only technical commit message - do NOT include emojis, attributions, co-authors, or non-technical information like 'Generated with Claude'.");
    }
    
    // Final steps
    console.log("\n=== Final Steps ===");
    
    // Commit changes
    CC(fileOpsBase + "Git add and commit changes with message: 'feat(cvm): implement 15 string and array methods using TDD' - Include list of all methods added. IMPORTANT: Use only technical commit message - do NOT include emojis, attributions, co-authors, or non-technical information like 'Generated with Claude'." + submitDone);
    
    // Update Memory Bank
    CC(fileOpsBase + "Update Memory Bank progress.md with: 'Implemented 15 string/array methods for CVM using TDD. Added: string.includes, endsWith, startsWith, trim, trimStart, trimEnd, replace, replaceAll, lastIndexOf, repeat, padStart, padEnd, array.slice, join, indexOf. All methods are JavaScript-compliant and tested.'" + submitDone);
    
    console.log("\n=== String & Array Methods Implementation Complete! ===");
    console.log("Completed tasks: " + completedTasks.length + " of " + tasks.length);
    console.log("Methods implemented: 12 string methods + 3 array methods = 15 total");
    
    // Create completion report
    CC(fileOpsBase + "Create completion report at /home/laco/cvm/tasks/string-array-methods-complete.md listing: 1) All 15 methods implemented with TDD approach, 2) Unit tests -> Implementation -> Compiler -> Integration -> E2E flow followed, 3) Test coverage at unit, integration, and E2E levels, 4) JavaScript compliance verified." + submitDone);
    
    return "TDD Implementation Complete: 15 string/array methods added with full test coverage";
}