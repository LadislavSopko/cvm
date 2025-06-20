// Test fs.listFiles() functionality
function main() {
  // Test 1: Basic file listing
  console.log("Test 1: Basic file listing");
  let files = fs.listFiles(".");
  console.log("Files in current directory: " + files.length);
  
  // Test 2: List with recursive option
  console.log("\nTest 2: Recursive listing");
  let allFiles = fs.listFiles(".", { recursive: true });
  console.log("Total files (recursive): " + allFiles.length);
  
  // Test 3: Filter by extension
  console.log("\nTest 3: Filter by .ts extension");
  let tsFiles = fs.listFiles(".", { filter: "*.ts" });
  console.log("TypeScript files: " + tsFiles.length);
  
  // Test 4: Recursive with filter
  console.log("\nTest 4: Recursive .ts files");
  let allTsFiles = fs.listFiles(".", { recursive: true, filter: "*.ts" });
  console.log("All TypeScript files: " + allTsFiles.length);
  
  // Test 5: Check we get paths
  console.log("\nTest 5: Check first file path");
  if (files.length > 0) {
    console.log("First file is: " + files[0]);
  }
  
  // Test 6: Can iterate files (but can't access properties yet)
  console.log("\nTest 6: Iterate files");
  let count = 0;
  for (const item of files) {
    count = count + 1;
  }
  console.log("Iterated count: " + count);
  
  // Test 7: Empty result for non-existent path
  console.log("\nTest 7: Non-existent path");
  let nonExistent = fs.listFiles("/this/path/does/not/exist");
  console.log("Files in non-existent path: " + nonExistent.length);
  
  // Test 8: Using path variable
  console.log("\nTest 8: Using path variable");
  let testPath = ".";
  let varFiles = fs.listFiles(testPath);
  console.log("Files using variable path: " + varFiles.length);
  
  console.log("\nAll fs.listFiles() tests completed!");
  
  return "SUCCESS";
}

main();