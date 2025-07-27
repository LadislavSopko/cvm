/**
 * Issue #2: Debug heap corruption by logging during string concatenation
 * Breaking down the problematic line 198 step by step
 */

function main() {
  console.log("=== Issue #2: Debug string concatenation step by step ===");
  
  // Create array with same structure
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
  
  var fileOpsBase = " CONTEXT: You are implementing... Use Read, Write, Edit, MultiEdit tools for file operations. Use Bash tool for running commands. ";
  
  console.log("Initial tddabs.length: " + tddabs.length);
  
  var currentIndex = 0;
  var tddab = tddabs[currentIndex];
  var loopCount = 1;
  
  // Build the prompt step by step with logging
  console.log("Step 1 - tddabs.length: " + tddabs.length);
  var part1 = fileOpsBase + "TDD DEVELOPMENT for ";
  
  console.log("Step 2 - tddabs.length: " + tddabs.length);
  var part2 = part1 + tddab.name;
  
  console.log("Step 3 - tddabs.length: " + tddabs.length);
  var part3 = part2 + " (iteration " + loopCount + "):\n";
  
  console.log("Step 4 - tddabs.length: " + tddabs.length);
  var part4 = part3 + "PLAN REFERENCE: /home/laco/DocFlowPro/memory-bank/docs/ENTITY-FORM-FOUNDATION-TDDABS.md lines ";
  
  console.log("Step 5 - tddabs.length: " + tddabs.length);
  var part5 = part4 + tddab.planLines + "\n";
  
  console.log("Step 6 - tddabs.length: " + tddabs.length);
  var part6 = part5 + (tddab.testFile ? "TEST FILE: " + tddab.testFile + "\n" : "THIS TDDAB HAS NO DEDICATED TEST FILE.\n");
  
  console.log("Step 7 - tddabs.length: " + tddabs.length);
  var part7 = part6 + (tddab.implFile ? "IMPLEMENTATION FILE: " + tddab.implFile + "\n" : "THIS TDDAB HAS NO DEDICATED IMPLEMENTATION FILE.\n");
  
  console.log("Step 8 - tddabs.length: " + tddabs.length);
  var part8 = part7 + "LIBRARY: " + tddab.library + "\n\n";
  
  console.log("Step 9 - tddabs.length: " + tddabs.length);
  var part9 = part8 + "PROCESS:\n";
  
  console.log("Step 10 - tddabs.length: " + tddabs.length);
  var part10 = part9 + "1. If iteration 1: Write the failing test first\n";
  
  console.log("Step 11 - tddabs.length: " + tddabs.length);
  var part11 = part10 + "2. If iteration 1: Implement the minimal code\n";
  
  console.log("Step 12 - tddabs.length: " + tddabs.length);
  var part12 = part11 + "3. If iteration > 1: Fix the failing tests\n";
  
  console.log("Step 13 - Before split - tddabs.length: " + tddabs.length);
  console.log("tddab.name = " + tddab.name);
  var splitResult = tddab.name.split(':');
  console.log("Split result length: " + splitResult.length);
  console.log("Split result[0]: " + splitResult[0]);
  console.log("Step 13a - After split - tddabs.length: " + tddabs.length);
  
  // This is the problematic line 198
  var part13 = part12 + "4. Run: npx nx test " + tddab.library + " --testNamePattern=\"" + splitResult[0] + "\"\n";
  console.log("Step 13b - After concat with split - tddabs.length: " + tddabs.length);
  
  console.log("Step 14 - tddabs.length: " + tddabs.length);
  var part14 = part13 + "5. Run: npx nx typecheck " + tddab.library + "\n";
  
  console.log("Step 15 - tddabs.length: " + tddabs.length);
  var part15 = part14 + "6. Run: npx nx lint " + tddab.library + "\n\n";
  
  console.log("Final tddabs.length: " + tddabs.length);
  console.log("Total string length: " + part15.length);
  
  if (tddabs.length !== 2) {
    console.log("!!! HEAP CORRUPTION DETECTED !!!");
    console.log("Expected length: 2, Actual: " + tddabs.length);
  }
}