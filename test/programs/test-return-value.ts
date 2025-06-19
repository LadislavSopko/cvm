// Test return value from main()

function main() {
  console.log("Testing return values...");
  
  // Test 1: Return a number
  const num = 42;
  console.log("Returning: " + num);
  return num;
  
  // This should not execute
  console.log("This should not print");
}

main();