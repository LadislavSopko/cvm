/**
 * Test for Issue #5: string.replace('aa','nn') not working after regexp was added
 * This should test simple string replacement without regex
 */

function main() {
  console.log("=== Testing Issue #5: string.replace() ===");
  
  // Test 1: Simple string replacement
  const str1 = "aabbcc";
  const result1 = str1.replace("aa", "nn");
  console.log("Test 1: '" + str1 + "'.replace('aa', 'nn') = '" + result1 + "'");
  console.log("Expected: 'nnbbcc', Got: '" + result1 + "'");
  
  // Test 2: Multiple occurrences (should only replace first)
  const str2 = "aa bb aa cc";
  const result2 = str2.replace("aa", "XX");
  console.log("Test 2: '" + str2 + "'.replace('aa', 'XX') = '" + result2 + "'");
  console.log("Expected: 'XX bb aa cc', Got: '" + result2 + "'");
  
  // Test 3: No match
  const str3 = "hello world";
  const result3 = str3.replace("xyz", "abc");
  console.log("Test 3: '" + str3 + "'.replace('xyz', 'abc') = '" + result3 + "'");
  console.log("Expected: 'hello world', Got: '" + result3 + "'");
  
  // Test 4: Empty string replacement
  const str4 = "hello world";
  const result4 = str4.replace("o", "");
  console.log("Test 4: '" + str4 + "'.replace('o', '') = '" + result4 + "'");
  console.log("Expected: 'hell world', Got: '" + result4 + "'");
  
  // Test 5: Replace with longer string
  const str5 = "a b c";
  const result5 = str5.replace(" ", " and ");
  console.log("Test 5: '" + str5 + "'.replace(' ', ' and ') = '" + result5 + "'");
  console.log("Expected: 'a and b c', Got: '" + result5 + "'");
  
  console.log("=== All tests completed ===");
}