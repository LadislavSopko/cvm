// Test fs.listFiles with recursive option
function main() {
  console.log("=== Testing fs.listFiles with recursive option ===");
  
  // Test 1: Non-recursive (should work)
  console.log("\n1. Non-recursive listing of test/integration:");
  let files = fs.listFiles("/home/laco/cvm/test/integration");
  console.log("Found " + files.length + " items (non-recursive)");
  for (let i = 0; i < Math.min(3, files.length); i++) {
    console.log("  - " + files[i]);
  }
  
  // Test 2: Recursive listing (reported as broken)
  console.log("\n2. Recursive listing of test/integration:");
  let recursiveFiles = fs.listFiles("/home/laco/cvm/test/integration", { recursive: true });
  console.log("Found " + recursiveFiles.length + " items (recursive)");
  for (let i = 0; i < Math.min(5, recursiveFiles.length); i++) {
    console.log("  - " + recursiveFiles[i]);
  }
  
  // Test 3: With filter (also reported as broken)
  console.log("\n3. Filtered listing (*.ts files):");
  let tsFiles = fs.listFiles("/home/laco/cvm/test/integration", { filter: "*.ts" });
  console.log("Found " + tsFiles.length + " .ts files");
  for (let i = 0; i < Math.min(3, tsFiles.length); i++) {
    console.log("  - " + tsFiles[i]);
  }
  
  // Test 4: Recursive + filter
  console.log("\n4. Recursive + filtered listing (*.ts files):");
  let recursiveTsFiles = fs.listFiles("/home/laco/cvm/test/integration", { 
    recursive: true, 
    filter: "*.ts" 
  });
  console.log("Found " + recursiveTsFiles.length + " .ts files (recursive)");
  for (let i = 0; i < Math.min(5, recursiveTsFiles.length); i++) {
    console.log("  - " + recursiveTsFiles[i]);
  }
  
  return "Tests complete";
}

main();