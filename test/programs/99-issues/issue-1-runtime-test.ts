/**
 * Tests: Runtime test for JUMP_IF_FALSE -1 issue
 * Features: Complex nested loops with breaks and continues
 * CC Responses needed: none
 * 
 * If JUMP_IF_FALSE has -1, this would cause runtime errors
 */

function main() {
  console.log("Testing complex nested loops for JUMP_IF_FALSE issues");
  
  // Test with deeply nested loops and conditions
  for (let a = 0; a < 2; a++) {
    console.log("Level 1: a=" + a.toString());
    
    for (let b = 0; b < 3; b++) {
      console.log("  Level 2: b=" + b.toString());
      
      if (b === 1) {
        console.log("  Continuing level 2");
        continue;
      }
      
      for (let c = 0; c < 2; c++) {
        console.log("    Level 3: c=" + c.toString());
        
        if (c === 0 && b === 2) {
          console.log("    Breaking from level 3");
          break;
        }
        
        for (let d = 0; d < 2; d++) {
          console.log("      Level 4: d=" + d.toString());
          
          if (d === 0) {
            console.log("      Continuing level 4");
            continue;
          }
          
          console.log("      Level 4 work done");
        }
      }
    }
  }
  
  console.log("\nAll tests completed without errors!");
}