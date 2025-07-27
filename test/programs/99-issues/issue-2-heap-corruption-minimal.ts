/**
 * Minimal test to reproduce Issue #2: heap corruption 
 * Focused on the exact pattern that causes the issue
 */

function main() {
  console.log("=== Issue #2: Minimal heap corruption test ===");
  
  // Create an array similar to the problematic tddabs
  var items = [
    { name: "TDDAB-01: First item", desc: "First" },
    { name: "TDDAB-02: Second item", desc: "Second" },
    { name: "TDDAB-03: Third item", desc: "Third" },
    { name: "TDDAB-04: Fourth item", desc: "Fourth" },
    { name: "TDDAB-05: Fifth item", desc: "Fifth" }
  ];
  
  console.log("Initial items.length: " + items.length);
  
  var index = 0;
  while (index < items.length) {
    var item = items[index];
    console.log("\nProcessing item: " + item.name);
    console.log("Before split - items.length: " + items.length);
    
    // This is the problematic pattern from line 198
    var testCommand = "Run: npx nx test --testNamePattern=\"" + item.name.split(':')[0] + "\"";
    
    console.log("After split - items.length: " + items.length);
    console.log("Test command: " + testCommand);
    
    // Check if heap is corrupted
    if (items.length !== 5) {
      console.log("!!! HEAP CORRUPTION DETECTED !!!");
      console.log("Expected length: 5, Actual: " + items.length);
      break;
    }
    
    index = index + 1;
  }
  
  console.log("\nFinal items.length: " + items.length);
  console.log("Corruption occurred: " + (items.length !== 5 ? "YES" : "NO"));
}