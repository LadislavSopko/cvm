// Test variable scoping in code blocks
function main() {
  console.log("=== Testing Block Scoping ===");
  
  let outer = "outer";
  console.log("Before block: outer = " + outer);
  
  if (true) {
    console.log("Inside if block: outer = " + outer);
    
    let inner = "inner";
    console.log("Inside if block: inner = " + inner);
    
    // Try to modify outer
    outer = "modified in block";
    console.log("Inside if block: outer after modification = " + outer);
  }
  
  console.log("After block: outer = " + outer);
  
  // This should fail in proper block scoping
  try {
    console.log("After block: inner = " + inner);
  } catch (e) {
    console.log("Error accessing inner: " + e);
  }
  
  // Test with for loop
  for (let i = 0; i < 3; i++) {
    let loopVar = "loop" + i;
    console.log("In loop: i = " + i + ", loopVar = " + loopVar);
  }
  
  // This should fail in proper block scoping
  try {
    console.log("After loop: i = " + i);
  } catch (e) {
    console.log("Error accessing i: " + e);
  }
  
  // Test with nested blocks
  if (true) {
    let level1 = "level1";
    if (true) {
      let level2 = "level2";
      console.log("Nested: can access level1 = " + level1);
      console.log("Nested: can access level2 = " + level2);
    }
    // Should not access level2 here
    console.log("After nested: level1 = " + level1);
  }
  
  return "Scoping test complete";
}

main();