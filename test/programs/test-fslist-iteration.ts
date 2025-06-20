// Test iteration over fs.listFiles result
function main() {
  console.log("Testing fs.listFiles iteration");
  
  // First check what fs.listFiles returns
  let files = fs.listFiles("/home/laco/cvm/test/programs", {
    filter: "test-simple*.ts"
  });
  
  console.log("Type of files: " + typeof files);
  console.log("Files length: " + files.length);
  
  if (files.length > 0) {
    console.log("First file: " + files[0]);
    console.log("Type of first file: " + typeof files[0]);
  }
  
  // Try manual iteration first
  console.log("\nManual iteration:");
  let i = 0;
  while (i < files.length && i < 3) {
    console.log("File at index " + i + ": " + files[i]);
    i = i + 1;
  }
  
  // Now try for-of
  console.log("\nFor-of iteration:");
  let count = 0;
  for (const file of files) {
    count = count + 1;
    console.log("Iteration " + count + ": " + file);
    if (count >= 3) {
      break;
    }
  }
  
  console.log("\nCompleted successfully");
  return "Done";
}

main();