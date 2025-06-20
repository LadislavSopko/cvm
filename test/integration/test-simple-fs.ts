// Simple test to verify fs.listFiles returns absolute paths
function main() {
  console.log("Testing fs.listFiles with absolute paths");
  
  // List files in current directory
  let files = fs.listFiles(".");
  console.log("Found " + files.length + " files");
  
  // Show first file if exists
  if (files.length > 0) {
    console.log("First file path: " + files[0]);
  }
  
  return "Test complete";
}

main();