/**
 * Tests: Minimal test to show for-continue bug
 * Features: Simple for loop with continue
 * CC Responses needed: none
 * 
 * This should print: 0, 2, 3 (skipping 1)
 * But the bug causes infinite loop because i++ is skipped
 */

function main() {
  console.log("Starting for-continue test");
  
  for (let i = 0; i < 4; i++) {
    if (i === 1) {
      console.log("Continuing at i=1");
      continue;  // BUG: This jumps to condition check, skipping i++
    }
    console.log("i=" + i.toString());
  }
  
  console.log("Test completed");
}