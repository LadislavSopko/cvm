/**
 * Tests: Issue #1 - Nested loops JUMP_IF_FALSE with -1 argument
 * Features: nested while loops with various conditions
 * CC Responses needed: none
 * 
 * This test attempts to reproduce the issue where nested loops
 * might have incorrect JUMP_IF_FALSE targets with -1 as argument
 */

function main() {
  console.log("Testing nested loops with various conditions");
  
  // Test 1: Simple nested while loops
  let i = 0;
  while (i < 3) {
    console.log("Outer loop i=" + i.toString());
    
    let j = 0;
    while (j < 2) {
      console.log("  Inner loop j=" + j.toString());
      j = j + 1;
    }
    
    i = i + 1;
  }
  
  console.log("\nTest 2: Nested loops with break");
  
  // Test 2: Nested loops with break statements
  let x = 0;
  while (x < 3) {
    console.log("Outer loop x=" + x.toString());
    
    let y = 0;
    while (y < 5) {
      console.log("  Inner loop y=" + y.toString());
      
      if (y === 2) {
        console.log("  Breaking inner loop");
        break;
      }
      
      y = y + 1;
    }
    
    if (x === 1) {
      console.log("Breaking outer loop");
      break;
    }
    
    x = x + 1;
  }
  
  console.log("\nTest 3: Triple nested loops");
  
  // Test 3: Triple nested loops
  let a = 0;
  while (a < 2) {
    console.log("Level 1: a=" + a.toString());
    
    let b = 0;
    while (b < 2) {
      console.log("  Level 2: b=" + b.toString());
      
      let c = 0;
      while (c < 2) {
        console.log("    Level 3: c=" + c.toString());
        c = c + 1;
      }
      
      b = b + 1;
    }
    
    a = a + 1;
  }
  
  console.log("\nTest 4: Nested for-style loops");
  
  // Test 4: Nested for-style loops
  for (let m = 0; m < 2; m++) {
    console.log("Outer for m=" + m.toString());
    
    for (let n = 0; n < 2; n++) {
      console.log("  Inner for n=" + n.toString());
    }
  }
  
  console.log("\nAll nested loop tests completed");
}