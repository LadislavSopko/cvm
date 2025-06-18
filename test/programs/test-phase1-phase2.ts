function main() {
  console.log("========================================");
  console.log("   CVM Phase 1 & 2 Integration Test    ");
  console.log("========================================");
  
  // Phase 1: Basic Arrays
  console.log("");
  console.log("--- Phase 1: Arrays ---");
  const data = [100, 200, 300];
  console.log("Array created with 3 values");
  console.log("Length: " + data.length);
  console.log("Element 0: " + data[0]);
  console.log("Element 1: " + data[1]);
  console.log("Element 2: " + data[2]);
  
  // Phase 2: Simple comparisons
  console.log("");
  console.log("--- Phase 2: Comparisons ---");
  const x = 10;
  const y = 20;
  
  if (x < y) {
    console.log("10 < 20: true");
  }
  
  if (x == 10) {
    console.log("x == 10: true");
  }
  
  if (y != 10) {
    console.log("y != 10: true");
  }
  
  if (y > 15) {
    console.log("y > 15: true");
  }
  
  // Phase 2: Arithmetic
  console.log("");
  console.log("--- Phase 2: Arithmetic ---");
  console.log("10 + 20 = " + (x + y));
  console.log("20 - 10 = " + (y - x));
  console.log("10 * 20 = " + (x * y));
  console.log("20 / 10 = " + (y / x));
  
  // Phase 2: If-else
  console.log("");
  console.log("--- Phase 2: If-Else ---");
  const score = CC("Enter a score (0-100):");
  
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
  
  // Phase 2: Simple while
  console.log("");
  console.log("--- Phase 2: While Loop ---");
  let count = 5;
  console.log("Counting down:");
  while (count > 0) {
    console.log("  " + count);
    count = count - 1;
  }
  console.log("Done!");
  
  // Combined: Calculate sum manually
  console.log("");
  console.log("--- Combined: Array Sum ---");
  // Manual sum without loop variable indexing
  let sum = data[0] + data[1] + data[2];
  console.log("Sum of array: " + sum);
  let avg = sum / 3;
  console.log("Average: " + avg);
  
  if (avg == 200) {
    console.log("Average is 200");
  }
  
  // User input arrays
  console.log("");
  console.log("--- User Input Array ---");
  const nums = [];
  nums[0] = CC("Enter number 1:");
  nums[1] = CC("Enter number 2:");
  
  console.log("You entered: " + nums[0] + " and " + nums[1]);
  const total = nums[0] + nums[1];
  console.log("Sum: " + total);
  
  if (total > 100) {
    console.log("Total is greater than 100");
  } else {
    console.log("Total is 100 or less");
  }
  
  // Complex nested condition
  console.log("");
  console.log("--- Nested Conditions ---");
  const age = CC("Enter age:");
  const hasLicense = CC("Do you have a license? (yes/no):");
  
  if (age >= 18) {
    console.log("You are an adult");
    if (hasLicense == "yes") {
      console.log("You can drive!");
    } else {
      console.log("You should get a license");
    }
  } else {
    console.log("You are a minor");
    if (age >= 16) {
      console.log("You can get a learner's permit");
    } else {
      console.log("Too young to drive");
    }
  }
  
  console.log("");
  console.log("========================================");
  console.log("        All Tests Completed!           ");
  console.log("========================================");
}
main();