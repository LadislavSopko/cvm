// Simulate analyze-directory with hardcoded array to test for-of + CC
function main() {
  console.log("=== Testing for-of with CC calls ===");
  
  // Simulate fs.listFiles result with hardcoded array
  let files = [
    "/test/file1.ts",
    "/test/file2.ts", 
    "/test/file3.ts"
  ];
  
  console.log("Found " + files.length + " files to process");
  
  // Process each file with CC
  let count = 0;
  for (const filepath of files) {
    count = count + 1;
    console.log("\nProcessing file " + count + " of " + files.length + ": " + filepath);
    
    // Simulate CC call like analyze-directory does
    let result = CC("Say 'Processed file " + count + "'");
    console.log("Result: " + result);
  }
  
  console.log("\n=== Complete ===");
  console.log("Processed " + count + " files");
  
  return "Test completed";
}

main();