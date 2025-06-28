function main() {
  console.log("Testing combined fs.readFile and fs.writeFile");
  
  // Read, process, and write
  const input = fs.readFile("./test-data.txt");
  console.log("Read input:", input);
  
  if (input !== null) {
    const processed = "PROCESSED: " + input;
    const writeResult = fs.writeFile("./processed-output.txt", processed);
    console.log("Write processed result:", writeResult);
    
    // Verify by reading back
    const verification = fs.readFile("./processed-output.txt");
    console.log("Verification read:", verification);
  }
  
  // Test with CC interaction
  const userInput = CC("What content should I write to the file?");
  const ccWriteResult = fs.writeFile("./user-content.txt", userInput);
  console.log("Write user content result:", ccWriteResult);
  
  // Read back and display
  const userContent = fs.readFile("./user-content.txt");
  console.log("User content:", userContent);
}