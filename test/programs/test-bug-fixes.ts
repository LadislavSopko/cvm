function main() {
  console.log("=== Bug Fix Validation Test ===");
  
  // Test 1: Numeric addition (was concatenating as "1020")
  console.log("\n--- Test 1: Numeric Addition ---");
  const a = 10;
  const b = 20;
  const sum = a + b;
  console.log("10 + 20 = " + sum);
  if (sum == 30) {
    console.log("✓ Numeric addition works correctly");
  } else {
    console.log("✗ FAIL: Expected 30, got " + sum);
  }
  
  // Test 2: CC values in arrays (was returning null)
  console.log("\n--- Test 2: CC Values in Arrays ---");
  const scores = [];
  scores[0] = CC("Enter score 1:");
  scores[1] = CC("Enter score 2:");
  scores[2] = CC("Enter score 3:");
  
  console.log("Stored scores:");
  console.log("  scores[0] = " + scores[0]);
  console.log("  scores[1] = " + scores[1]);
  console.log("  scores[2] = " + scores[2]);
  
  // Calculate average
  const total = scores[0] + scores[1] + scores[2];
  const avg = total / 3;
  console.log("Average: " + avg);
  
  // Test 3: String concatenation still works
  console.log("\n--- Test 3: String Concatenation ---");
  const firstName = CC("Enter first name:");
  const lastName = CC("Enter last name:");
  const fullName = firstName + " " + lastName;
  console.log("Full name: " + fullName);
  
  // Test 4: Mixed operations
  console.log("\n--- Test 4: Mixed Operations ---");
  const x = CC("Enter a number:");
  const y = CC("Enter another number:");
  
  // These should do numeric operations
  console.log(x + " + " + y + " = " + (x + y));
  console.log(x + " * " + y + " = " + (x * y));
  
  // This should concatenate due to string literal
  const message = "The sum is: " + (x + y);
  console.log(message);
  
  console.log("\n=== All Tests Complete ===");
}
main();