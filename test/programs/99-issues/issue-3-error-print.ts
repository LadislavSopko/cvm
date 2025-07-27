/**
 * Test for Issue #3: Error print shows [object Object]
 * This should trigger a compilation error to see the bad error message
 */

function main() {
  // Intentional syntax error - missing closing quote
  const str = "hello world;
  
  // Another error - undefined variable
  console.log(undefinedVariable);
  
  // Invalid operation
  const x = 5 ** "string";
}