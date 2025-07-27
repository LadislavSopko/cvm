/**
 * Test for Issue #2: string.split() corrupts heap
 * When using split() in a loop with array of tasks, the heap gets corrupted
 */

function main() {
  console.log("=== Testing Issue #2: string.split() heap corruption ===");
  
  // Create an array of tasks (simulating the real scenario)
  const tasks = [
    { name: "Task 1", data: "foo:bar:baz" },
    { name: "Task 2", data: "aaa aa bb dd" },
    { name: "Task 3", data: "hello:world:test" }
  ];
  
  console.log("Initial tasks:");
  for (let i = 0; i < tasks.length; i++) {
    console.log("  " + tasks[i].name + ": " + tasks[i].data);
  }
  
  // Process tasks with string.split()
  console.log("\nProcessing tasks with split():");
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log("Processing: " + task.name);
    
    // This is where heap corruption might occur
    const parts = task.data.split(" ");
    console.log("  Split result length: " + parts.length);
    
    // Try to access specific index (like in the user's example)
    if (parts.length > 2) {
      console.log("  Third element: " + parts[2]);
    }
    
    // Check if tasks array is still intact
    console.log("  Tasks array still has " + tasks.length + " items");
    console.log("  Current task name: " + task.name);
  }
  
  // Final check - are tasks still accessible?
  console.log("\nFinal check - tasks after processing:");
  for (let i = 0; i < tasks.length; i++) {
    console.log("  " + tasks[i].name + ": " + tasks[i].data);
  }
  
  // Additional test: direct split with index access
  console.log("\nDirect split test:");
  const directTest = "aaa aa bb dd".split(" ");
  console.log("Split result: " + directTest.length + " parts");
  console.log("Third element: " + directTest[2]);
  
  console.log("=== Test completed ===");
}