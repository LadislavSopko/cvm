function main() {
  console.log("Testing fs.writeFile");
  
  // Test writing a simple file
  const result1 = fs.writeFile("./tmp/output.txt", "Hello, world!");
  console.log("Write result 1:", result1);
  
  // Test writing with dynamic content
  const timestamp = "2024-01-01";
  const content = "Log entry: " + timestamp;
  const result2 = fs.writeFile("./tmp/log.txt", content);
  console.log("Write result 2:", result2);
  
  // Test writing to invalid path (should fail)
  const result3 = fs.writeFile("/root/forbidden.txt", "Cannot write here");
  console.log("Write to forbidden path:", result3);
  
  // Test writing non-string values (should convert to string)
  const result4 = fs.writeFile("./tmp/number.txt", 42);
  console.log("Write number result:", result4);
  
  const result5 = fs.writeFile("./tmp/boolean.txt", true);
  console.log("Write boolean result:", result5);
  
  const result6 = fs.writeFile("./tmp/null.txt", null);
  console.log("Write null result:", result6);
}