function main() {
    console.log("=== CVM parseInt() Implementation (6 TDDABs) ===");
    
    var contextPrompt = "CONTEXT: You are implementing parseInt() support for CVM (Cognitive Virtual Machine). " +
                       "CVM is a TypeScript-based virtual machine in an Nx monorepo that serves as an algorithmic TODO manager for Claude. " +
                       "This project uses: TypeScript, Jest for testing, Nx for builds, MongoDB for persistence, MCP protocol. " +
                       "MANDATORY: Follow TDD strictly - write tests first, then implementation. " +
                       "MANDATORY: Use NX commands only: 'npx nx test <project>', 'npx nx build <project>', etc. ";
    
    var fileOpsBase = contextPrompt + "Use Read, Write, Edit tools for file operations. ";
    var submitDone = " Submit 'done' when complete.";
    var submitTest = " Submit 'passed' if tests pass, 'failed' if tests fail.";
    
    var tddBlocks = [
        {
            name: "TDDAB-1: Add PARSE_INT Opcode",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 14-35",
            description: "Define the bytecode operation for parseInt",
            testCommand: "npx nx test types",
            project: "types",
            targetFile: "/packages/types/src/lib/types.ts",
            testFile: "/packages/types/src/lib/types.spec.ts"
        },
        {
            name: "TDDAB-2: Compiler Support for parseInt()",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 38-102",
            description: "Make compiler recognize and compile parseInt() calls",
            testCommand: "npx nx test parser",
            project: "parser",
            targetFile: "/packages/parser/src/lib/compiler/expressions/call-expression.ts",
            testFile: "/packages/parser/src/lib/compiler/expressions/call-expression.spec.ts"
        },
        {
            name: "TDDAB-3: VM Handler for PARSE_INT",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 105-222",
            description: "Execute parseInt operations in the VM",
            testCommand: "npx nx test vm",
            project: "vm",
            targetFile: "/packages/vm/src/lib/handlers/parse-int.ts",
            testFile: "/packages/vm/src/lib/handlers/parse-int.spec.ts",
            registryFile: "/packages/vm/src/lib/handler-registry.ts"
        },
        {
            name: "TDDAB-4: E2E Test Programs",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 225-294",
            description: "Validate parseInt() works in real CVM programs",
            testCommand: "./test/programs/run-category.sh 11-parseInt",
            project: "e2e",
            targetDir: "/test/programs/11-parseInt/",
            configFile: "/test/programs/11-parseInt/config.json"
        },
        {
            name: "TDDAB-5: Fix Documentation",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 296-315",
            description: "Update docs to reflect parseInt() support",
            testCommand: "grep -r parseInt README.md docs/",
            project: "docs",
            readmeFile: "/README.md",
            apiFile: "/docs/API.md"
        },
        {
            name: "TDDAB-6: Integration Testing",
            planReference: "/home/laco/cvm/tasks/parseInt-implementation-plan.md lines 318-342",
            description: "Ensure parseInt() doesn't break existing functionality",
            testCommand: "npx nx run-many --target=test --all && ./test/programs/run-all-tests.sh",
            project: "integration",
            btltCommand: "npx nx run-many --target=build --all && npx nx run-many --target=typecheck --all && npx nx run-many --target=lint --all && npx nx run-many --target=test --all"
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
                ". Read the existing types.spec.ts file to understand test patterns. " +
                "Add test to verify OpCode.PARSE_INT exists and has correct value. " +
                "Test location: " + block.testFile + submitDone;
            CC(testPrompt1);
            
            // Run tests - they should fail (verify Red phase)
            var failPrompt1 = fileOpsBase + 
                "TASK: Run unit tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since PARSE_INT doesn't exist yet." + submitTest;
            var testResult1 = CC(failPrompt1);
            
            // Implement the opcode (Green phase)
            var implPrompt1 = fileOpsBase + 
                "TASK: Add PARSE_INT opcode to types.ts as specified in " + block.planReference + 
                ". Read " + block.targetFile + " and add PARSE_INT = 'PARSE_INT' after line 73 (after TYPEOF). " +
                "Follow existing enum pattern exactly." + submitDone;
            CC(implPrompt1);
            
            // Test until passing
            var testPassPrompt1 = fileOpsBase + 
                "TASK: Run unit tests again using '" + block.testCommand + "' with Bash tool." + submitTest;
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
                ". Create tests for: parseInt(string), parseInt(string, radix), parseInt with variables. " +
                "Test location: " + block.testFile + 
                ". Follow existing call-expression test patterns." + submitDone;
            CC(testPrompt2);
            
            // Run tests - should fail
            var failPrompt2 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since parseInt compilation isn't implemented." + submitTest;
            var testResult2 = CC(failPrompt2);
            
            // Implement compiler support
            var implPrompt2 = fileOpsBase + 
                "TASK: Add parseInt() compilation support as specified in " + block.planReference + 
                ". Read " + block.targetFile + " and add parseInt handler after CC() handler (around line 96). " +
                "Handle both 1-arg and 2-arg forms with proper error checking." + submitDone;
            CC(implPrompt2);
            
            // Test until passing
            var testPassPrompt2 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool." + submitTest;
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
            
            // Write tests first
            var testPrompt3 = fileOpsBase + 
                "TASK: Create comprehensive VM handler tests as specified in " + block.planReference + 
                ". Create " + block.testFile + " with tests for: basic parsing, hex parsing, invalid input, null handling. " +
                "Follow existing VM test patterns with bytecode arrays." + submitDone;
            CC(testPrompt3);
            
            // Run tests - should fail
            var failPrompt3 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool. " +
                "Tests should fail since handler doesn't exist." + submitTest;
            var testResult3 = CC(failPrompt3);
            
            // Create handler file
            var implPrompt3a = fileOpsBase + 
                "TASK: Create VM handler file " + block.targetFile + " as specified in " + block.planReference + 
                ". Implement parseIntHandler with proper stackIn/stackOut and execute function. " +
                "Follow CVM pattern: return null on error, never throw exceptions." + submitDone;
            CC(implPrompt3a);
            
            // Register handler
            var implPrompt3b = fileOpsBase + 
                "TASK: Register parseIntHandler in " + block.registryFile + " as specified in plan. " +
                "Import the handler and add to handlerRegistry spread." + submitDone;
            CC(implPrompt3b);
            
            // Test until passing
            var testPassPrompt3 = fileOpsBase + 
                "TASK: Run tests using '" + block.testCommand + "' with Bash tool." + submitTest;
            testResult3 = CC(testPassPrompt3);
            
            while (testResult3 === "failed") {
                var fixPrompt3 = fileOpsBase + 
                    "TASK: Fix VM handler issues. Check stack operations and null handling." + submitDone;
                CC(fixPrompt3);
                testResult3 = CC(testPassPrompt3);
            }
        }
        
        // TDDAB-4: E2E Test Programs
        else if (blockIndex === 3) {
            console.log("Creating E2E test programs...");
            
            // Create test directory and programs
            var e2ePrompt = fileOpsBase + 
                "TASK: Create E2E test programs as specified in " + block.planReference + 
                ". Create directory " + block.targetDir + " with: basic-parseInt.ts, parseInt-edge-cases.ts, and config.json. " +
                "Programs should test real parseInt() usage with CC() calls and console.log output." + submitDone;
            CC(e2ePrompt);
            
            // Run E2E tests
            var e2eTestPrompt = fileOpsBase + 
                "TASK: Run E2E tests using '" + block.testCommand + "' with Bash tool. " +
                "This tests parseInt() in real CVM program execution." + submitTest;
            var e2eResult = CC(e2eTestPrompt);
            
            while (e2eResult === "failed") {
                var e2eFixPrompt = fileOpsBase + 
                    "TASK: Fix E2E test failures. Check program syntax and config.json CC responses." + submitDone;
                CC(e2eFixPrompt);
                e2eResult = CC(e2eTestPrompt);
            }
        }
        
        // TDDAB-5: Fix Documentation
        else if (blockIndex === 4) {
            console.log("Updating documentation...");
            
            var docPrompt = fileOpsBase + 
                "TASK: Update documentation as specified in " + block.planReference + 
                ". Fix README.md line 399 example, update API.md to move parseInt from 'NOT Supported' to supported functions. " +
                "Document that parseInt returns null on failure." + submitDone;
            CC(docPrompt);
            
            // Verify documentation
            var docTestPrompt = fileOpsBase + 
                "TASK: Verify documentation using '" + block.testCommand + "' with Bash tool to search for parseInt references." + submitTest;
            var docResult = CC(docTestPrompt);
            
            if (docResult === "failed") {
                var docFixPrompt = fileOpsBase + 
                    "TASK: Fix documentation issues found." + submitDone;
                CC(docFixPrompt);
            }
        }
        
        // TDDAB-6: Integration Testing
        else if (blockIndex === 5) {
            console.log("Running full integration tests...");
            
            // Full BTLT process
            var btltPrompt = fileOpsBase + 
                "TASK: Run complete BTLT process as specified in " + block.planReference + 
                ". Execute: '" + block.btltCommand + "' with Bash tool. " +
                "All phases must pass: Build, TypeCheck, Lint, Test." + submitTest;
            var btltResult = CC(btltPrompt);
            
            if (btltResult === "failed") {
                var btltFixPrompt = fileOpsBase + 
                    "TASK: Fix BTLT failures. Check build errors, type errors, lint issues, or test failures." + submitDone;
                CC(btltFixPrompt);
                btltResult = CC(btltPrompt);
            }
            
            // Run all E2E tests
            var allE2ePrompt = fileOpsBase + 
                "TASK: Run all E2E tests using './test/programs/run-all-tests.sh' with Bash tool. " +
                "This ensures no regression in existing functionality." + submitTest;
            var allE2eResult = CC(allE2ePrompt);
            
            while (allE2eResult === "failed") {
                var allE2eFixPrompt = fileOpsBase + 
                    "TASK: Fix E2E regression issues. Check which tests are failing and why." + submitDone;
                CC(allE2eFixPrompt);
                allE2eResult = CC(allE2ePrompt);
            }
        }
        
        // Commit after each successful TDDAB
        var commitPrompt = fileOpsBase + 
            "TASK: Commit changes using Bash tool. Run 'git add .' then 'git commit -m \"feat(" + block.project + "): " + block.description + "\"'. " +
            "Use technical commit message without emojis or attributions." + submitDone;
        CC(commitPrompt);
        
        console.log("✓ Completed " + block.name);
        blockIndex = blockIndex + 1;
    }
    
    console.log("\n=== All 6 TDDABs Complete ===");
    console.log("parseInt() implementation fully integrated into CVM!");
    
    // Final verification
    var finalPrompt = fileOpsBase + 
        "TASK: Final verification - test the original problematic program from Memory Bank. " +
        "Run a simple parseInt test to confirm the feature works as expected. " +
        "Check that README.md example now works correctly." + submitDone;
    CC(finalPrompt);
    
    // Update Memory Bank
    var memoryPrompt = fileOpsBase + 
        "TASK: Update Memory Bank to reflect parseInt() completion. " +
        "Update progress.md and activeContext.md to mark parseInt implementation as complete. " +
        "Note that CVM now supports standard JavaScript parseInt() function." + submitDone;
    CC(memoryPrompt);
    
    console.log("✓ parseInt() implementation complete and verified!");
    console.log("✓ Memory Bank updated with completion status");
}