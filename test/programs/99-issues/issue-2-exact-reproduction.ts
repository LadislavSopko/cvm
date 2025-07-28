/**
 * Exact reproduction of Issue #2 heap corruption
 * Based on entity-form-foundation-program structure
 */

function main() {
  console.log("=== Reproducing Issue #2: Exact heap corruption scenario ===");
  
  // Replicate the exact tddabs array structure
  var tddabs = [
    {
      name: "TDDAB-01: FormModel Interface",
      description: "Define the contract for all form models",
      planLines: "41-79",
      testFile: "libs/frontend/dfp-shared/src/lib/forms/interfaces/form-model.interface.spec.ts",
      implFile: "libs/frontend/dfp-shared/src/lib/forms/interfaces/form-model.interface.ts",
      library: "dfp-shared"
    },
    {
      name: "TDDAB-02: EntityFormConfig Interface",
      description: "Define configuration options for entity forms",
      planLines: "80-120",
      testFile: "libs/frontend/dfp-shared/src/lib/forms/interfaces/entity-form-config.interface.spec.ts",
      implFile: "libs/frontend/dfp-shared/src/lib/forms/interfaces/entity-form-config.interface.ts",
      library: "dfp-shared"
    },
    {
      name: "TDDAB-03: FormErrors Type",
      description: "Define type-safe form errors structure",
      planLines: "121-154",
      testFile: "libs/frontend/dfp-shared/src/lib/forms/types/form-errors.type.spec.ts",
      implFile: "libs/frontend/dfp-shared/src/lib/forms/types/form-errors.type.ts",
      library: "dfp-shared"
    },
    {
      name: "TDDAB-04: Form Model Shape Type",
      description: "Define type for typed form structure",
      planLines: "155-194",
      testFile: "libs/frontend/dfp-shared/src/lib/forms/types/form-model-shape.type.spec.ts",
      implFile: "libs/frontend/dfp-shared/src/lib/forms/types/form-model-shape.type.ts",
      library: "dfp-shared"
    },
    {
      name: "TDDAB-05: FormFieldBuilder Service",
      description: "Create injectable service for building form fields",
      planLines: "197-291",
      testFile: "libs/frontend/dfp-shared/src/lib/forms/builders/form-field-builder.service.spec.ts",
      implFile: "libs/frontend/dfp-shared/src/lib/forms/builders/form-field-builder.service.ts",
      library: "dfp-shared"
    }
  ];
  
  console.log("Initial tddabs.length: " + tddabs.length);
  
  // Context setup - exactly like the original
  var planFile = "/home/laco/DocFlowPro/memory-bank/docs/ENTITY-FORM-FOUNDATION-TDDABS.md";
  var contextPrompt = "CONTEXT: You are implementing the Entity Form Foundation for reactive forms with DevExtreme UI components. " +
      "This foundation provides type-safe, testable, and reusable patterns for entity CRUD forms. " +
      "MISSION: Create a robust foundation that wraps DevExtreme components to work seamlessly with Angular reactive forms. " +
      "KEY RULES: 1) NEVER guess - always Read files first, 2) Follow TDD methodology - test first, " +
      "3) Use Angular 14+ typed reactive forms, 4) Create wrapper components for DevExtreme integration, " +
      "5) Use Vitest (NOT Jasmine) for all tests with vi.fn() for mocks, " +
      "6) Reference the plan file for exact implementations. " +
      "PLAN FILE: " + planFile + " contains all TDDABs with exact code snippets and tests.";
  
  var fileOpsBase = " " + contextPrompt + " Use Read, Write, Edit, MultiEdit tools for file operations. Use Bash tool for running commands. ";
  
  var completedTddabs = [];
  var currentIndex = 0;
  
  // Main execution loop - exactly like the original
  while (currentIndex < tddabs.length) {
    var tddab = tddabs[currentIndex];
    console.log("\n=== Starting " + tddab.name + " ===");
    console.log("Description: " + tddab.description);
    console.log("Plan reference: lines " + tddab.planLines);
    console.log("Library: " + tddab.library);
    console.log("currentIndex: " + currentIndex + "/" + tddabs.length);
    
    // Simulate the read plan prompt
    var readPlanPrompt = fileOpsBase + 
        "Read the plan file " + planFile + " specifically lines " + tddab.planLines + " for " + tddab.name + ". " +
        "Study the implementation details, test cases, and exact code snippets provided. " +
        "Also check if directories exist before creating files. " +
        "IMPORTANT: The plan uses Vitest (not Jasmine) with vi.fn() for mocks and expect.any() for matchers. " +
        "For " + (tddab.testFile || "this TDDAB (no dedicated test file)") + " and " + (tddab.implFile || "implementation (no dedicated implementation file)") + ".";
    
    console.log("Read plan prompt length: " + readPlanPrompt.length);
    console.log("2:currentIndex: " + currentIndex + "/" + tddabs.length);
    
    // TDD loop
    if (tddab.testFile) {
      console.log("Entering TDD development loop for " + tddab.name);
      
      var loopCount = 0;
      // Simulate one iteration
      loopCount = loopCount + 1;
      console.log("TDD Loop iteration " + loopCount);
      
      // This is the problematic prompt with split(':')
      var tddPrompt = fileOpsBase +
          "TDD DEVELOPMENT for " + tddab.name + " (iteration " + loopCount + "):\n" +
          "PLAN REFERENCE: " + planFile + " lines " + tddab.planLines + "\n" +
          (tddab.testFile ? "TEST FILE: " + tddab.testFile + "\n" : "THIS TDDAB HAS NO DEDICATED TEST FILE.\n") +
          (tddab.implFile ? "IMPLEMENTATION FILE: " + tddab.implFile + "\n" : "THIS TDDAB HAS NO DEDICATED IMPLEMENTATION FILE.\n") +
          "LIBRARY: " + tddab.library + "\n\n" +
          "PROCESS:\n" +
          "1. If iteration 1: Write the failing test first\n" +
          "2. If iteration 1: Implement the minimal code\n" +
          "3. If iteration > 1: Fix the failing tests\n" +
          "4. Run: npx nx test " + tddab.library + " --testNamePattern=\"" + tddab.name.split(':')[0] + "\"\n" +
          "5. Run: npx nx typecheck " + tddab.library + "\n" +
          "6. Run: npx nx lint " + tddab.library + "\n\n";
      
      console.log("TDD prompt created, length: " + tddPrompt.length);
      console.log("3:currentIndex: " + currentIndex + "/" + tddabs.length);
      
      // Check if heap is corrupted
      if (tddabs.length !== 5) {
        console.log("!!! HEAP CORRUPTION DETECTED !!!");
        console.log("tddabs.length should be 5 but is: " + tddabs.length);
        break;
      }
    }
    
    console.log("5:currentIndex: " + currentIndex + "/" + tddabs.length);
    
    // Commit simulation
    console.log("Committing " + tddab.name);
    var commitPrompt = fileOpsBase +
        "Git add and commit all changes for " + tddab.name + ".\n" +
        "Use commit message: 'feat(forms): " + tddab.description.toLowerCase() + "'\n" +
        "IMPORTANT: Technical commit message only - no emojis or attributions.\n";
    
    console.log("6:currentIndex: " + currentIndex + "/" + tddabs.length);
    
    completedTddabs.push(tddab.name);
    currentIndex = currentIndex + 1;
    console.log("Progress: " + completedTddabs.length + "/" + tddabs.length + " TDDABs completed");
    
    // Extra check
    if (currentIndex > 2 && tddabs.length !== 5) {
      console.log("!!! CORRUPTION AFTER TASK " + currentIndex + " !!!");
      console.log("Expected tddabs.length: 5, Actual: " + tddabs.length);
      break;
    }
  }
  
  console.log("\n=== Final Summary ===");
  console.log("Expected to process 5 tasks");
  console.log("Actually processed: " + currentIndex);
  console.log("Final tddabs.length: " + tddabs.length);
  console.log("Heap corruption occurred: " + (tddabs.length !== 5 ? "YES" : "NO"));
}