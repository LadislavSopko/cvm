function main() {
  console.log("Testing optimized for-of loops");
  
  // Test 1: Basic iteration
  console.log("\nTest 1: Basic iteration");
  const arr1 = [1, 2, 3, 4, 5];
  for (const item of arr1) {
    console.log("Item: " + item);
  }
  
  // Test 2: Modifying array during iteration
  console.log("\nTest 2: Array modification during iteration");
  const arr2 = [10, 20, 30];
  let iterations = 0;
  for (const item of arr2) {
    iterations++;
    console.log("Current: " + item + " (iteration " + iterations + ")");
    if (item === 20) {
      arr2.push(40);
      arr2.push(50);
      console.log("Added items, array length now: " + arr2.length);
    }
  }
  console.log("Total iterations: " + iterations);
  console.log("Final array: [" + arr2.join(", ") + "]");
  
  // Test 3: Large array performance
  console.log("\nTest 3: Large array (testing performance)");
  const largeArray = [];
  for (let i = 0; i < 1000; i++) {
    largeArray.push(i);
  }
  
  let sum = 0;
  const startMsg = "Processing " + largeArray.length + " items...";
  console.log(startMsg);
  
  for (const num of largeArray) {
    sum += num;
  }
  
  console.log("Sum of 0-999: " + sum);
  console.log("Expected: " + (999 * 1000 / 2));
  
  // Test 4: Nested loops
  console.log("\nTest 4: Nested for-of loops");
  const matrix = [[1, 2], [3, 4], [5, 6]];
  for (const row of matrix) {
    let rowStr = "Row: ";
    for (const col of row) {
      rowStr += col + " ";
    }
    console.log(rowStr);
  }
  
  console.log("\nAll tests completed!");
}
main();