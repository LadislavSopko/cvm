function main() {
  console.log("=== RegExp Pattern Matching Error Handling Test ===");
  console.log("This program demonstrates graceful error handling for invalid operations");
  
  // Valid operations first
  console.log("\n--- Valid Operations ---");
  var validPattern = /test/i;
  var validText = "Testing";
  
  var validTest = validPattern.test(validText);
  var validMatch = validText.match(validPattern);
  var validReplace = validText.replace(validPattern, "Demo");
  
  console.log("✓ Valid test: " + (validTest ? "true" : "false"));
  console.log("✓ Valid match found: " + (validMatch !== null ? "true" : "false"));
  console.log("✓ Valid replace: " + validReplace);
  
  // This will cause an error and stop execution
  console.log("\n--- Invalid Operation (Should Fail) ---");
  console.log("Attempting to call regex.test() with non-string argument...");
  
  var numberInput = 42;
  var errorResult = validPattern.test(numberInput);
  
  // This should never execute
  console.log("✗ ERROR: This line should not be reached!");
  console.log("✗ Error result: " + errorResult);
  
  return 0;
}