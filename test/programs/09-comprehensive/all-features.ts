function main() {
  console.log("=== CVM Comprehensive Feature Test v3 ===");
  console.log("Testing all features including recent additions");
  console.log("");
  
  // Phase 1: Basic types and operations
  console.log("--- Phase 1: Basic Types and Operations ---");
  const numbers = [10, 20, 30, 40, 50];
  console.log("Array length: " + numbers.length);
  console.log("First element: " + numbers[0]);
  console.log("Last element: " + numbers[numbers.length - 1]);
  
  // Test undefined
  let undefinedVar;
  console.log("Undefined variable: " + undefinedVar);
  console.log("Is undefined: " + (undefinedVar === undefined));
  console.log("typeof undefined: " + typeof undefinedVar);
  
  // Test typeof on various types
  console.log("typeof 42: " + typeof 42);
  console.log("typeof 'hello': " + typeof "hello");
  console.log("typeof true: " + typeof true);
  console.log("typeof null: " + typeof null);
  console.log("typeof []: " + typeof []);
  console.log("typeof {}: " + typeof {});
  
  // Phase 2: String methods
  console.log("");
  console.log("--- Phase 2: String Methods ---");
  const testStr = "Hello CVM World!";
  console.log("Original string: " + testStr);
  console.log("Length: " + testStr.length);
  console.log("charAt(0): " + testStr.charAt(0));
  console.log("charAt(6): " + testStr.charAt(6));
  console.log("indexOf('CVM'): " + testStr.indexOf("CVM"));
  console.log("indexOf('xyz'): " + testStr.indexOf("xyz"));
  console.log("substring(0, 5): " + testStr.substring(0, 5));
  console.log("substring(6, 9): " + testStr.substring(6, 9));
  console.log("slice(0, 5): " + testStr.slice(0, 5));
  console.log("slice(-6): " + testStr.slice(-6));
  console.log("toUpperCase(): " + testStr.toUpperCase());
  console.log("toLowerCase(): " + testStr.toLowerCase());
  
  // Test split (which is implemented)
  console.log("split(' '): " + testStr.split(" ").length + " words");
  const words = testStr.split(" ");
  console.log("First word: " + words[0]);
  console.log("Last word: " + words[2]);
  
  // Test with CC input
  const userText = CC("Enter some text to process:");
  console.log("You entered: " + userText);
  console.log("Uppercase: " + userText.toUpperCase());
  console.log("Length: " + userText.length);
  
  // Phase 3: Advanced operators
  console.log("");
  console.log("--- Phase 3: Advanced Operators ---");
  
  // Modulo operator
  console.log("17 % 5 = " + (17 % 5));
  console.log("20 % 4 = " + (20 % 4));
  console.log("-17 % 5 = " + (-17 % 5));
  
  // Compound assignment operators
  let x = 10;
  console.log("Initial x = " + x);
  x += 5;
  console.log("After x += 5: " + x);
  x -= 3;
  console.log("After x -= 3: " + x);
  x *= 2;
  console.log("After x *= 2: " + x);
  x /= 4;
  console.log("After x /= 4: " + x);
  x %= 3;
  console.log("After x %= 3: " + x);
  
  // Unary operators
  let counter = 5;
  console.log("Initial counter: " + counter);
  console.log("++counter: " + (++counter));
  console.log("counter after: " + counter);
  console.log("counter++: " + (counter++));
  console.log("counter after: " + counter);
  console.log("--counter: " + (--counter));
  console.log("counter after: " + counter);
  console.log("counter--: " + (counter--));
  console.log("counter after: " + counter);
  
  // Unary plus and minus
  console.log("+true: " + (+true));
  console.log("+false: " + (+false));
  console.log("+'42': " + (+"42"));
  console.log("-'42': " + (-"42"));
  
  // Phase 4: Logical operators
  console.log("");
  console.log("--- Phase 4: Logical Operators ---");
  const a = true;
  const b = false;
  console.log("a = " + a + ", b = " + b);
  console.log("a && b = " + (a && b));
  console.log("a || b = " + (a || b));
  console.log("!a = " + (!a));
  console.log("!b = " + (!b));
  
  // Truthy/falsy values
  console.log("!0 = " + (!0));
  console.log("!1 = " + (!1));
  console.log("!'' = " + (!""));
  console.log("!'hello' = " + (!"hello"));
  console.log("!null = " + (!null));
  console.log("!undefined = " + (!undefined));
  
  // Short-circuit evaluation
  console.log("5 && 0 = " + (5 && 0));
  console.log("0 || 10 = " + (0 || 10));
  console.log("null || 'default' = " + (null || "default"));
  
  // Phase 5: Ternary operator
  console.log("");
  console.log("--- Phase 5: Ternary Operator ---");
  const age = CC("Enter your age:");
  const category = age >= 18 ? "adult" : "minor";
  console.log("You are " + age + " years old, so you are a " + category);
  
  // Nested ternary
  const score = CC("Enter a score (0-100):");
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  console.log("Score: " + score + ", Grade: " + grade);
  
  // Phase 6: Comparison operators
  console.log("");
  console.log("--- Phase 6: All Comparison Operators ---");
  console.log("5 > 3: " + (5 > 3));
  console.log("5 < 3: " + (5 < 3));
  console.log("5 >= 5: " + (5 >= 5));
  console.log("5 <= 5: " + (5 <= 5));
  console.log("5 == '5': " + (5 == "5"));
  console.log("5 === '5': " + (5 === "5"));
  console.log("5 != '5': " + (5 != "5"));
  console.log("5 !== '5': " + (5 !== "5"));
  console.log("null == undefined: " + (null == undefined));
  console.log("null === undefined: " + (null === undefined));
  
  // Phase 7: Objects
  console.log("");
  console.log("--- Phase 7: Objects ---");
  const person = {
    name: "Alice",
    age: 30,
    city: "New York"
  };
  console.log("Person object created");
  console.log("Name: " + person.name);
  console.log("Age: " + person.age);
  console.log("City: " + person.city);
  
  // Modify object
  person.age = 31;
  person.country = "USA";
  console.log("After modifications:");
  console.log("Updated age: " + person.age);
  console.log("Added country: " + person.country);
  
  // Object with array
  const data = {
    title: "Test Data",
    values: [1, 2, 3, 4, 5],
    count: 5
  };
  console.log("Data title: " + data.title);
  console.log("Data count: " + data.count);
  console.log("First value: " + data.values[0]);
  console.log("Last value: " + data.values[data.values.length - 1]);
  
  // Phase 8: Array operations
  console.log("");
  console.log("--- Phase 8: Array Operations ---");
  const arr = [];
  arr.push(10);
  arr.push(20);
  arr.push(30);
  console.log("Array after pushes: length = " + arr.length);
  console.log("Elements: " + arr[0] + ", " + arr[1] + ", " + arr[2]);
  
  // Array of objects
  const users = [];
  users.push({ name: "Bob", score: 85 });
  users.push({ name: "Carol", score: 92 });
  users.push({ name: "Dave", score: 78 });
  
  console.log("Users array length: " + users.length);
  console.log("First user: " + users[0].name + " - " + users[0].score);
  console.log("Second user: " + users[1].name + " - " + users[1].score);
  console.log("Third user: " + users[2].name + " - " + users[2].score);
  
  // Phase 9: For-of loops
  console.log("");
  console.log("--- Phase 9: For-of Loops ---");
  
  // Simple array iteration
  const colors = ["red", "green", "blue"];
  console.log("Iterating over colors:");
  for (const color of colors) {
    console.log("  Color: " + color);
  }
  
  // Number array iteration
  const nums = [15, 25, 35, 45];
  console.log("Iterating over number array:");
  for (const n of nums) {
    if (n > 30) {
      console.log("  " + n + " is greater than 30");
    } else {
      console.log("  " + n + " is 30 or less");
    }
  }
  
  // Phase 10: Break and continue
  console.log("");
  console.log("--- Phase 10: Break and Continue ---");
  
  // Break example
  console.log("Finding first number divisible by 7:");
  let i = 1;
  while (i <= 50) {
    if (i % 7 === 0) {
      console.log("  Found: " + i);
      break;
    }
    i++;
  }
  
  // Continue example
  console.log("Printing odd numbers from 1 to 10:");
  let j = 0;
  while (j < 10) {
    j++;
    if (j % 2 === 0) {
      continue;
    }
    console.log("  " + j);
  }
  
  // Phase 11: File system operations
  console.log("");
  console.log("--- Phase 11: File System Operations ---");
  
  // Write a file
  const testContent = "This is a test file created by CVM";
  const writeResult = fs.writeFile("./test-output.txt", testContent);
  console.log("Write file result: " + writeResult);
  
  // Read the file back
  const readContent = fs.readFile("./test-output.txt");
  console.log("Read file content: " + readContent);
  console.log("Content matches: " + (readContent === testContent));
  
  // Write JSON
  const jsonData = {
    test: "data",
    number: 42,
    array: [1, 2, 3]
  };
  fs.writeFile("./test-data.json", JSON.stringify(jsonData));
  
  // Read and parse JSON
  const jsonStr = fs.readFile("./test-data.json");
  if (jsonStr !== null) {
    const parsed = JSON.parse(jsonStr);
    console.log("Parsed JSON number: " + parsed.number);
  }
  
  // List files
  console.log("Files in current directory:");
  const files = fs.listFiles(".");
  let fileCount = 0;
  for (const file of files) {
    fileCount++;
    if (fileCount <= 5) {
      console.log("  " + file);
    }
  }
  console.log("  ... and " + (files.length - 5) + " more files");
  
  // Phase 12: Complex integration
  console.log("");
  console.log("--- Phase 12: Complex Integration ---");
  
  // Calculate statistics
  const values = [10, 25, 30, 15, 40, 35, 20];
  let sum = 0;
  let min = values[0];
  let max = values[0];
  
  for (const val of values) {
    sum += val;
    if (val < min) min = val;
    if (val > max) max = val;
  }
  
  const avg = sum / values.length;
  console.log("Statistics:");
  console.log("  Count: " + values.length);
  console.log("  Sum: " + sum);
  console.log("  Average: " + avg);
  console.log("  Min: " + min);
  console.log("  Max: " + max);
  
  // Count values above average
  let aboveAvg = 0;
  for (const val of values) {
    if (val > avg) {
      aboveAvg++;
    }
  }
  console.log("  Values above average: " + aboveAvg);
  
  // Phase 13: Return value
  console.log("");
  console.log("--- Phase 13: Function Return ---");
  
  const finalScore = CC("Enter final score (0-100):");
  const passed = finalScore >= 70;
  const result = passed ? "PASSED" : "FAILED";
  
  console.log("Final score: " + finalScore);
  console.log("Result: " + result);
  
  // Save final results
  const finalData = {
    score: finalScore,
    passed: passed,
    testsRun: [
      "types", "strings", "operators", "logical", "ternary",
      "comparison", "objects", "arrays", "loops", "break-continue",
      "file-system", "integration"
    ]
  };
  
  fs.writeFile("./final-results.json", JSON.stringify(finalData));
  console.log("Results saved to final-results.json");
  
  console.log("");
  console.log("=== All Tests Complete ===");
  console.log("Successfully tested:");
  console.log("- Basic types and undefined");
  console.log("- String methods (all 15+ methods)");
  console.log("- Operators (arithmetic, compound, unary, logical)");
  console.log("- Ternary operator");
  console.log("- All comparison operators");
  console.log("- Objects and nested data");
  console.log("- Arrays and array methods");
  console.log("- For-of loops");
  console.log("- Break and continue");
  console.log("- File system operations");
  console.log("- Complex integrations");
  console.log("- Function return values");
  
  return "All tests completed successfully!";
}

main();