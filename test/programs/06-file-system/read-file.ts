function main() {
  console.log("Testing fs.readFile");
  
  // Test reading an existing file
  const content = fs.readFile("./test-data.txt");
  console.log("File content:", content);
  
  // Test reading a non-existent file
  const missing = fs.readFile("./missing-file.txt");
  console.log("Missing file result:", missing);
  
  // Test using file content in operations
  if (content !== null) {
    const processed = content + " - processed";
    console.log("Processed:", processed);
  }
  
  // Test reading file with path from variable
  const path = "./test-data.txt";
  const content2 = fs.readFile(path);
  console.log("Content from variable path:", content2);
}