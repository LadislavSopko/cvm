/**
 * More complex test for Issue #2: Reproducing heap corruption in realistic scenario
 * Simulating a CVM program that processes tasks with CC() calls
 */

function main() {
  console.log("=== Complex heap corruption scenario ===");
  
  // Create tasks similar to a TDDAB program
  const tddBlocks = [
    { name: "TDDAB-1", description: "Create service", planReference: "/plan.md lines 10-20" },
    { name: "TDDAB-2", description: "Add tests", planReference: "/plan.md lines 21-30" },
    { name: "TDDAB-3", description: "Implement API", planReference: "/plan.md lines 31-40" },
    { name: "TDDAB-4", description: "Add validation", planReference: "/plan.md lines 41-50" },
    { name: "TDDAB-5", description: "Error handling", planReference: "/plan.md lines 51-60" },
    { name: "TDDAB-6", description: "Integration", planReference: "/plan.md lines 61-70" },
    { name: "TDDAB-7", description: "Documentation", planReference: "/plan.md lines 71-80" },
    { name: "TDDAB-8", description: "Performance", planReference: "/plan.md lines 81-90" },
    { name: "TDDAB-9", description: "Security", planReference: "/plan.md lines 91-100" },
    { name: "TDDAB-10", description: "Deploy", planReference: "/plan.md lines 101-110" }
  ];
  
  console.log("Created " + tddBlocks.length + " TDDAB blocks");
  
  // Track completed blocks
  const completedBlocks = [];
  
  // Process each block
  for (let i = 0; i < tddBlocks.length; i++) {
    const block = tddBlocks[i];
    console.log("\n=== Processing block " + (i + 1) + " of " + tddBlocks.length + " ===");
    console.log("Block name: " + block.name);
    console.log("Description: " + block.description);
    
    // Create a complex prompt with multiple string operations
    const basePrompt = "Implement " + block.name + " as specified in " + block.planReference;
    
    // Split the description and try to use parts
    const descParts = block.description.split(" ");
    console.log("Description parts: " + descParts.length);
    
    // Try to access potentially undefined indices
    const keyword1 = descParts[0];  // Should exist
    const keyword2 = descParts[1];  // Should exist
    const keyword3 = descParts[2];  // Might not exist
    const keyword4 = descParts[3];  // Might not exist
    
    console.log("Keywords: " + keyword1 + ", " + keyword2 + ", " + keyword3 + ", " + keyword4);
    
    // Build commit message using split results
    const nameParts = block.name.split("-");
    const blockType = nameParts[0];  // "TDDAB"
    const blockNum = nameParts[1];   // number
    
    // Create arrays within the loop
    const testCommands = [];
    testCommands.push("npx nx test");
    testCommands.push("npx nx run test:e2e");
    
    // Another split operation
    const refParts = block.planReference.split(" ");
    const fileName = refParts[0];
    const lineInfo = refParts[2];  // might be undefined if format changes
    
    // Complex string concatenation
    const commitMsg = "feat(" + blockType + "): implement block " + blockNum + " - " + keyword1 + " " + (keyword2 || "task");
    console.log("Commit message: " + commitMsg);
    
    // Add to completed blocks
    completedBlocks.push(block.name);
    console.log("Completed blocks so far: " + completedBlocks.length);
    
    // Check if original array is still intact
    console.log("Original tddBlocks still has " + tddBlocks.length + " items");
    console.log("Can access next block: " + (i < tddBlocks.length - 1 ? "yes" : "no"));
    
    // More heap allocations
    const result = {
      block: block.name,
      status: "completed",
      tests: testCommands.join(", ")
    };
    
    console.log("Result: " + JSON.stringify(result));
  }
  
  console.log("\n=== Final Summary ===");
  console.log("Total blocks: " + tddBlocks.length);
  console.log("Completed blocks: " + completedBlocks.length);
  console.log("All blocks completed: " + (completedBlocks.length === tddBlocks.length));
}