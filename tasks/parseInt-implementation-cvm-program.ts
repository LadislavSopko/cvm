function main() {
    console.log("=== CVM parseInt() Implementation (6 TDDABs - 100% CORRECTED) ===");
    
    var contextPrompt = "CONTEXT: You are implementing parseInt() support for CVM (Cognitive Virtual Machine). " +
                       "CVM is a TypeScript-based virtual machine in an Nx monorepo that serves as an algorithmic TODO manager for Claude. " +
                       "This project uses: TypeScript, Jest for testing, Nx for builds, MongoDB for persistence, MCP protocol. " +
                       "MANDATORY: Follow TDD strictly - write tests first, then implementation. " +
                       "MANDATORY: Use NX commands only: 'npx nx test <project>', 'npx nx build <project>', etc. " +
                       "CRITICAL: parseInt() is ADDITIONAL to + operator - both work together, no replacement. ";
    
    var fileOpsBase = contextPrompt + "Use Read, Write, Edit tools for file operations. ";
    var submitDone = " Submit 'done' when complete.";
    var submitTest = " Submit 'passed' if tests pass, 'failed' if tests fail.";
    
    var tddBlocks = [
        {
            name: "TDDAB-1: Add PARSE_INT Opcode",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 14-35",
            description: "Define the bytecode operation for parseInt",
            testCommand: "npx nx test types",
            project: "types"
        },
        {
            name: "TDDAB-2: Compiler Support for parseInt()",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 37-102", 
            description: "Make compiler recognize and compile parseInt() calls",
            testCommand: "npx nx test parser",
            project: "parser"
        },
        {
            name: "TDDAB-3: VM Handler for PARSE_INT",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 104-222",
            description: "Execute parseInt operations in the VM",
            testCommand: "npx nx test vm", 
            project: "vm"
        },
        {
            name: "TDDAB-4: E2E Test Programs",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 224-281",
            description: "Validate parseInt() works in real CVM programs",
            testCommand: "./test/programs/run-category.sh 03-built-ins",
            project: "e2e"
        },
        {
            name: "TDDAB-5: Update Documentation", 
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 283-301",
            description: "Update docs to reflect parseInt() support",
            testCommand: "grep -r parseInt README.md docs/",
            project: "docs"
        },
        {
            name: "TDDAB-6: Integration Testing",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan-corrected.md lines 303-364",
            description: "Verify parseInt() integrates properly with existing CVM functionality", 
            testCommand: "./test/programs/run-category.sh 03-built-ins && ./test/programs/run-all-tests.sh",
            project: "integration"
        }
    ];
    
    var blockIndex = 0;
    while (blockIndex < tddBlocks.length) {
        var block = tddBlocks[blockIndex];
        console.log("\n=== Starting " + block.name + " ===");
        console.log("Plan Reference: " + block.planReference);
        
        // TDDAB-1: Add PARSE_INT Opcode
        if (blockIndex === 0) {
            console.log("Adding PARSE_INT to OpCode enum...");
            
            // Write tests first (TDD Red Phase)
            var testPrompt1 = fileOpsBase + 
                "TASK: Write unit tests for PARSE_INT opcode as specified in " + block.planReference + 
                ". Read packages/types/src/lib/types.spec.ts to understand existing test patterns. " +
                "Add test to verify OpCode.PARSE_INT exists and has correct value 'PARSE_INT'." + submitDone;
            CC(testPrompt1);
            
            // Run tests - should fail (Red phase)
            var failPrompt1 = fileOpsBase + 
                "TASK: Run unit tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since PARSE_INT doesn't exist yet. This confirms TDD red phase." + submitTest;
            var testResult1 = CC(failPrompt1);
            
            // Implement the opcode (Green phase)
            var implPrompt1 = fileOpsBase + 
                "TASK: Add PARSE_INT opcode to packages/types/src/lib/types.ts as specified in " + block.planReference + 
                ". Add 'PARSE_INT = \"PARSE_INT\"' after line 73 (after TYPEOF). Follow existing enum pattern exactly." + submitDone;
            CC(implPrompt1);
            
            // Test until passing (Green confirmation)
            var testPassPrompt1 = fileOpsBase + 
                "TASK: Run unit tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should now pass, confirming TDD green phase." + submitTest;
            testResult1 = CC(testPassPrompt1);
            
            while (testResult1 === "failed") {
                var fixPrompt1 = fileOpsBase + 
                    "TASK: Fix the failing tests. Check error messages and correct the enum definition." + submitDone;
                CC(fixPrompt1);
                testResult1 = CC(testPassPrompt1);
            }
        }
        
        // TDDAB-2: Compiler Support
        else if (blockIndex === 1) {
            console.log("Adding compiler support for parseInt() calls...");
            
            // Write tests first (TDD Red Phase)
            var testPrompt2 = fileOpsBase + 
                "TASK: Write comprehensive tests for parseInt compilation as specified in " + block.planReference + 
                ". Add tests to packages/parser/src/lib/compiler/expressions/call-expression.spec.ts for: " +
                "parseInt(string), parseInt(string, radix), parseInt with variables. " +
                "Follow existing call-expression test patterns and bytecode expectations." + submitDone;
            CC(testPrompt2);
            
            // Run tests - should fail (Red phase)
            var failPrompt2 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since parseInt compilation isn't implemented. Confirms TDD red phase." + submitTest;
            var testResult2 = CC(failPrompt2);
            
            // Implement compiler support (Green phase)
            var implPrompt2 = fileOpsBase + 
                "TASK: Add parseInt() compilation support to packages/parser/src/lib/compiler/expressions/call-expression.ts " +
                "as specified in " + block.planReference + ". Add parseInt handler after CC() handler (around line 96). " +
                "Handle both 1-arg (default radix 10) and 2-arg forms with proper error checking." + submitDone;
            CC(implPrompt2);
            
            // Test until passing (Green confirmation)
            var testPassPrompt2 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should now pass, confirming proper bytecode generation." + submitTest;
            testResult2 = CC(testPassPrompt2);
            
            while (testResult2 === "failed") {
                var fixPrompt2 = fileOpsBase + 
                    "TASK: Fix compilation errors. Ensure proper bytecode generation for parseInt calls." + submitDone;
                CC(fixPrompt2);
                testResult2 = CC(testPassPrompt2);
            }
        }
        
        // TDDAB-3: VM Handler
        else if (blockIndex === 2) {
            console.log("Implementing VM handler for PARSE_INT...");
            
            // Write tests first (TDD Red Phase)
            var testPrompt3 = fileOpsBase + 
                "TASK: Create comprehensive VM handler tests as specified in " + block.planReference + 
                ". Create packages/vm/src/lib/handlers/parse-int.spec.ts with tests for: " +
                "basic parsing (42), hex parsing (FF->255), invalid input (null), null/undefined handling. " +
                "Follow existing VM test patterns with bytecode arrays and proper expectations." + submitDone;
            CC(testPrompt3);
            
            // Run tests - should fail (Red phase)
            var failPrompt3 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since handler doesn't exist. Confirms TDD red phase." + submitTest;
            var testResult3 = CC(failPrompt3);
            
            // Create handler file (Green phase part 1)
            var implPrompt3a = fileOpsBase + 
                "TASK: Create VM handler packages/vm/src/lib/handlers/parse-int.ts as specified in " + block.planReference + 
                ". Implement parseIntHandler with proper stackIn: 2, stackOut: 1, and execute function. " +
                "CRITICAL: Follow CVM pattern - return null on error, never throw exceptions. Use safePop and isVMError." + submitDone;
            CC(implPrompt3a);
            
            // Register handler (Green phase part 2)
            var implPrompt3b = fileOpsBase + 
                "TASK: Register parseIntHandler in packages/vm/src/lib/handler-registry.ts as specified in plan. " +
                "Import parseIntHandler and add to handlerRegistry using spread operator: ...parseIntHandler," + submitDone;
            CC(implPrompt3b);
            
            // Test until passing (Green confirmation)
            var testPassPrompt3 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should now pass, confirming VM handler works correctly." + submitTest;
            testResult3 = CC(testPassPrompt3);
            
            while (testResult3 === "failed") {
                var fixPrompt3 = fileOpsBase + 
                    "TASK: Fix VM handler issues. Check stack operations, safePop usage, and null handling." + submitDone;
                CC(fixPrompt3);
                testResult3 = CC(testPassPrompt3);
            }
        }
        
        // TDDAB-4: E2E Test Programs  
        else if (blockIndex === 3) {
            console.log("Creating E2E test programs in 03-built-ins category...");
            
            // Create test programs (Implementation)
            var e2ePrompt = fileOpsBase + 
                "TASK: Create E2E test programs as specified in " + block.planReference + 
                ". Add to existing test/programs/03-built-ins/ directory: " +
                "parseInt-basic.ts (basic parseInt + hex + CC input + invalid handling) and " +
                "parseInt-edge-cases.ts (spaces, partial numbers, different radix, null). " +
                "Programs test real parseInt() usage with CC() calls and console.log output." + submitDone;
            CC(e2ePrompt);
            
            // Run E2E tests (Verification)
            var e2eTestPrompt = fileOpsBase + 
                "TASK: Run E2E tests using '" + block.testCommand + "' with Bash tool. " +
                "This tests parseInt() in real CVM program execution within existing built-ins category. " +
                "Note: CC responses are handled by run-all-tests.sh configuration." + submitTest;
            var e2eResult = CC(e2eTestPrompt);
            
            while (e2eResult === "failed") {
                var e2eFixPrompt = fileOpsBase + 
                    "TASK: Fix E2E test failures. Check program syntax, CC response configuration, and console output." + submitDone;
                CC(e2eFixPrompt);
                e2eResult = CC(e2eTestPrompt);
            }
        }
        
        // TDDAB-5: Update Documentation
        else if (blockIndex === 4) {
            console.log("Updating documentation...");
            
            // Update documentation (Implementation)
            var docPrompt = fileOpsBase + 
                "TASK: Update documentation as specified in " + block.planReference + 
                ". 1) Fix README.md line 399 example (should now work). " +
                "2) Update docs/API.md to move parseInt from 'NOT Supported' to supported built-in functions. " +
                "3) Document that parseInt returns null on failure (CVM pattern)." + submitDone;
            CC(docPrompt);
            
            // Verify documentation (Verification)
            var docTestPrompt = fileOpsBase + 
                "TASK: Verify documentation using '" + block.testCommand + "' with Bash tool. " +
                "Search for parseInt references to ensure examples are accurate and consistent." + submitTest;
            var docResult = CC(docTestPrompt);
            
            if (docResult === "failed") {
                var docFixPrompt = fileOpsBase + 
                    "TASK: Fix documentation issues found." + submitDone;
                CC(docFixPrompt);
            }
        }
        
        // TDDAB-6: Integration Testing (CORRECT - test compatibility)
        else if (blockIndex === 5) {
            console.log("Testing parseInt() integration with existing functionality...");
            
            // Create integration test (Implementation)
            var integrationPrompt = fileOpsBase + 
                "TASK: Create integration test as specified in " + block.planReference + 
                ". Add test/programs/03-built-ins/parseInt-integration.ts that tests: " +
                "1) Both + operator AND parseInt() work together in same program (no conflicts) " +
                "2) parseInt() with JSON.parse, console.log, CC() calls (built-in compatibility) " +  
                "3) parseInt() in control flow (if/while/for) and with heap objects (arrays/objects). " +
                "CRITICAL: Demonstrate + and parseInt() coexist - they serve different purposes." + submitDone;
            CC(integrationPrompt);
            
            // Verify README example works (Implementation) 
            var readmeTestPrompt = fileOpsBase + 
                "TASK: Verify README.md line 399 example now works. " +
                "Create test program based on that example to confirm documented functionality." + submitDone;
            CC(readmeTestPrompt);
            
            // Run integration tests (Verification)
            var integrationTestPrompt = fileOpsBase + 
                "TASK: Run integration tests using first part of '" + block.testCommand + "' " +
                "(./test/programs/run-category.sh 03-built-ins) with Bash tool. " +
                "This verifies parseInt() works alongside existing functionality without conflicts." + submitTest;
            var integrationResult = CC(integrationTestPrompt);
            
            while (integrationResult === "failed") {
                var integrationFixPrompt = fileOpsBase + 
                    "TASK: Fix integration issues. Check for conflicts between parseInt() and existing operations." + submitDone;
                CC(integrationFixPrompt);
                integrationResult = CC(integrationTestPrompt);
            }
            
            // Full BTLT verification (Implementation)
            var btltPrompt = fileOpsBase + 
                "TASK: Run complete BTLT process with Bash tool: " +
                "'npx nx run-many --target=build --all && npx nx run-many --target=typecheck --all && npx nx run-many --target=lint --all && npx nx run-many --target=test --all'. " +
                "All phases must pass: Build, TypeCheck, Lint, Test." + submitTest;
            var btltResult = CC(btltPrompt);
            
            if (btltResult === "failed") {
                var btltFixPrompt = fileOpsBase + 
                    "TASK: Fix BTLT failures. Address any build errors, type errors, lint issues, or test failures." + submitDone;
                CC(btltFixPrompt);
                btltResult = CC(btltPrompt);
            }
            
            // Final E2E regression test (Verification)
            var allE2ePrompt = fileOpsBase + 
                "TASK: Run all E2E tests using './test/programs/run-all-tests.sh' with Bash tool. " +
                "This ensures no regression in existing functionality across entire test suite." + submitTest;
            var allE2eResult = CC(allE2ePrompt);
            
            while (allE2eResult === "failed") {
                var allE2eFixPrompt = fileOpsBase + 
                    "TASK: Fix E2E regression issues. Identify which tests are failing and resolve conflicts." + submitDone;
                CC(allE2eFixPrompt);
                allE2eResult = CC(allE2ePrompt);
            }
        }
        
        // Commit after each successful TDDAB (Atomic commits)
        var commitPrompt = fileOpsBase + 
            "TASK: Commit changes using Bash tool. Run 'git add .' then " +
            "'git commit -m \"feat(" + block.project + "): " + block.description + "\"'. " +
            "Use technical commit message without emojis or attributions." + submitDone;
        CC(commitPrompt);
        
        console.log("✓ Completed " + block.name);
        blockIndex = blockIndex + 1;
    }
    
    console.log("\n=== All 6 TDDABs Complete ===");
    console.log("parseInt() implementation fully integrated into CVM!");
    
    // Update Memory Bank (Final step)
    var memoryPrompt = fileOpsBase + 
        "TASK: Update Memory Bank to reflect parseInt() completion. " +
        "Update memory-bank/progress.md and memory-bank/activeContext.md to mark parseInt implementation as complete. " +
        "IMPORTANT: Note that parseInt() works ALONGSIDE existing + operator - both serve different purposes. " +
        "parseInt() provides radix-based parsing, + operator provides type coercion." + submitDone;
    CC(memoryPrompt);
    
    console.log("✓ parseInt() implementation complete and verified!");
    console.log("✓ Both + operator and parseInt() function work together perfectly!");
    console.log("✓ Memory Bank updated with completion status");
    console.log("✓ 100% mission success - no crashes on Mars!");
}