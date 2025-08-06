function main() {
  console.log("=== Comprehensive Control Flow Test ===");
  
  // Test 1: Nested for-of with multiple continues
  console.log("\n--- Test 1: Nested for-of with multiple continues ---");
  let outerData = ["A", "B", "C"];
  let innerData = [1, 2, 3];
  
  for (const letter of outerData) {
    console.log("Outer: " + letter);
    
    if (letter === "A") {
      console.log("Skipping A");
      continue;
    }
    
    for (const num of innerData) {
      console.log("  Inner: " + num);
      
      if (num === 1) {
        console.log("  Skipping 1");
        continue;
      }
      
      if (num === 2) {
        console.log("  Skipping 2");
        continue;
      }
      
      console.log("  Processing: " + letter + "-" + num);
    }
    
    if (letter === "B") {
      console.log("Continuing after B");
      continue;
    }
    
    console.log("Completed outer: " + letter);
  }
  
  // Test 2: for-of with switch-case and continues
  console.log("\n--- Test 2: for-of with switch-case ---");
  let items = ["apple", "banana", "cherry", "date"];
  
  for (const item of items) {
    console.log("Processing item: " + item);
    
    switch (item) {
      case "apple":
        console.log("Found apple");
        continue;
      case "banana":
        console.log("Found banana");
        if (item.indexOf("na") !== -1) {
          console.log("Has 'na' - skipping");
          continue;
        }
        break;
      case "cherry":
        console.log("Found cherry");
        continue;
      default:
        console.log("Default case: " + item);
        break;
    }
    
    console.log("Post-switch processing: " + item);
  }
  
  // Test 3: Traditional for loop with nested control flow
  console.log("\n--- Test 3: Traditional for loop with nested controls ---");
  for (let i = 0; i < 5; i++) {
    console.log("For i=" + i);
    
    if (i === 1) {
      console.log("Skipping i=1");
      continue;
    }
    
    for (let j = 0; j < 3; j++) {
      console.log("  For j=" + j);
      
      if (i === 2 && j === 1) {
        console.log("  Breaking at i=2,j=1");
        break;
      }
      
      if (j === 0) {
        console.log("  Continuing at j=0");
        continue;
      }
      
      console.log("  Processing i=" + i + ", j=" + j);
    }
    
    if (i === 3) {
      console.log("Continuing after i=3");
      continue;
    }
    
    console.log("Completed i=" + i);
  }
  
  // Test 4: while loop with complex conditions
  console.log("\n--- Test 4: while loop with complex conditions ---");
  let count = 0;
  while (count < 7) {
    console.log("While count=" + count);
    count++;
    
    if (count === 2) {
      console.log("Skipping count=2");
      continue;
    }
    
    if (count === 4) {
      for (const x of ["X", "Y"]) {
        console.log("  Nested for-of: " + x);
        if (x === "X") {
          console.log("  Skipping X");
          continue;
        }
        console.log("  Processing: " + x);
      }
      console.log("Continuing after nested for-of");
      continue;
    }
    
    if (count === 6) {
      console.log("Breaking at count=6");
      break;
    }
    
    console.log("Processed count=" + count);
  }
  
  // Test 5: for-in loop (object iteration)
  console.log("\n--- Test 5: for-in loop with continues ---");
  let obj = {
    "key1": "value1",
    "key2": "value2", 
    "key3": "value3",
    "key4": "value4"
  };
  
  for (const key in obj) {
    console.log("Processing key: " + key);
    
    if (key === "key1") {
      console.log("Skipping key1");
      continue;
    }
    
    if (key.indexOf("2") !== -1) {
      console.log("Key contains '2' - skipping");
      continue;
    }
    
    console.log("Key " + key + " = " + obj[key]);
    
    if (key === "key3") {
      console.log("Continuing after key3");
      continue;
    }
    
    console.log("Completed processing: " + key);
  }
  
  // Test 6: Complex nested if-else with continues
  console.log("\n--- Test 6: Complex nested conditions ---");
  let testValues = ["test1", "test2", "test3", "test4", "test5"];
  
  for (const testVal of testValues) {
    console.log("Testing: " + testVal);
    
    if (testVal.indexOf("test") !== -1) {
      console.log("Contains 'test'");
      
      if (testVal === "test1") {
        console.log("Is test1");
        continue;
      } else if (testVal === "test2") {
        console.log("Is test2");
        
        if (testVal.length > 4) {
          console.log("Length > 4");
          continue;
        }
        
        console.log("Processing test2");
      } else {
        console.log("Other test value");
        
        if (testVal === "test3") {
          console.log("Specifically test3 - continuing");
          continue;
        }
        
        if (testVal.indexOf("4") !== -1) {
          console.log("Contains '4'");
          continue;
        }
        
        console.log("Final else processing: " + testVal);
      }
    }
    
    console.log("Completed: " + testVal);
  }
  
  console.log("\n=== All comprehensive control flow tests completed! ===");
}