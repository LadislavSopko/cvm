function main() {
  const files = fs.listFiles("./docs", { filter: "*.txt" });
  const summaries = [];
  
  for (const file of files) {
    // This creates a task for Claude, doesn't "call" Claude
    const content = CC("Read and summarize this file: " + file);
    // Now we can use objects!
    summaries.push({
      filename: file,
      summary: content
    });
    console.log("Processed: " + file);
  }
  
  // Convert summaries array to JSON for the final task
  const summariesJson = JSON.stringify(summaries);
  const report = CC("Create a final report from these file summaries: " + summariesJson);
  console.log("Final Report: " + report);
  
  // Return the report
  return report;
}

main();