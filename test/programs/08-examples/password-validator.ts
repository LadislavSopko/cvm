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
  
  // Now we can check string length!
  console.log("Password length: " + password.length);
  
  if (!matches) {
    console.log("✗ Passwords don't match!");
  } else if (password.length < 8) {
    console.log("✗ Password too short! Must be at least 8 characters.");
  } else {
    console.log("✓ Password is valid!");
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