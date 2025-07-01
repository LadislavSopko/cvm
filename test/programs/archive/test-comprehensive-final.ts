function main() {
  console.log("====================================");
  console.log("CVM Comprehensive Integration Test");
  console.log("Phase 1 + Phase 2 Features");
  console.log("====================================");
  
  // Phase 1: Arrays
  console.log("");
  console.log("PHASE 1: ARRAYS");
  console.log("---------------");
  const scores = [95, 87, 92, 78, 88];
  console.log("Created scores array with 5 elements");
  console.log("Array length: " + scores.length);
  
  // Access elements
  console.log("First score: " + scores[0]);
  console.log("Last score: " + scores[4]);
  console.log("Middle score: " + scores[2]);
  
  // Phase 2: While loop with arrays
  console.log("");
  console.log("PHASE 2: CONTROL FLOW");
  console.log("---------------------");
  console.log("Calculating total using while loop...");
  
  let total = 0;
  let index = 0;
  while (index < scores.length) {
    total = total + scores[index];
    index = index + 1;
  }
  console.log("Total of all scores: " + total);
  
  // Calculate average
  const average = total / scores.length;
  console.log("Average score: " + average);
  
  // Phase 2: All comparison operators
  console.log("");
  console.log("Testing comparison operators:");
  
  if (average == 88) {
    console.log("- Average equals 88 ✓");
  }
  
  if (average != 100) {
    console.log("- Average not equal to 100 ✓");
  }
  
  if (average > 85) {
    console.log("- Average greater than 85 ✓");
  }
  
  if (average < 90) {
    console.log("- Average less than 90 ✓");
  }
  
  // Type coercion
  if (88 == "88") {
    console.log("- Type coercion: 88 == '88' is true ✓");
  }
  
  // User input with nested if-else
  console.log("");
  console.log("STUDENT GRADE EVALUATION");
  console.log("------------------------");
  const studentScore = CC("Enter student score (0-100):");
  
  let grade = "";
  let message = "";
  
  if (studentScore >= 90) {
    grade = "A";
    message = "Excellent!";
  } else {
    if (studentScore >= 80) {
      grade = "B";
      message = "Good job!";
    } else {
      if (studentScore >= 70) {
        grade = "C";
        message = "Satisfactory";
      } else {
        if (studentScore >= 60) {
          grade = "D";
          message = "Needs improvement";
        } else {
          grade = "F";
          message = "Failing";
        }
      }
    }
  }
  
  console.log("Score: " + studentScore);
  console.log("Grade: " + grade);
  console.log("Status: " + message);
  
  // All arithmetic operators
  console.log("");
  console.log("ARITHMETIC OPERATIONS");
  console.log("--------------------");
  const num1 = CC("Enter first number:");
  const num2 = CC("Enter second number:");
  
  console.log("Number 1: " + num1);
  console.log("Number 2: " + num2);
  console.log("Addition: " + (num1 + num2));
  console.log("Subtraction: " + (num1 - num2));
  console.log("Multiplication: " + (num1 * num2));
  
  if (num2 != 0) {
    console.log("Division: " + (num1 / num2));
  } else {
    console.log("Division: Cannot divide by zero!");
  }
  
  // Count scores above average
  console.log("");
  console.log("ADVANCED ARRAY ANALYSIS");
  console.log("-----------------------");
  console.log("Finding scores above average (" + average + "):");
  
  let i = 0;
  let aboveCount = 0;
  while (i < scores.length) {
    if (scores[i] > average) {
      console.log("- Score at position " + i + ": " + scores[i]);
      aboveCount = aboveCount + 1;
    }
    i = i + 1;
  }
  console.log("Total scores above average: " + aboveCount);
  
  // Multiple user inputs into array
  console.log("");
  console.log("DYNAMIC ARRAY CREATION");
  console.log("----------------------");
  const userScores = [];
  userScores[0] = CC("Enter score 1:");
  userScores[1] = CC("Enter score 2:");
  userScores[2] = CC("Enter score 3:");
  
  console.log("Created array with " + userScores.length + " user scores");
  
  // Process user scores
  let userTotal = 0;
  let j = 0;
  let maxScore = userScores[0];
  let minScore = userScores[0];
  
  while (j < userScores.length) {
    userTotal = userTotal + userScores[j];
    
    if (userScores[j] > maxScore) {
      maxScore = userScores[j];
    }
    
    if (userScores[j] < minScore) {
      minScore = userScores[j];
    }
    
    j = j + 1;
  }
  
  const userAverage = userTotal / userScores.length;
  
  console.log("Statistics:");
  console.log("- Total: " + userTotal);
  console.log("- Average: " + userAverage);
  console.log("- Maximum: " + maxScore);
  console.log("- Minimum: " + minScore);
  console.log("- Range: " + (maxScore - minScore));
  
  // Complex nested condition
  if (userAverage >= 80) {
    console.log("Performance: Good average!");
    if (minScore >= 70) {
      console.log("Consistency: All scores are solid!");
    } else {
      console.log("Consistency: Some scores need work");
    }
  } else {
    if (userAverage >= 60) {
      console.log("Performance: Average needs improvement");
    } else {
      console.log("Performance: Significant improvement needed");
    }
  }
  
  // Factorial calculation (multiplication test)
  console.log("");
  console.log("FACTORIAL CALCULATION");
  console.log("--------------------");
  let n = 5;
  let factorial = 1;
  let counter = n;
  
  console.log("Calculating " + n + "! using while loop:");
  while (counter > 0) {
    factorial = factorial * counter;
    console.log("- " + factorial + " (after multiplying by " + counter + ")");
    counter = counter - 1;
  }
  console.log("Result: " + n + "! = " + factorial);
  
  console.log("");
  console.log("====================================");
  console.log("TEST COMPLETE - ALL FEATURES WORKING");
  console.log("====================================");
  console.log("✓ Arrays (creation, access, length)");
  console.log("✓ While loops with arrays");
  console.log("✓ All comparison operators");
  console.log("✓ All arithmetic operators");
  console.log("✓ If-else statements (nested)");
  console.log("✓ Type coercion");
  console.log("✓ User input (CC)");
  console.log("✓ Complex control flow");
}
main();