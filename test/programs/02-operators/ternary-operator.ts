function main() {
  console.log("=== Ternary Operator Test ===");
  
  // Basic ternary
  console.log("");
  console.log("Basic ternary:");
  const isTrue = true;
  const result1 = isTrue ? "yes" : "no";
  console.log("true ? 'yes' : 'no' = " + result1);
  
  const isFalse = false;
  const result2 = isFalse ? "yes" : "no";
  console.log("false ? 'yes' : 'no' = " + result2);
  
  // Ternary with comparisons
  console.log("");
  console.log("Ternary with comparisons:");
  const age = 25;
  const status = age >= 18 ? "adult" : "minor";
  console.log("age 25 >= 18 ? 'adult' : 'minor' = " + status);
  
  // Nested ternary
  console.log("");
  console.log("Nested ternary:");
  const score = 85;
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F";
  console.log("score 85: grade = " + grade);
  
  // Ternary in expressions
  console.log("");
  console.log("Ternary in expressions:");
  const x = 10;
  const message = "The value is " + (x > 5 ? "high" : "low");
  console.log(message);
  
  // Complex ternary with arrays
  console.log("");
  console.log("Ternary with arrays:");
  const scores = [95, 82, 73];
  let i = 0;
  while (i < scores.length) {
    const s = scores[i];
    const label = s >= 95 ? "Excellent" : s >= 80 ? "Good" : "Needs work";
    console.log("Score " + s + ": " + label);
    i = i + 1;
  }
  
  // Ternary with logical operators
  console.log("");
  console.log("Ternary with logical operators:");
  const hasLicense = true;
  const isAdult = true;
  const canDrive = hasLicense && isAdult ? "Yes, can drive" : "No, cannot drive";
  console.log("hasLicense && isAdult ? " + canDrive);
  
  // Ternary with user input
  console.log("");
  console.log("Interactive ternary:");
  const userAge = CC("Enter your age:");
  const ageGroup = userAge >= 65 ? "senior" : userAge >= 18 ? "adult" : userAge >= 13 ? "teen" : "child";
  console.log("Age " + userAge + " is in group: " + ageGroup);
  
  // Fix the problematic line from test-logical-operators.ts
  console.log("");
  console.log("Fixed ternary from logical operators test:");
  const testScores = [85, 92, 78, 95, 88, 73, 91];
  i = 0;
  while (i < testScores.length) {
    if (testScores[i] >= 95 || testScores[i] < 75) {
      const status = testScores[i] >= 95 ? "Excellent" : "Needs work";
      console.log("Score " + testScores[i] + " - " + status);
    }
    i = i + 1;
  }
  
  console.log("");
  console.log("=== All ternary tests passed! ===");
}
main();