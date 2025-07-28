/**
 * Test for Issue #2: string.split() with undefined array access corrupts heap
 * Reproducing the exact scenario: 20 tasks, split()[2] on short strings
 */

function main() {
  console.log("=== Testing Issue #2: split()[2] undefined access heap corruption ===");
  
  // Create 20 tasks like in the real scenario
  const tasks = [];
  for (let i = 0; i < 20; i++) {
    if (i < 5) {
      // First 5 tasks have short text (no 3rd element)
      tasks.push({ id: i + 1, text: "short text" });
    } else {
      // Rest have longer text with 3+ words
      tasks.push({ id: i + 1, text: "task number " + (i + 1) + " description here" });
    }
  }
  
  console.log("Created " + tasks.length + " tasks");
  console.log("First task: " + tasks[0].text);
  console.log("Sixth task: " + tasks[5].text);
  
  // Process tasks in a for loop
  console.log("\nProcessing tasks:");
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    console.log("\nIteration " + (i + 1) + " of " + tasks.length);
    console.log("  Task ID: " + task.id);
    console.log("  Task text: " + task.text);
    
    // Split and try to access index 2 (3rd element)
    const parts = task.text.split(" ");
    console.log("  Split parts count: " + parts.length);
    
    // This is where corruption might happen
    const thirdPart = parts[2];
    console.log("  Third part (index 2): " + thirdPart);
    
    // Use it in prompt construction (simulating the real scenario)
    const prompt = "Processing task " + task.id + " with keyword: " + thirdPart;
    console.log("  Prompt: " + prompt);
    
    // Check if tasks array is still intact
    console.log("  Tasks array still has " + tasks.length + " items");
    
    // Check if we can still access the next task
    if (i < tasks.length - 1) {
      const nextTask = tasks[i + 1];
      console.log("  Next task exists: " + (nextTask ? "yes" : "no"));
      if (nextTask) {
        console.log("  Next task ID: " + nextTask.id);
      }
    }
  }
  
  console.log("\nFinal check:");
  console.log("Tasks array length: " + tasks.length);
  console.log("All task IDs:");
  for (let i = 0; i < tasks.length; i++) {
    console.log("  Task " + tasks[i].id);
  }
  
  console.log("\n=== Test completed ===");
}