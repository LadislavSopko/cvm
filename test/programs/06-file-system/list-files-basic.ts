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
  
  return "Basic test complete";
}

main();