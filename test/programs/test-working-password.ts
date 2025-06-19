function main() {
  console.log("Password Validation Test");
  console.log("========================");
  
  let password = CC("Create a password:");
  let confirm = CC("Confirm password:");
  
  console.log("Password entered: " + password);
  console.log("Confirmation entered: " + confirm);
  
  // Check if passwords match
  let matches = password === confirm;
  console.log("Passwords match: " + matches);
  
  // Since we can't check string.length, we'll simulate
  // In real CVM, we'd need a string length function
  console.log("(Note: string.length not yet implemented in CVM)");
  
  if (matches) {
    console.log("✓ Passwords match!");
  } else {
    console.log("✗ Passwords don't match!");
  }
  
  // Test with arrays (where .length works)
  console.log("");
  console.log("Array length test:");
  let items = ["a", "b", "c", "d", "e", "f", "g", "h"];
  console.log("Array has " + items.length + " items");
  
  if (items.length >= 8) {
    console.log("✓ Array has at least 8 items");
  }
}
main();