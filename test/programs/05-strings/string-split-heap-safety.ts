/**
 * Heap safety test for string.split() operations
 * Tests Issue #2 fix: heap corruption with string.split() - fixed critical bug 
 * where heap's nextId was using a closure-captured local variable instead of 
 * the heap object's property, causing new allocations to overwrite existing 
 * objects after deserialization
 */

function main() {
  console.log("=== String Split Heap Safety Test ===");
  
  // Create a complex scenario with nested objects and multiple heap allocations
  const workflow = {
    name: "Main Workflow",
    tasks: [
      { id: 1, command: "build src/main.ts --output dist/main.js" },
      { id: 2, command: "test unit integration e2e" },
      { id: 3, command: "deploy --env production --region us-east-1" }
    ]
  };
  
  console.log("Workflow: " + workflow.name);
  console.log("Tasks count: " + workflow.tasks.length);
  
  // Process each task and parse commands
  for (let i = 0; i < workflow.tasks.length; i++) {
    const task = workflow.tasks[i];
    console.log("\nProcessing task " + task.id + ":");
    console.log("  Original command: " + task.command);
    
    // Split the command - this tests heap allocation safety
    const args = task.command.split(" ");
    console.log("  Args count: " + args.length);
    
    // Display each argument (more heap operations)
    for (let j = 0; j < args.length; j++) {
      console.log("    Arg " + j + ": '" + args[j] + "'");
    }
    
    // Test more complex splitting scenarios
    if (task.command.indexOf("--") >= 0) {
      const flags = task.command.split("--");
      console.log("  Flag segments: " + flags.length);
      for (let k = 0; k < flags.length; k++) {
        if (flags[k].length > 0) {
          console.log("    Flag " + k + ": '" + flags[k] + "'");
        }
      }
    }
  }
  
  // Additional heap stress test with multiple string operations
  console.log("\n=== Heap Stress Test ===");
  const testData = "one:two:three:four:five:six:seven:eight:nine:ten";
  const parts = testData.split(":");
  console.log("Split '" + testData + "' into " + parts.length + " parts");
  
  // Verify each part is correctly allocated and accessible
  for (let m = 0; m < parts.length; m++) {
    console.log("  Part " + m + ": '" + parts[m] + "' (length: " + parts[m].length + ")");
  }
  
  // Test edge cases that might expose heap corruption
  const empty = "";
  const emptyParts = empty.split(",");
  console.log("Empty string split: " + emptyParts.length + " parts");
  
  const single = "noseparator";
  const singleParts = single.split(",");
  console.log("No separator split: " + singleParts.length + " parts: '" + singleParts[0] + "'");
  
  console.log("=== Heap Safety Test Completed ===");
}