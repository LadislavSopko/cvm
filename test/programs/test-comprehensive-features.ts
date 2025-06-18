function main() {
  console.log("=== CVM Comprehensive Feature Test ===");
  console.log("Testing Phase 1 (Arrays & JSON) + Phase 2 (Control Flow)");
  
  // Phase 1: Arrays
  console.log("\n--- Testing Arrays ---");
  const numbers = [10, 20, 30, 40, 50];
  console.log("Created array: " + JSON.stringify(numbers));
  console.log("Array length: " + numbers.length);
  console.log("First element: " + numbers[0]);
  console.log("Last element: " + numbers[numbers.length - 1]);
  
  // Phase 1: JSON parsing
  console.log("\n--- Testing JSON Parsing ---");
  const jsonData = JSON.parse('{"name": "CVM Test", "version": 2, "features": ["arrays", "control flow"]}');
  console.log("Parsed JSON name: " + jsonData.name);
  console.log("Version: " + jsonData.version);
  console.log("Features: " + JSON.stringify(jsonData.features));
  
  // Phase 2: Control flow with arrays
  console.log("\n--- Testing Control Flow with Arrays ---");
  let sum = 0;
  let i = 0;
  while (i < numbers.length) {
    sum = sum + numbers[i];
    i = i + 1;
  }
  console.log("Sum of array elements: " + sum);
  
  // Phase 2: Comparison operators
  console.log("\n--- Testing Comparison Operators ---");
  const avg = sum / numbers.length;
  console.log("Average: " + avg);
  
  if (avg == 30) {
    console.log("Average equals 30 (correct!)");
  }
  
  if (avg > 25) {
    console.log("Average is greater than 25");
  }
  
  if (avg < 35) {
    console.log("Average is less than 35");
  }
  
  if (avg != 100) {
    console.log("Average is not 100");
  }
  
  // Phase 2: Complex nested control with user input
  console.log("\n--- Student Grade Calculator ---");
  const studentName = CC("Enter student name:");
  console.log("Processing grades for: " + studentName);
  
  // Create grade array from user inputs
  const grades = [];
  grades[0] = CC("Enter grade 1 (0-100):");
  grades[1] = CC("Enter grade 2 (0-100):");
  grades[2] = CC("Enter grade 3 (0-100):");
  
  console.log("Entered grades: " + JSON.stringify(grades));
  
  // Calculate average grade
  let gradeSum = 0;
  let gradeIndex = 0;
  while (gradeIndex < grades.length) {
    gradeSum = gradeSum + grades[gradeIndex];
    gradeIndex = gradeIndex + 1;
  }
  
  const gradeAvg = gradeSum / grades.length;
  console.log("Grade average: " + gradeAvg);
  
  // Determine letter grade with nested if
  let letterGrade = "";
  if (gradeAvg >= 90) {
    letterGrade = "A";
    console.log("Excellent work!");
  } else {
    if (gradeAvg >= 80) {
      letterGrade = "B";
      console.log("Good job!");
    } else {
      if (gradeAvg >= 70) {
        letterGrade = "C";
        console.log("Satisfactory");
      } else {
        if (gradeAvg >= 60) {
          letterGrade = "D";
          console.log("Needs improvement");
        } else {
          letterGrade = "F";
          console.log("Failing - seek help");
        }
      }
    }
  }
  
  console.log("Final letter grade: " + letterGrade);
  
  // Phase 2: Arithmetic with type coercion
  console.log("\n--- Testing Arithmetic & Type Coercion ---");
  const num1 = CC("Enter a number:");
  const num2 = CC("Enter another number:");
  
  // Test arithmetic operators
  console.log("Addition: " + num1 + " + " + num2 + " = " + (num1 + num2));
  console.log("Subtraction: " + num1 + " - " + num2 + " = " + (num1 - num2));
  console.log("Multiplication: " + num1 + " * " + num2 + " = " + (num1 * num2));
  console.log("Division: " + num1 + " / " + num2 + " = " + (num1 / num2));
  
  // Test type coercion in comparisons
  if (num1 == "10") {
    console.log("First number equals '10' (with type coercion)");
  }
  
  // Create a report object
  console.log("\n--- Final Report ---");
  const report = {
    "testName": "CVM Comprehensive Test",
    "student": studentName,
    "grades": grades,
    "average": gradeAvg,
    "letterGrade": letterGrade,
    "arithmeticTest": {
      "num1": num1,
      "num2": num2,
      "sum": num1 + num2,
      "product": num1 * num2
    }
  };
  
  console.log("Report JSON: " + JSON.stringify(report));
  
  // Count high grades
  let highGradeCount = 0;
  let idx = 0;
  while (idx < grades.length) {
    if (grades[idx] >= 85) {
      highGradeCount = highGradeCount + 1;
    }
    idx = idx + 1;
  }
  
  if (highGradeCount > 0) {
    console.log("Number of high grades (85+): " + highGradeCount);
    if (highGradeCount == grades.length) {
      console.log("All grades are high - Outstanding!");
    }
  } else {
    console.log("No high grades achieved");
  }
  
  console.log("\n=== Test Complete ===");
}
main();