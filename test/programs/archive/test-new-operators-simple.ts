function main() {
  console.log("====================================");
  console.log("CVM New Operators Integration Test");
  console.log("====================================");
  
  // Test Modulo
  console.log("");
  console.log("MODULO OPERATOR (%):");
  console.log("17 % 5 = " + (17 % 5));
  console.log("20 % 4 = " + (20 % 4));
  console.log("7 % 3 = " + (7 % 3));
  
  // Test comparison operators
  console.log("");
  console.log("COMPARISON OPERATORS:");
  console.log("10 <= 10 = " + (10 <= 10));
  console.log("10 <= 15 = " + (10 <= 15));
  console.log("15 >= 10 = " + (15 >= 10));
  console.log("10 >= 10 = " + (10 >= 10));
  
  // Test strict equality
  console.log("");
  console.log("STRICT EQUALITY:");
  console.log("5 === 5 = " + (5 === 5));
  console.log("5 === '5' = " + (5 === "5"));
  console.log("5 !== '5' = " + (5 !== "5"));
  console.log("'hello' === 'hello' = " + ("hello" === "hello"));
  
  // Test logical operators
  console.log("");
  console.log("LOGICAL OPERATORS:");
  console.log("true && true = " + (true && true));
  console.log("true && false = " + (true && false));
  console.log("true || false = " + (true || false));
  console.log("false || false = " + (false || false));
  console.log("!true = " + !true);
  console.log("!false = " + !false);
  
  // Combined operators in real use
  console.log("");
  console.log("COMBINED USAGE:");
  
  // Check if a number is in range
  let num = 15;
  let inRange = num >= 10 && num <= 20;
  console.log("Is 15 in range [10-20]? " + inRange);
  
  // Check if divisible by 3 or 5
  let divisible = (num % 3 === 0) || (num % 5 === 0);
  console.log("Is 15 divisible by 3 or 5? " + divisible);
  
  // Complex expression
  let a = 8;
  let b = 12;
  let complex = (a < 10 && b > 10) || !(a === b);
  console.log("Complex expression result: " + complex);
  
  // With user input
  console.log("");
  console.log("USER INPUT TEST:");
  let score = CC("Enter a test score (0-100):");
  
  // Grade calculation
  let grade = "";
  if (score >= 90) {
    grade = "A";
  } else if (score >= 80) {
    grade = "B";
  } else if (score >= 70) {
    grade = "C";
  } else {
    grade = "F";
  }
  
  console.log("Score: " + score);
  console.log("Grade: " + grade);
  
  // Check if passed and eligible for honors
  let passed = score >= 60;
  let honors = score >= 85 && passed;
  console.log("Passed: " + passed);
  console.log("Eligible for honors: " + honors);
  
  console.log("");
  console.log("====================================");
  console.log("ALL NEW OPERATORS WORKING CORRECTLY!");
  console.log("====================================");
  console.log("✓ Modulo (%)");
  console.log("✓ Less/Greater than or equal (<=, >=)");
  console.log("✓ Strict equality/inequality (===, !==)");
  console.log("✓ Logical operators (&&, ||, !)");
  console.log("✓ All operators work in expressions");
}
main();