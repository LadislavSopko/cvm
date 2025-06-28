function main() {
  // List all files in the test programs directory
  const allFiles = fs.listFiles("/home/laco/cvm/test/programs");
  console.log("Total files: " + allFiles.length);
  
  // Filter for .ts files
  let files = [];
  for (const file of allFiles) {
    const len = file.length;
    if (len > 3 && file.substring(len - 3) === ".ts") {
      files.push(file);
    }
  }
  console.log("Found " + files.length + " test files (.ts)");
  
  // Track what's done and what failed
  let completed = [];
  let failed = [];
  
  // Initialize shell script
  CC("Create /home/laco/cvm/test/integration/run_all_tests.sh with:\n" +
     "#!/bin/bash\n" +
     "# Integration test runner\n" +
     "cd /home/laco/cvm/test/integration\n\n" +
     "Reply 'done'");

  // Process each file
  for (const file of files) {
    
    console.log("\n--- Processing: " + file + " ---");
    
    let success = false;
    
    // Try until it works
    while (!success) {
      const result = CC(
        "TASK: Test program and add to shell script\n\n" +
        "File: " + file + "\n\n" +
        "STEPS:\n" +
        "1. Read the file at the path above\n" +
        "2. Count how many CC() calls it makes\n" +
        "3. Determine what response each CC() needs\n" +
        "4. Build test command:\n" +
        "   - Go to: cd /home/laco/cvm/test/integration\n" +
        "   - Run: npx tsx mcp-test-client.ts " + file + " response1 response2 ...\n" +
        "   - Each CC response must be a separate command line argument\n" +
        "   - Responses with spaces must be quoted\n" +
        "5. TEST the command:\n" +
        "   - Output goes to: test/integration/.cvm/outputs/\n" +
        "   - Check if execution completes without errors\n" +
        "   - Common errors:\n" +
        "     * 'No more responses available' = need more CC responses\n" +
        "     * 'Unknown opcode' = need to rebuild (shouldn't happen now)\n" +
        "     * Empty output = runtime error in program\n" +
        "6. If test works:\n" +
        "   - Append to /home/laco/cvm/test/integration/run_all_tests.sh:\n" +
        "     echo \"Testing " + file + "\"\n" +
        "     npx tsx mcp-test-client.ts " + file + " [your responses]\n" +
        "   - Reply: 'works'\n" +
        "7. If file is broken/has syntax errors: reply 'broken'\n" +
        "8. If needs different responses: explain and reply 'retry'"
      );
      
      if (result === "works") {
        success = true;
        completed.push(file);
      } else if (result === "broken") {
        success = true; // exit loop
        failed.push(file);
      }
      // Otherwise loop continues with 'retry'
    }
  }
  
  // Final step
  CC("Make executable: chmod +x /home/laco/cvm/test/integration/run_all_tests.sh\n" +
     "Reply 'done'");
  
  console.log("\nComplete! Processed: " + completed.length + ", Failed: " + failed.length);
  console.log("Completed files:");
  for (const file of completed) {
    console.log("  ✓ " + file);
  }
  if (failed.length > 0) {
    console.log("Failed files:");
    for (const file of failed) {
      console.log("  ✗ " + file);
    }
  }
}