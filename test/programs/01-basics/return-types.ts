// Test different return types from main()

function main() {
  const testType = CC("What should I return? (string/number/boolean/array/null/nothing)");
  
  if (testType === "string") {
    return "Hello from CVM!";
  } else if (testType === "number") {
    return 123.45;
  } else if (testType === "boolean") {
    return true;
  } else if (testType === "array") {
    return ["a", "b", "c"];
  } else if (testType === "null") {
    return null;
  } else if (testType === "nothing") {
    return;
  }
  
  // Default
  return "Unknown type: " + testType;
}

main();