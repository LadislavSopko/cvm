// Test program for restart functionality
let runCount = 0;

function main() {
  runCount++;
  console.log("This is run number: " + runCount);
  console.log("Testing restart functionality");
  
  if (runCount === 1) {
    CC("First run - restart me to test!");
  } else {
    console.log("Restart successful! Run count persists: " + runCount);
  }
  
  return "Run " + runCount + " complete";
}