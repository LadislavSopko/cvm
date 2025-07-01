// Debug iterator state across CC
function main() {
  console.log("=== Iterator Debug Test ===");
  
  let arr = ["a", "b", "c"];
  console.log("Array length: " + arr.length);
  console.log("Array type: " + typeof arr);
  
  let count = 0;
  for (const item of arr) {
    count = count + 1;
    console.log("\nIteration " + count + ", item: " + item);
    
    if (count === 1) {
      // Only do CC on first iteration to see if iterator survives
      let response = CC("Please respond with 'First CC done'");
      console.log("CC response: " + response);
    }
  }
  
  console.log("\nFinal count: " + count);
  return "Debug complete";
}

main();