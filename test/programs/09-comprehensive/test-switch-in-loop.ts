function main() {
  console.log("Testing switch nested in for loop");
  
  var tasks = ["read", "write"];
  var task;
  var count = 0;
  
  console.log("Starting loop test...");
  
  for (var i = 0; i < tasks.length; i++) {
    task = tasks[i];
    console.log("Task " + i + ": " + task);
    
    switch (task) {
      case "read": {
        console.log("  Reading data");
        for (var j = 1; j <= 2; j++) {
          console.log("    Read step " + j);
        }
        count++;
        break;
      }
      case "write": {
        console.log("  Writing data");
        for (var j = 1; j <= 2; j++) {
          console.log("    Write step " + j);
        }
        count++;
        break;
      }
      default: {
        console.log("  Unknown task");
        break;
      }
    }
  }
  
  console.log("Completed: " + count + " tasks");
  
  // Test CC in while with switch
  var cycles = 0;
  var cmd;
  
  while (cycles < 2) {
    cycles++;
    console.log("Cycle " + cycles);
    
    cmd = CC("Enter command (go/stop):");
    
    switch (cmd) {
      case "go": {
        console.log("  Going...");
        break;
      }
      case "stop": {
        console.log("  Stopping...");
        break;
      }
      default: {
        console.log("  Unknown: " + cmd);
        break;
      }
    }
  }
  
  console.log("Test complete");
  return 0;
}