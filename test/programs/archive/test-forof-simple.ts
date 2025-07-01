// Simple test of for-of with array
function main() {
  console.log("Testing for-of with simple array");
  
  // Test with literal array
  let items = ["a", "b", "c"];
  
  console.log("Starting iteration...");
  let count = 0;
  
  for (const item of items) {
    count = count + 1;
    console.log("Item " + count + ": " + item);
  }
  
  console.log("Completed " + count + " iterations");
  
  return "Success";
}

main();