function main() {
  console.log("=== CVM Comprehensive Feature Test ===");
  console.log("");
  
  // Phase 1: Arrays
  console.log("--- Phase 1: Arrays ---");
  const numbers = [10, 20, 30, 40, 50];
  console.log("Created array with 5 elements");
  console.log("Array length: " + numbers.length);
  console.log("First element: " + numbers[0]);
  console.log("Last element: " + numbers[numbers.length - 1]);
  console.log("Middle element: " + numbers[2]);
  
  // Phase 2: Control flow with arrays
  console.log("");
  console.log("--- Phase 2: While Loop with Arrays ---");
  let sum = 0;
  let i = 0;
  while (i < numbers.length) {
    console.log("Adding element " + i + ": " + numbers[i]);
    sum = sum + numbers[i];
    i = i + 1;
  }
  console.log("Sum of all elements: " + sum);
  
  // Phase 2: All comparison operators
  console.log("");
  console.log("--- Testing All Comparison Operators ---");
  const avg = sum / numbers.length;
  console.log("Average: " + avg);
  
  if (avg == 30) {
    console.log("✓ Average equals 30");
  }
  
  if (avg != 100) {
    console.log("✓ Average not equal to 100");
  }
  
  if (avg > 25) {
    console.log("✓ Average greater than 25");
  }
  
  if (avg < 35) {
    console.log("✓ Average less than 35");
  }
  
  // Type coercion test
  if (avg == "30") {
    console.log("✓ Type coercion works: 30 == '30'");
  }
  
  // Phase 2: Nested control flow
  console.log("");
  console.log("--- Nested If-Else Statements ---");
  const score = CC("Enter a test score (0-100):");
  
  if (score >= 90) {
    console.log("Grade: A");
    console.log("Excellent work!");
  } else {
    if (score >= 80) {
      console.log("Grade: B");
      console.log("Good job!");
    } else {
      if (score >= 70) {
        console.log("Grade: C");
        console.log("Satisfactory");
      } else {
        if (score >= 60) {
          console.log("Grade: D");
          console.log("Needs improvement");
        } else {
          console.log("Grade: F");
          console.log("Please see instructor");
        }
      }
    }
  }
  
  // Phase 2: All arithmetic operators
  console.log("");
  console.log("--- Testing All Arithmetic Operators ---");
  const num1 = CC("Enter first number:");
  const num2 = CC("Enter second number:");
  
  console.log("Addition: " + num1 + " + " + num2 + " = " + (num1 + num2));
  console.log("Subtraction: " + num1 + " - " + num2 + " = " + (num1 - num2));
  console.log("Multiplication: " + num1 + " * " + num2 + " = " + (num1 * num2));
  
  if (num2 != 0) {
    console.log("Division: " + num1 + " / " + num2 + " = " + (num1 / num2));
  } else {
    console.log("Cannot divide by zero!");
  }
  
  // Complex nested loops and conditions
  console.log("");
  console.log("--- Complex Nested Control Flow ---");
  console.log("Finding numbers in array greater than average:");
  
  let j = 0;
  let countAboveAvg = 0;
  while (j < numbers.length) {
    if (numbers[j] > avg) {
      console.log("  " + numbers[j] + " is above average");
      countAboveAvg = countAboveAvg + 1;
    }
    j = j + 1;
  }
  console.log("Total numbers above average: " + countAboveAvg);
  
  // Multiple arrays and conditions
  console.log("");
  console.log("--- Working with Multiple Arrays ---");
  const grades = [];
  grades[0] = CC("Enter grade 1:");
  grades[1] = CC("Enter grade 2:");
  grades[2] = CC("Enter grade 3:");
  
  console.log("Processing " + grades.length + " grades...");
  
  let gradeSum = 0;
  let gradeIndex = 0;
  let maxGrade = grades[0];
  let minGrade = grades[0];
  
  while (gradeIndex < grades.length) {
    console.log("Grade " + (gradeIndex + 1) + ": " + grades[gradeIndex]);
    gradeSum = gradeSum + grades[gradeIndex];
    
    if (grades[gradeIndex] > maxGrade) {
      maxGrade = grades[gradeIndex];
    }
    
    if (grades[gradeIndex] < minGrade) {
      minGrade = grades[gradeIndex];
    }
    
    gradeIndex = gradeIndex + 1;
  }
  
  const gradeAvg = gradeSum / grades.length;
  console.log("Grade Statistics:");
  console.log("  Average: " + gradeAvg);
  console.log("  Maximum: " + maxGrade);
  console.log("  Minimum: " + minGrade);
  console.log("  Range: " + (maxGrade - minGrade));
  
  // Final complex condition
  if (gradeAvg >= 80) {
    if (minGrade >= 70) {
      console.log("All grades are good - consistent performance!");
    } else {
      console.log("Good average but inconsistent performance");
    }
  } else {
    console.log("Average needs improvement");
  }
  
  // Countdown with multiplication
  console.log("");
  console.log("--- Countdown with Calculations ---");
  let countdown = 5;
  while (countdown > 0) {
    console.log("T-" + countdown + ": " + countdown + " * " + countdown + " = " + (countdown * countdown));
    countdown = countdown - 1;
  }
  console.log("Liftoff!");
  
  console.log("");
  console.log("=== All Tests Complete ===");
  console.log("Successfully tested:");
  console.log("- Arrays (creation, access, length)");
  console.log("- All comparison operators (==, !=, <, >)");
  console.log("- All arithmetic operators (+, -, *, /)");
  console.log("- If/else statements (including nested)");
  console.log("- While loops");
  console.log("- Type coercion");
  console.log("- Complex control flow");
  console.log("- CC input integration");
}
main();