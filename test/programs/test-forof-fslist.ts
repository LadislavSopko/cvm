// Test for-of loop with fs.listFiles
function main() {
  console.log("Testing for-of with fs.listFiles");
  
  // Get a small list of files
  let files = fs.listFiles("/home/laco/cvm/test/programs", {
    filter: "test-*.ts"
  });
  
  console.log("Found " + files.length + " test files");
  
  // Simple iteration
  let count = 0;
  for (const file of files) {
    count = count + 1;
    console.log("File " + count + ": " + file);
    
    // Stop after 3 to keep it simple
    if (count >= 3) {
      break;
    }
  }
  
  console.log("Iteration complete. Processed " + count + " files");
  
  return "Test complete";
}

main();