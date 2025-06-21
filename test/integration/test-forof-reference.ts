function main() {
  console.log("Testing for-of optimization (reference vs snapshot)");
  
  // Test array modification during iteration
  console.log("\n=== Array modification test ===");
  const testArray = ["a", "b", "c"];
  console.log("Initial array length: " + testArray.length);
  
  let count = 0;
  for (const item of testArray) {
    count++;
    console.log("Iteration " + count + ": " + item);
    
    // Add items during iteration
    if (item === "b") {
      testArray.push("d");
      testArray.push("e");
      console.log("  Added 2 items, current length: " + testArray.length);
    }
  }
  
  console.log("\nFinal array length: " + testArray.length);
  console.log("Total iterations: " + count);
  console.log("Expected iterations: 3 (original length)");
  
  // Test with numeric array
  console.log("\n=== Numeric array test ===");
  const numbers = [100, 200, 300];
  let sum = 0;
  
  for (const n of numbers) {
    sum += n;
    if (n === 200) {
      numbers.push(400);
      console.log("Added 400 during iteration");
    }
  }
  
  console.log("Sum: " + sum);
  console.log("Expected sum: 600 (100+200+300)");
  console.log("Array now has " + numbers.length + " elements");
  
  console.log("\n=== Tests completed ===");
}
main();