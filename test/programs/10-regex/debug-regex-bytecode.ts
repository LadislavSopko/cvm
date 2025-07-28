function main() {
  console.log("=== Debug Regex Bytecode ===");
  
  // Test 1: Literal regex replace (should use STRING_REPLACE_REGEX)
  var text1 = "hello world hello universe";
  var result1 = text1.replace(/hello/g, "hi");
  console.log("Literal regex result: " + result1);
  
  // Test 2: Variable regex replace (should use STRING_REPLACE but we modified it)
  var text2 = "hello world hello universe";
  var pattern = /hello/g;
  var result2 = text2.replace(pattern, "hi");
  console.log("Variable regex result: " + result2);
  
  // Test 3: String replace (should use STRING_REPLACE original behavior)
  var text3 = "hello world hello universe";
  var result3 = text3.replace("hello", "hi");
  console.log("String replace result: " + result3);
  
  return 0;
}