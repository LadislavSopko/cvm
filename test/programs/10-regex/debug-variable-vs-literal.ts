function main() {
  console.log("=== Debug Variable vs Literal Regex ===");
  
  // Test 1: Literal regex (should work)
  console.log("Test 1: Literal regex");
  var text1 = "hello world hello universe";
  var result1 = text1.replace(/hello/g, "hi");
  console.log("  Literal result: " + result1);
  
  // Test 2: Variable regex (failing)
  console.log("Test 2: Variable regex");
  var text2 = "hello world hello universe";
  var pattern = /hello/g;
  
  // Test accessing the variable to see what it contains
  console.log("  Variable pattern type: " + typeof pattern);
  console.log("  Variable pattern source: " + pattern.source);
  
  var result2 = text2.replace(pattern, "hi");
  console.log("  Variable result: " + result2);
  
  // Compare
  if (result1 === result2) {
    console.log("✓ Both results match - bug is fixed!");
  } else {
    console.log("✗ Results differ - bug still exists");
    console.log("    Expected: " + result1);
    console.log("    Actual:   " + result2);
  }
  
  return 0;
}