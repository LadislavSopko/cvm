function main() {
  console.log("Testing new language features...");
  
  // Test 1: Object.keys()
  console.log("\n=== Testing Object.keys() ===");
  const config = { host: "localhost", port: 3000, debug: true };
  const keys = Object.keys(config);
  console.log("Config has " + keys.length + " keys");
  for (const key of keys) {
    console.log("- " + key);
  }
  
  // Test 2: Traditional for loop
  console.log("\n=== Testing for(;;) loop ===");
  let sum = 0;
  for (let i = 1; i <= 5; i++) {
    sum = sum + i;
    console.log("i=" + i + ", sum=" + sum);
  }
  console.log("Final sum: " + sum);
  
  // Test 3: Switch statement with CC
  console.log("\n=== Testing switch/case ===");
  const action = CC("Enter action (start/stop/restart):");
  switch (action) {
    case "start":
      console.log("Starting service...");
      break;
    case "stop":
      console.log("Stopping service...");
      break;
    case "restart":
      console.log("Restarting service...");
      break;
    default:
      console.log("Unknown action: " + action);
  }
  
  // Test 4: for...in loop
  console.log("\n=== Testing for...in loop ===");
  const stats = { files: 42, errors: 0, warnings: 3 };
  for (const key in stats) {
    console.log(key + ": " + stats[key]);
  }
  
  // Test 5: Combined features
  console.log("\n=== Testing combined features ===");
  const choice = CC("Choose test type (1=keys, 2=loop, 3=skip):");
  
  switch (choice) {
    case "1":
      const testObj = { a: 1, b: 2, c: 3 };
      const objKeys = Object.keys(testObj);
      for (let i = 0; i < objKeys.length; i++) {
        console.log("Key " + i + ": " + objKeys[i]);
      }
      break;
    case "2":
      for (let j = 0; j < 3; j++) {
        console.log("Loop iteration: " + j);
      }
      break;
    case "3":
      console.log("Skipping test");
      break;
    default:
      console.log("Invalid choice");
  }
  
  console.log("\n✓ All tests completed!");
  return 0;
}