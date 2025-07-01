// Simple test to show scope leaking
function main() {
  if (true) {
    let blockVar = "I should not be visible outside";
  }
  
  // This should fail but probably won't
  console.log("blockVar outside block: " + blockVar);
  
  // Test with for loop
  for (let i = 0; i < 1; i++) {
    let loopVar = "loop variable";
  }
  
  // These should fail but probably won't
  console.log("i outside loop: " + i);
  console.log("loopVar outside loop: " + loopVar);
  
  return "Scope leak confirmed";
}

main();