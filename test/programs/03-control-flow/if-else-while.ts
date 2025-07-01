function main() {
  console.log("Testing control flow features...");
  
  // Test if statement
  const age = CC("Enter your age:");
  if (age < 18) {
    console.log("You are a minor");
  } else {
    console.log("You are an adult");
  }
  
  // Test nested if
  const score = CC("Enter your test score (0-100):");
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
  
  // Test while loop
  console.log("Counting down from 5:");
  let count = 5;
  while (count > 0) {
    console.log("Count: " + count);
    count = count - 1;
  }
  
  console.log("Done counting");
  
  // Test complex condition
  const x = CC("Enter a number:");
  const y = CC("Enter another number:");
  if ((x + y) > 10) {
    console.log("Sum is greater than 10");
    if (x > y) {
      console.log("First number is larger");
    } else {
      console.log("Second number is larger or equal");
    }
  } else {
    console.log("Sum is 10 or less");
  }
  
  console.log("Control flow test complete!");
}
main();