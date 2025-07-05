function main() {
  console.log("=== CVM Complex Feature Combinations Test ===");
  console.log("Testing deeply nested language features");
  console.log("");
  
  // Function level variables (CVM requirement)  
  var taskQueue = ["analyze", "process"];
  var taskType, itemId;
  var totalProcessed = 0;
  
  // Test 1: Switch NESTED inside for loop with block scoping
  console.log("--- Test 1: Switch nested in for loop ---");
  for (var i = 0; i < taskQueue.length; i++) {
    taskType = taskQueue[i];
    console.log("Processing task " + (i + 1) + ": " + taskType);
    
    // For each task type, process 2 items
    for (var j = 0; j < 2; j++) {
      itemId = (i * 10) + j + 1;
      console.log("  Item " + itemId + ":");
      
      // Switch NESTED inside the for loop - this is the complex pattern!
      switch (taskType) {
        case "analyze": {
          // Block scoping in switch case
          var analysisSteps = ["scan", "parse"];
          console.log("    Starting analysis...");
          
          // Nested for loop inside switch case
          for (var k = 0; k < analysisSteps.length; k++) {
            console.log("      Step " + (k + 1) + ": " + analysisSteps[k]);
          }
          totalProcessed++;
          break;
        }
        
        case "process": {
          // Block with nested control flow
          console.log("    Processing data...");
          
          // Nested for loop inside switch case
          for (var k = 1; k <= 2; k++) {
            console.log("      Phase " + k);
          }
          totalProcessed++;
          break;
        }
        
        default: {
          console.log("    ERROR: Unknown task type: " + taskType);
          break;
        }
      }
    }
  }
  
  console.log("Total processed: " + totalProcessed);
  
  // Test 2: While loop with nested switch and CC interaction
  console.log("");
  console.log("--- Test 2: While with nested switch and CC ---");
  
  var cycleCount = 0;
  var maxCycles = 2;
  var userCommand;
  var systemState = "idle";
  
  while (cycleCount < maxCycles) {
    cycleCount++;
    console.log("Cycle " + cycleCount + ", state: " + systemState);
    
    userCommand = CC("Enter command (start/stop/status):");
    
    // Switch NESTED inside while loop
    switch (userCommand) {
      case "start": {
        systemState = "running";
        var startupTasks = ["init", "ready"];
        
        console.log("  Starting...");
        // Nested for loop in switch case
        for (var k = 0; k < startupTasks.length; k++) {
          console.log("    " + startupTasks[k]);
        }
        break;
      }
      
      case "stop": {
        console.log("  Stopping...");
        systemState = "stopped";
        // Exit the while loop early
        break;
      }
      
      case "status": {
        console.log("  Status: " + systemState);
        break;
      }
      
      default: {
        console.log("  Unknown: " + userCommand);
        break;
      }
    }
    
    // Exit if stopped
    if (systemState === "stopped") {
      break;
    }
  }
  
  // Test 3: Object.keys() with nested switch processing  
  console.log("");
  console.log("--- Test 3: Object.keys() with nested switch ---");
  
  var configs = {
    database: { port: 5432 },
    cache: { port: 6379 }
  };
  
  var configKeys = Object.keys(configs);
  var configName, configData;
  
  // for loop with Object.keys() and nested switch
  for (var i = 0; i < configKeys.length; i++) {
    configName = configKeys[i];
    configData = configs[configName];
    
    console.log("Config: " + configName);
    
    // Switch NESTED in for loop processing Object.keys() result
    switch (configName) {
      case "database": {
        console.log("  Database validation...");
        // Nested for loop checking ports
        var validPorts = [5432, 3306];
        for (var k = 0; k < validPorts.length; k++) {
          if (configData.port === validPorts[k]) {
            console.log("    Port " + configData.port + " is valid");
            break;
          }
        }
        break;
      }
      
      case "cache": {
        console.log("  Cache validation...");
        // for...in nested inside switch case
        var propName, propValue;
        for (propName in configData) {
          propValue = configData[propName];
          console.log("    " + propName + ": " + propValue);
        }
        break;
      }
      
      default: {
        console.log("  Unknown config: " + configName);
        break;
      }
    }
  }
  
  console.log("");
  console.log("=== Complex Feature Combinations Test Complete ===");
  console.log("Successfully tested:");
  console.log("✓ Switch statements NESTED inside for loops");
  console.log("✓ Switch statements NESTED inside while loops"); 
  console.log("✓ Block scoping {} within switch cases");
  console.log("✓ Nested for loops inside switch cases");
  console.log("✓ Object.keys() with nested switch processing");
  console.log("✓ for...in loops inside switch cases");
  console.log("✓ CC integration with complex nested control flow");
  console.log("✓ Function-level variables only (var declarations)");
  
  return 0;
}