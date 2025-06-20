// Test version of analyze-directory.ts without CC calls
function main() {
  console.log("=== Directory Analyzer (No CC) ===");
  
  // List all TypeScript files in the examples directory
  let files = fs.listFiles("/home/laco/cvm/test/programs", {
    filter: "*.ts"
  });
  
  console.log("Found " + files.length + " TypeScript files to analyze");
  
  if (files.length === 0) {
    console.log("No TypeScript files found!");
    return "No files to analyze";
  }
  
  // Process each file
  let count = 0;
  for (const filepath of files) {
    count = count + 1;
    console.log("\nProcessing file " + count + " of " + files.length + ": " + filepath);
    
    // Just simulate processing without CC
    console.log("Result: Simulated processing done");
    
    // Add a limit for testing
    if (count >= 5) {
      console.log("\nStopping at 5 files for testing");
      break;
    }
  }
  
  console.log("\n=== Analysis Complete ===");
  console.log("Processed " + count + " files");
  
  return "Analysis completed";
}

main();