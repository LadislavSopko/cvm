// Test to verify absolute paths
function main() {
  console.log("Testing absolute paths");
  
  // List files with full path
  let files = fs.listFiles("/home/laco/cvm/test/integration");
  console.log("Found " + files.length + " files in /home/laco/cvm/test/integration");
  
  // Show first 3 files
  let count = 0;
  for (const file of files) {
    if (count < 3) {
      console.log("File " + count + ": " + file);
      count = count + 1;
    }
  }
  
  return "Done";
}

main();