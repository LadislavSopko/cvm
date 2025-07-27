/**
 * Test for Issue #2: Specific heap corruption with split(':') in string concatenation
 * Reproducing the exact bug from entity-form-foundation-program
 */

function main() {
  console.log("=== Testing Issue #2: split(':') heap corruption ===");
  
  // Create array similar to tddabs
  const tasks = [
    { name: "TDDAB-01: FormModel Interface", library: "dfp-shared" },
    { name: "TDDAB-02: EntityFormConfig Interface", library: "dfp-shared" },
    { name: "TDDAB-03: FormErrors Type", library: "dfp-shared" },
    { name: "TDDAB-04: Form Model Shape Type", library: "dfp-shared" },
    { name: "TDDAB-05: FormFieldBuilder Service", library: "dfp-shared" },
    { name: "TDDAB-06: BaseFormModel Class", library: "dfp-shared" },
    { name: "TDDAB-07: BaseEntityFormComponent Class", library: "dfp-shared" },
    { name: "TDDAB-08: EntityValidators Class", library: "dfp-shared" },
    { name: "TDDAB-09: FormTextInputComponent", library: "dfp-shared" },
    { name: "TDDAB-10: FormSelectComponent", library: "dfp-shared" }
  ];
  
  console.log("Initial tasks.length: " + tasks.length);
  
  let currentIndex = 0;
  
  // Main loop similar to the real program
  while (currentIndex < tasks.length) {
    const task = tasks[currentIndex];
    console.log("\n=== Processing task " + (currentIndex + 1) + " ===");
    console.log("1:currentIndex: " + currentIndex + "/" + tasks.length);
    console.log("Task name: " + task.name);
    
    // This is the problematic line - complex string concatenation with split(':')
    const testCommand = "Run: npx nx test " + task.library + " --testNamePattern=\"" + task.name.split(':')[0] + "\"";
    console.log("Test command: " + testCommand);
    
    // More string operations
    const basePrompt = "Processing " + task.name + " in library " + task.library;
    console.log("Base prompt: " + basePrompt);
    
    // Check array integrity
    console.log("2:currentIndex: " + currentIndex + "/" + tasks.length);
    
    // Another split operation
    const taskPrefix = task.name.split(':')[0];
    const taskDescription = task.name.split(':')[1];
    console.log("Task prefix: " + taskPrefix);
    console.log("Task description: " + taskDescription);
    
    // More complex concatenation
    const fullPrompt = basePrompt + "\n" +
                      "Test pattern: " + taskPrefix + "\n" +
                      "Library: " + task.library + "\n" +
                      "Command: " + testCommand;
    
    console.log("3:currentIndex: " + currentIndex + "/" + tasks.length);
    
    // Simulate more operations that might trigger heap issues
    const parts = [];
    parts.push("Part 1");
    parts.push("Part 2");
    parts.push("Part 3");
    
    const joined = parts.join(", ");
    console.log("Joined parts: " + joined);
    
    console.log("4:currentIndex: " + currentIndex + "/" + tasks.length);
    
    currentIndex = currentIndex + 1;
    
    // Final check
    console.log("5:currentIndex after increment: " + currentIndex + "/" + tasks.length);
    console.log("Tasks array still valid? " + (tasks.length === 10 ? "yes" : "NO - CORRUPTED!"));
    
    if (tasks.length !== 10) {
      console.log("HEAP CORRUPTION DETECTED! tasks.length changed to: " + tasks.length);
      break;
    }
  }
  
  console.log("\n=== Final Summary ===");
  console.log("Expected to process 10 tasks");
  console.log("Actually processed: " + currentIndex);
  console.log("Final tasks.length: " + tasks.length);
  console.log("Heap corruption occurred: " + (tasks.length !== 10 ? "YES" : "NO"));
}