function main() {
  console.log("=== Complex Continue Bug Reproduction ===");
  
  let testFiles = [
    "file1.cs",
    "file2.cs", 
    "file3.cs",
    "file4.cs",
    "file5.cs"
  ];
  
  // Track changes made (similar to original)
  let filesChanged = 0;
  let totalEntitiesReplaced = 0;
  let hasAnyFailure = false;
  
  // Process each file (similar structure to original)
  let fileIndex = 0;
  for (const testFile of testFiles) {
    fileIndex++;
    console.log("\n=== Processing file " + fileIndex + "/" + testFiles.length + ": " + testFile + " ===");
    
    // First check - similar to introspection
    var checkResult = "skip";  // Simulate a result
    
    // Parse the result (similar pattern)
    if (checkResult.indexOf("skip") !== -1) {
      console.log("✓ File " + testFile + " - no changes needed");
      continue;  // CONTINUE #1
    }
    
    // Extract count if provided (similar pattern)
    var countMatch = checkResult.match(/refactor:(\d+)/);
    var instanceCount = countMatch ? parseInt(countMatch[1]) : 0;
    
    if (instanceCount === 0 && checkResult.indexOf("refactor") === -1) {
      console.log("✓ File " + testFile + " - no entities found");
      continue;  // CONTINUE #2
    }
    
    // Simulate refactor result
    var refactorResult = "done";
    
    if (refactorResult.indexOf("fail") !== -1) {
      console.log("✗ Failed to refactor " + testFile);
      hasAnyFailure = true;
      continue;  // CONTINUE #3
    }
    
    filesChanged++;
    totalEntitiesReplaced += instanceCount;
    
    // Simulate build result
    var buildResult = "success";
    
    if (buildResult.indexOf("fail") !== -1) {
      // Simulate fix attempt
      var fixResult = "fixed";
      
      if (fixResult.indexOf("fail") !== -1) {
        console.log("✗ Failed to fix build errors");
        hasAnyFailure = true;
        continue;  // CONTINUE #4
      }
      
      // Try build again
      buildResult = "success";
      if (buildResult.indexOf("fail") !== -1) {
        console.log("✗ Build still failing");
        hasAnyFailure = true;
        continue;  // CONTINUE #5
      }
    }
    
    console.log("✓ File " + testFile + " processed successfully");
  }
  
  console.log("\n=== Summary ===");
  console.log("Files processed: " + testFiles.length);
  console.log("Files changed: " + filesChanged);
}