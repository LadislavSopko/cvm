function main() {
  console.log("=== RegExp Variable Replace Test ===");
  console.log("This test should expose the STRING_REPLACE vs STRING_REPLACE_REGEX bug");
  
  // Test that demonstrates the bug
  var text = "hello world hello universe";
  var pattern = /hello/g;  // Global flag - should replace ALL occurrences
  
  console.log("Original text: " + text);
  console.log("Pattern: " + pattern.source + " (flags: " + pattern.flags + ")");
  console.log("Pattern type: " + typeof pattern);
  
  // Add a simple test to see what String() conversion does to regex object
  console.log("String(pattern): " + String(pattern));
  
  // This should use STRING_REPLACE_REGEX and replace ALL "hello" 
  // But compiler emits STRING_REPLACE which only replaces FIRST occurrence
  var result = text.replace(pattern, "hi");
  
  console.log("Result: " + result);
  
  // Test what happens with string replacement for comparison
  var stringResult = text.replace("hello", "hi");
  console.log("String replace result: " + stringResult);
  
  // Expected: "hi world hi universe" (global regex replacement)
  // Actual with STRING_REPLACE: "hello world hello universe" (no replacement - regex object converted to string)
  
  if (result === "hi world hi universe") {
    console.log("✓ CORRECT: Global replacement worked - using STRING_REPLACE_REGEX");
  } else if (result === "hi world hello universe") {
    console.log("✗ BUG: Only first occurrence replaced - using STRING_REPLACE with string conversion");
  } else if (result === text) {
    console.log("✗ CRITICAL BUG: No replacement occurred - STRING_REPLACE failed with regex object");
  } else {
    console.log("✗ UNEXPECTED: " + result);
  }
  
  return 0;
}