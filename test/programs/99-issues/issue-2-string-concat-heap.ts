/**
 * Issue #2: Test heap corruption with complex string concatenation
 * Simulating the exact pattern from entity-form-foundation-program
 */

function main() {
  console.log("=== Issue #2: String concatenation heap corruption ===");
  
  // Replicate the exact array structure
  var tddabs = [
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
    }
  ];
  
  // Setup similar to original
  var contextPrompt = "CONTEXT: You are implementing the Entity Form Foundation for reactive forms with DevExtreme UI components. " +
      "This foundation provides type-safe, testable, and reusable patterns for entity CRUD forms. " +
      "MISSION: Create a robust foundation that wraps DevExtreme components to work seamlessly with Angular reactive forms.";
  
  var fileOpsBase = " " + contextPrompt + " Use Read, Write, Edit, MultiEdit tools for file operations. Use Bash tool for running commands. ";
  
  console.log("Initial tddabs.length: " + tddabs.length);
  
  var currentIndex = 0;
  var tddab = tddabs[currentIndex];
  
  console.log("currentIndex: " + currentIndex + "/" + tddabs.length);
  console.log("2:currentIndex: " + currentIndex + "/" + tddabs.length);
  
  var loopCount = 1;
  
  // Create the exact problematic prompt
  var tddPrompt = fileOpsBase +
      "TDD DEVELOPMENT for " + tddab.name + " (iteration " + loopCount + "):\n" +
      "PLAN REFERENCE: /home/laco/DocFlowPro/memory-bank/docs/ENTITY-FORM-FOUNDATION-TDDABS.md lines " + tddab.planLines + "\n" +
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
  
  console.log("Created tddPrompt, length: " + tddPrompt.length);
  console.log("3:currentIndex: " + currentIndex + "/" + tddabs.length);
  
  // Check if corruption occurred
  if (tddabs.length !== 2) {
    console.log("!!! HEAP CORRUPTION DETECTED !!!");
    console.log("Expected length: 2, Actual: " + tddabs.length);
  } else {
    console.log("No corruption detected yet");
  }
  
  // Try accessing array elements
  console.log("Accessing tddabs[0].name: " + tddabs[0].name);
  console.log("Accessing tddabs[1].name: " + tddabs[1].name);
  
  console.log("Final tddabs.length: " + tddabs.length);
}