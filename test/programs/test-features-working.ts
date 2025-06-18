function main() {
  console.log("=== CVM Feature Test ===");
  console.log("");
  
  // Phase 1: Arrays
  console.log("--- Arrays ---");
  const numbers = [10, 20, 30, 40, 50];
  console.log("Created array with 5 elements");
  console.log("Array length: " + numbers.length);
  
  // Get elements separately
  const first = numbers[0];
  const last = numbers[4];
  const middle = numbers[2];
  console.log("First element: " + first);
  console.log("Last element: " + last);
  console.log("Middle element: " + middle);
  
  // Phase 2: While loop
  console.log("");
  console.log("--- While Loop ---");
  let sum = 0;
  let i = 0;
  while (i < 5) {
    const val = numbers[i];
    console.log("Element " + i + " = " + val);
    sum = sum + val;
    i = i + 1;
  }
  console.log("Sum: " + sum);
  
  // Phase 2: Comparisons
  console.log("");
  console.log("--- Comparisons ---");
  const avg = sum / 5;
  console.log("Average: " + avg);
  
  if (avg == 30) {
    console.log("Average equals 30");
  }
  
  if (avg != 100) {
    console.log("Average not 100");
  }
  
  if (avg > 25) {
    console.log("Average > 25");
  }
  
  if (avg < 35) {
    console.log("Average < 35");
  }
  
  // Phase 2: Nested if
  console.log("");
  console.log("--- Grade Check ---");
  const score = CC("Enter score:");
  
  if (score >= 90) {
    console.log("Grade: A");
  } else {
    if (score >= 80) {
      console.log("Grade: B");
    } else {
      if (score >= 70) {
        console.log("Grade: C");
      } else {
        console.log("Grade: F");
      }
    }
  }
  
  // Phase 2: Arithmetic
  console.log("");
  console.log("--- Arithmetic ---");
  const a = CC("Enter num1:");
  const b = CC("Enter num2:");
  
  const sum2 = a + b;
  const diff = a - b;
  const prod = a * b;
  console.log("Sum: " + sum2);
  console.log("Diff: " + diff);
  console.log("Product: " + prod);
  
  if (b != 0) {
    const quot = a / b;
    console.log("Quotient: " + quot);
  }
  
  // Complex control flow
  console.log("");
  console.log("--- Array Analysis ---");
  let j = 0;
  let count = 0;
  while (j < 5) {
    const num = numbers[j];
    if (num > avg) {
      console.log(num + " > average");
      count = count + 1;
    }
    j = j + 1;
  }
  console.log("Count above avg: " + count);
  
  // Grade array
  console.log("");
  console.log("--- Grades ---");
  const grades = [];
  grades[0] = CC("Grade 1:");
  grades[1] = CC("Grade 2:");
  grades[2] = CC("Grade 3:");
  
  let gSum = 0;
  let k = 0;
  while (k < 3) {
    const g = grades[k];
    console.log("Grade: " + g);
    gSum = gSum + g;
    k = k + 1;
  }
  
  const gAvg = gSum / 3;
  console.log("Grade avg: " + gAvg);
  
  if (gAvg >= 80) {
    console.log("Good average!");
  } else {
    console.log("Keep working!");
  }
  
  console.log("");
  console.log("=== Complete ===");
}
main();