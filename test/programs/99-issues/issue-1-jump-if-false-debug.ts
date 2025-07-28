/**
 * Tests: Debug JUMP_IF_FALSE -1 issue
 * Features: Simple test to check if JUMP_IF_FALSE ever has -1 as argument
 * CC Responses needed: none
 * 
 * This minimal test checks if the compiler properly patches JUMP_IF_FALSE
 */

function main() {
  console.log("Starting JUMP_IF_FALSE debug test");
  
  // Simple if statement
  if (false) {
    console.log("This should never print");
  }
  console.log("After simple if");
  
  // Simple while loop
  let i = 0;
  while (i < 1) {
    console.log("In while loop, i=" + i.toString());
    i = i + 1;
  }
  console.log("After while loop");
  
  // Nested structure to trigger any patching issues
  let x = 0;
  while (x < 1) {
    console.log("Outer loop x=" + x.toString());
    
    if (x === 0) {
      console.log("In nested if");
      
      let y = 0;
      while (y < 1) {
        console.log("In nested while, y=" + y.toString());
        y = y + 1;
      }
    }
    
    x = x + 1;
  }
  
  console.log("Test completed successfully");
}