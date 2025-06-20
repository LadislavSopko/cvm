// Program to analyze all TypeScript files in a directory
// and create .md documentation for each one
function main() {
  console.log("=== Directory Analyzer ===");
  
  // List all TypeScript files in the examples directory
  let files = fs.listFiles("/home/laco/cvm/examples", {
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
    
    // Use CC to instruct Claude to analyze the file
    let result = CC("Please read and analyze the TypeScript file at: " + filepath + " - Then write an analysis to a .md file with similar name. Include: 1) Purpose summary, 2) Key functions/features, 3) Code patterns used. After writing, confirm done.");
    
    console.log("Result: " + result);
  }
  
  console.log("\n=== Analysis Complete ===");
  console.log("Processed " + count + " files");
  
  // Final summary
  let summary = CC("Please create a summary file 'analysis-summary.md' that lists all the files analyzed and provides an overview of the codebase structure. Then tell me what you found.");
  console.log("\nFinal summary: " + summary);
  
  return "Analysis completed";
}

main();