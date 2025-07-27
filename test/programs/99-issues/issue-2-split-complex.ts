/**
 * More complex test for string.split() heap corruption
 * Testing nested operations and multiple heap allocations
 */

function main() {
  console.log("=== Complex string.split() heap corruption test ===");
  
  // Create a more complex scenario with nested objects
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
    
    // Split the command
    const args = task.command.split(" ");
    console.log("  Args count: " + args.length);
    
    // Process args and create new arrays
    const filteredArgs = [];
    for (let j = 0; j < args.length; j++) {
      if (!args[j].startsWith("--")) {
        filteredArgs.push(args[j]);
      }
    }
    
    console.log("  Filtered args: " + filteredArgs.join(", "));
    
    // Now do another split operation on a different string
    const testStr = "one:two:three:four";
    const parts = testStr.split(":");
    console.log("  Test split parts: " + parts.length);
    
    // Check if workflow is still intact
    console.log("  Workflow still named: " + workflow.name);
    console.log("  Workflow still has " + workflow.tasks.length + " tasks");
  }
  
  // Final verification
  console.log("\nFinal verification:");
  console.log("Workflow name: " + workflow.name);
  console.log("Tasks:");
  for (let i = 0; i < workflow.tasks.length; i++) {
    console.log("  Task " + workflow.tasks[i].id + ": " + workflow.tasks[i].command);
  }
  
  // Test the exact pattern from user's example
  console.log("\nTesting exact pattern from issue:");
  const testData = "aaa aa bb dd";
  const splitResult = testData.split(" ");
  console.log("Split '" + testData + "' into " + splitResult.length + " parts");
  console.log("Element at index 2: " + splitResult[2]);
  
  console.log("\n=== Test completed ===");
}