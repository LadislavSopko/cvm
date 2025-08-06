function main() {
  console.log("=== Testing for-of with multiple continues ===");
  
  const items = ["skip1", "skip2", "skip3"];
  
  for (const item of items) {
    console.log("Processing: " + item);
    
    if (item === "skip1") {
      console.log("Continuing from first condition");
      continue;
    }
    
    if (item === "skip2") {
      console.log("Continuing from second condition");  
      continue;
    }
    
    console.log("Would process: " + item);
  }
  
  console.log("Loop completed");
}