// Debug fs.listFiles
function main() {
  console.log("Debug fs.listFiles");
  
  // First test with .
  let files1 = fs.listFiles(".");
  console.log("\nTest 1 - dot path:");
  console.log("Result type check: " + (typeof files1));
  console.log("Is array: " + (files1.length >= 0));
  if (files1.length > 0) {
    console.log("First item: " + files1[0]);
    console.log("Type of first: " + typeof files1[0]);
  }
  
  // Test with absolute path
  let files2 = fs.listFiles("/home/laco/cvm/test/integration");
  console.log("\nTest 2 - absolute path:");
  if (files2.length > 0) {
    console.log("First item: " + files2[0]);
    
    // Check if it's a full path
    let firstFile = files2[0];
    if (firstFile.indexOf("/") === 0) {
      console.log("IS absolute path");
    } else {
      console.log("NOT absolute path");
    }
  }
  
  return "Debug complete";
}

main();