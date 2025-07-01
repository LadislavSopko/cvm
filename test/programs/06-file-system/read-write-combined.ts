// Test program for fs.readFile and fs.writeFile functionality
function main() {
  console.log("Testing fs.readFile and fs.writeFile...");
  
  // Test 1: Write a simple file
  console.log("\nTest 1: Writing a simple file");
  const testContent = "Hello from CVM!";
  const writeResult = fs.writeFile("./tmp/test-output.txt", testContent);
  console.log("Write result: " + writeResult);
  
  // Test 2: Read the file we just wrote
  console.log("\nTest 2: Reading the file");
  const readContent = fs.readFile("./tmp/test-output.txt");
  console.log("Read content: " + readContent);
  console.log("Content matches: " + (readContent === testContent));
  
  // Test 3: Read non-existent file
  console.log("\nTest 3: Reading non-existent file");
  const notFound = fs.readFile("./tmp/does-not-exist.txt");
  console.log("Non-existent file result: " + notFound);
  console.log("Is null: " + (notFound === null));
  
  // Test 4: Write and read JSON data
  console.log("\nTest 4: Writing and reading JSON");
  const data = {
    count: 42,
    message: "CVM persistence test",
    items: ["one", "two", "three"]
  };
  const jsonResult = fs.writeFile("./tmp/data.json", JSON.stringify(data));
  console.log("JSON write result: " + jsonResult);
  
  const jsonRead = fs.readFile("./tmp/data.json");
  console.log("JSON read successful: " + (jsonRead !== null));
  if (jsonRead !== null) {
    const parsed = JSON.parse(jsonRead);
    console.log("Parsed count: " + parsed.count);
    console.log("Parsed message: " + parsed.message);
  }
  
  // Test 5: Overwrite existing file
  console.log("\nTest 5: Overwriting file");
  const newContent = "Updated content";
  const overwriteResult = fs.writeFile("./tmp/test-output.txt", newContent);
  console.log("Overwrite result: " + overwriteResult);
  const updatedRead = fs.readFile("./tmp/test-output.txt");
  console.log("Updated content: " + updatedRead);
  console.log("Overwrite successful: " + (updatedRead === newContent));
  
  // Test 6: Security - try to read outside sandbox
  console.log("\nTest 6: Security test - reading outside sandbox");
  const securityTest = fs.readFile("../../../../../../etc/passwd");
  console.log("Security test result: " + securityTest);
  console.log("Security blocked: " + (securityTest === null));
  
  // Test 7: Create file in subdirectory
  console.log("\nTest 7: Writing to subdirectory");
  const subdirResult = fs.writeFile("./tmp/output/test.txt", "Subdirectory test");
  console.log("Subdirectory write result: " + subdirResult);
  const subdirRead = fs.readFile("./tmp/output/test.txt");
  console.log("Subdirectory read: " + subdirRead);
  
  return "All tests completed!";
}