function main() {
  console.log("=== CVM For-Of Loop Continue Bug Reproduction ===");
  
  let items = ["item1", "item2", "item3", "item4", "item5"];
  
  console.log("Testing for-of loop with multiple continue statements");
  
  for (const item of items) {
    console.log("Processing: " + item);
    
    // Multiple continue statements to trigger the compiler bug
    if (item === "item1") {
      console.log("Skipping item1");
      continue;
    }
    
    if (item === "item2") {
      console.log("Skipping item2");
      continue;
    }
    
    if (item === "item3") {
      console.log("Skipping item3");  
      continue;
    }
    
    if (item === "item4") {
      console.log("Skipping item4");
      continue;
    }
    
    if (item === "item5") {
      console.log("Skipping item5");
      continue;
    }
    
    console.log("Processing completed for: " + item);
  }
  
  console.log("Loop completed");
}