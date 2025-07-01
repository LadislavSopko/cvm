// Test program demonstrating state persistence across CC() calls
function main() {
  console.log("Testing state persistence with fs.readFile/writeFile...");
  
  const stateFile = "./tmp/cvm-state.json";
  
  // Load existing state or initialize
  const existingData = fs.readFile(stateFile);
  let state;
  
  if (existingData === null) {
    console.log("No existing state found, initializing...");
    state = {
      filesProcessed: 0,
      totalSize: 0,
      history: []
    };
  } else {
    console.log("Loading existing state...");
    state = JSON.parse(existingData);
    console.log("Files processed so far: " + state.filesProcessed);
  }
  
  // Simulate processing some files
  const files = fs.listFiles("./", { filter: "*.ts" });
  console.log("Found " + files.length + " TypeScript files");
  
  // Process first 3 files (or remaining)
  const startIdx = state.filesProcessed;
  const endIdx = Math.min(startIdx + 3, files.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    const file = files[i];
    console.log("\nProcessing file " + (i + 1) + "/" + files.length + ": " + file);
    
    // Ask Claude to analyze the file
    const analysis = CC("Please analyze this TypeScript file and provide a brief summary (one line): " + file);
    
    // Update state
    state.filesProcessed = i + 1;
    state.totalSize = state.totalSize + 100; // Placeholder for actual size
    state.history.push({
      file: file,
      summary: analysis,
      timestamp: Date.now()
    });
    
    // Save state after each file
    const saved = fs.writeFile(stateFile, JSON.stringify(state));
    console.log("State saved: " + saved);
  }
  
  // Check if we're done
  if (state.filesProcessed >= files.length) {
    console.log("\nAll files processed! Creating final report...");
    
    const report = CC("Based on these file summaries, create a brief project overview:\n" + 
                      JSON.stringify(state.history));
    
    // Save final report
    fs.writeFile("./tmp/analysis-report.txt", report);
    
    // Clean up state file
    fs.writeFile(stateFile, "{}"); // Reset for next run
    
    return "Analysis complete! Report saved to analysis-report.txt";
  } else {
    return "Processed " + state.filesProcessed + "/" + files.length + " files. Run again to continue.";
  }
}