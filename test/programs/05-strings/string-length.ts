function main() {
  console.log("STRING LENGTH TEST");
  console.log("==================");
  console.log("");
  
  // Test with literal strings
  const hello = "hello";
  const world = "world!";
  console.log("String: '" + hello + "' has length: " + hello.length);
  console.log("String: '" + world + "' has length: " + world.length);
  
  // Test with empty string
  const empty = "";
  console.log("Empty string has length: " + empty.length);
  
  // Test with concatenated strings
  const combined = hello + " " + world;
  console.log("Combined string: '" + combined + "' has length: " + combined.length);
  
  // Test with user input
  console.log("");
  console.log("PASSWORD VALIDATION");
  console.log("-------------------");
  const password = CC("Enter a password:");
  const passwordLength = password.length;
  console.log("Your password has " + passwordLength + " characters");
  
  if (passwordLength < 8) {
    console.log("✗ Password too short! Must be at least 8 characters.");
  } else {
    console.log("✓ Password length is acceptable.");
  }
  
  // Test with conditional based on length
  console.log("");
  console.log("NAME VALIDATION");
  console.log("---------------");
  const name = CC("Enter your name:");
  
  if (name.length === 0) {
    console.log("✗ Name cannot be empty!");
  } else if (name.length < 2) {
    console.log("✗ Name too short!");
  } else if (name.length > 50) {
    console.log("✗ Name too long!");
  } else {
    console.log("✓ Name length is valid: " + name.length + " characters");
  }
  
  // Compare string and array length
  console.log("");
  console.log("STRING vs ARRAY LENGTH");
  console.log("----------------------");
  const text = "abcde";
  const items = ["a", "b", "c", "d", "e"];
  console.log("String '" + text + "' length: " + text.length);
  console.log("Array length: " + items.length);
  console.log("Are they equal? " + (text.length === items.length));
}

main();