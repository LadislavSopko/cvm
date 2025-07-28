/**
 * Tests: C-style for loop functionality
 * Features: basic for loops, break, continue, nested loops, edge cases
 * CC Responses needed: none
 */

function main() {
  console.log("=== Testing C-style for loops ===");
  
  // Test 1: Basic for loop
  console.log("\nTest 1: Basic for loop");
  for (let i = 0; i < 5; i++) {
    console.log("i=" + i.toString());
  }
  
  // Test 2: For loop with continue
  console.log("\nTest 2: For loop with continue (skip even numbers)");
  for (let j = 0; j < 8; j++) {
    if (j % 2 === 0) {
      continue;
    }
    console.log("j=" + j.toString() + " (odd)");
  }
  
  // Test 3: For loop with break
  console.log("\nTest 3: For loop with break at 3");
  for (let k = 0; k < 10; k++) {
    if (k === 3) {
      console.log("Breaking at k=3");
      break;
    }
    console.log("k=" + k.toString());
  }
  
  // Test 4: Nested for loops
  console.log("\nTest 4: Nested for loops");
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      console.log("(" + x.toString() + "," + y.toString() + ")");
    }
  }
  
  // Test 5: Nested loops with continue in inner loop
  console.log("\nTest 5: Nested loops with continue in inner");
  for (let a = 0; a < 3; a++) {
    console.log("Outer a=" + a.toString());
    for (let b = 0; b < 4; b++) {
      if (b === 2) {
        continue;  // Skip b=2
      }
      console.log("  Inner b=" + b.toString());
    }
  }
  
  // Test 6: For loop without init
  console.log("\nTest 6: For loop without init");
  let m = 0;
  for (; m < 3; m++) {
    console.log("m=" + m.toString());
  }
  
  // Test 7: For loop without update (manual increment)
  console.log("\nTest 7: For loop without update");
  for (let n = 0; n < 3; ) {
    console.log("n=" + n.toString());
    n++;
  }
  
  // Test 8: Multiple continues
  console.log("\nTest 8: Multiple continues");
  for (let p = 0; p < 10; p++) {
    if (p === 2 || p === 5 || p === 7) {
      continue;
    }
    console.log("p=" + p.toString());
  }
  
  // Test 9: Complex condition with continue
  console.log("\nTest 9: Complex continue pattern");
  for (let q = 0; q < 20; q++) {
    if (q > 5 && q < 15) {
      continue;  // Skip 6-14
    }
    console.log("q=" + q.toString());
  }
  
  // Test 10: Decrementing for loop
  console.log("\nTest 10: Decrementing for loop");
  for (let r = 5; r > 0; r--) {
    console.log("r=" + r.toString());
  }
  
  console.log("\n=== All for loop tests completed ===");
}