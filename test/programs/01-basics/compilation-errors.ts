/**
 * Test for Issue #3: Compilation error reporting improvement
 * This file intentionally contains syntax errors to verify that 
 * compilation errors now show readable messages like "message at line X, column Y" 
 * instead of "[object Object]"
 * 
 * NOTE: This test is expected to FAIL during compilation - that's the point!
 * The test verifies that error messages are readable, not that compilation succeeds.
 */

function main() {
  // Intentional syntax error - missing closing quote
  const str = "hello world;
  
  // Another error - undefined variable
  console.log(undefinedVariable);
  
  // Invalid operation
  const x = 5 ** "string";
  
  // Missing semicolon and bracket
  if (true) {
    console.log("test"
  
  // Unclosed string in object
  const obj = {
    name: "test,
    value: 42
  };
}