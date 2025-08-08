// Test basic fs.listFiles functionality
function main() {
  console.log("Testing fs.listFiles basic functionality");
  
  // Test 1: Basic call
  let files = fs.listFiles("/home/laco/cvm/test/programs");
  console.log("Type of result: " + typeof files);
  console.log("Is array: " + (typeof files === "array"));
  console.log("Length: " + files.length);
  
  // Test 2: Access elements manually
  if (files.length > 0) {
    console.log("\nFirst file: " + files[0]);
    console.log("Type of first: " + typeof files[0]);
  }
  
  // Test 3: Manual loop works?
  console.log("\nManual loop test:");
  for (let i = 0; i < files.length && i < 3; i++) {
    console.log("  File " + i + ": " + files[i]);
  }
  
  // Test 4: Test recursive option with object literal (CVMObjectRef)
  console.log("\n=== Testing recursive option (CVMObjectRef bug fix) ===");
  let nonRecursive = fs.listFiles("/home/laco/cvm/test/integration");
  console.log("Non-recursive count: " + nonRecursive.length);
  
  let recursive = fs.listFiles("/home/laco/cvm/test/integration", { recursive: true });
  console.log("Recursive count: " + recursive.length);
  
  if (recursive.length > nonRecursive.length) {
    console.log("✓ Recursive option works! (CVMObjectRef handling is fixed)");
  } else {
    console.log("✗ ERROR: Recursive option NOT working!");
  }
  
  // Test 5: Test with filter
  let filtered = fs.listFiles("/home/laco/cvm/test/integration", { filter: "*.ts" });
  console.log("\nFiltered (*.ts) count: " + filtered.length);
  
  // Test 6: Test recursive with filter
  let recursiveFiltered = fs.listFiles("/home/laco/cvm/test/integration", { recursive: true, filter: "*.ts" });
  console.log("Recursive filtered count: " + recursiveFiltered.length);
  
  return "Basic test complete";
}

main();