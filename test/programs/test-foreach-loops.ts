function main() {
  console.log("=== For-of Loop Tests ===");
  
  // Basic for-of with array literal
  console.log("");
  console.log("Basic for-of with array literal:");
  for (const item of [10, 20, 30]) {
    console.log("Item: " + item);
  }
  
  // For-of with variable array
  console.log("");
  console.log("For-of with variable array:");
  const numbers = [1, 2, 3];
  for (const num of numbers) {
    console.log("Number: " + num);
  }
  
  // For-of with strings
  console.log("");
  console.log("For-of with string array:");
  const words = ["hello", "world"];
  for (const word of words) {
    console.log("Word: " + word);
  }
  
  // Nested for-of loops
  console.log("");
  console.log("Nested for-of loops:");
  const outer = [1, 2];
  const inner = ["a", "b"];
  for (const x of outer) {
    for (const y of inner) {
      console.log("Pair: " + x + "-" + y);
    }
  }
  
  // For-of with break
  console.log("");
  console.log("For-of with break:");
  for (const n of [1, 2, 3, 4, 5]) {
    if (n === 3) {
      console.log("Breaking at: " + n);
      break;
    }
    console.log("Processing: " + n);
  }
  
  // For-of with continue
  console.log("");
  console.log("For-of with continue:");
  for (const n of [1, 2, 3, 4, 5]) {
    if (n === 3) {
      console.log("Skipping: " + n);
      continue;
    }
    console.log("Processing: " + n);
  }
  
  // For-of with let declaration
  console.log("");
  console.log("For-of with let declaration:");
  for (let item of ["A", "B", "C"]) {
    console.log("Letter: " + item);
  }
  
  // For-of modifying elements (shouldn't affect iteration due to snapshots)
  console.log("");
  console.log("For-of with array modification during iteration:");
  const modifyArray = [1, 2, 3];
  for (const item of modifyArray) {
    console.log("Current: " + item);
    if (item === 2) {
      modifyArray.push(99); // This shouldn't affect the iteration
    }
  }
  console.log("Final array length: " + modifyArray.length);
  
  console.log("");
  console.log("=== All for-of tests complete! ===");
}
main();