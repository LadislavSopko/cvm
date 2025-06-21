// Test program without explicit main() call
function main() {
  console.log("=== Testing Implicit main() Execution ===");
  
  const x = 10;
  const y = 20;
  console.log("x + y = " + (x + y));
  
  // Test return value
  return "Program completed successfully";
}

// Note: No main() call here - should execute automatically