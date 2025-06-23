function main() {
  console.log("=== Testing Execution Management ===");
  
  // This test demonstrates that execution management works
  // The MCP client automatically sets this as current execution
  
  const name = CC("What's your name?");
  console.log("Hello, " + name + "!");
  
  const task = CC("What task should I help with?");
  console.log("I'll help you with: " + task);
  
  // Test that we can continue execution without issues
  const rating = CC("Rate this interaction (1-10):");
  console.log("Thank you for rating " + rating + "/10!");
  
  // Test return value
  return "Execution completed successfully for " + name;
}

main();