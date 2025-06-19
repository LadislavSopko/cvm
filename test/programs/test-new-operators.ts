function main() {
  console.log("=== Testing New Operators ===");
  console.log("");
  
  // Test modulo operator
  console.log("--- Modulo Operator (%) ---");
  const a = 17;
  const b = 5;
  const remainder = a % b;
  console.log("17 % 5 = " + remainder);
  
  if (remainder === 2) {
    console.log("✓ Modulo works correctly");
  }
  
  // Test with CC input
  const dividend = CC("Enter a number to divide:");
  const divisor = CC("Enter divisor:");
  const quotient = dividend / divisor;
  const mod = dividend % divisor;
  console.log(dividend + " / " + divisor + " = " + quotient);
  console.log(dividend + " % " + divisor + " = " + mod);
  
  // Test <= and >=
  console.log("");
  console.log("--- Less/Greater Than or Equal ---");
  const x = 10;
  const y = 10;
  const z = 15;
  
  if (x <= y) {
    console.log("✓ 10 <= 10 is true");
  }
  
  if (x <= z) {
    console.log("✓ 10 <= 15 is true");
  }
  
  if (z >= y) {
    console.log("✓ 15 >= 10 is true");
  }
  
  if (y >= x) {
    console.log("✓ 10 >= 10 is true");
  }
  
  // Test in loops
  console.log("");
  console.log("Using <= in while loop:");
  let i = 0;
  while (i <= 3) {
    console.log("  i = " + i);
    i = i + 1;
  }
  
  // Test strict equality
  console.log("");
  console.log("--- Strict Equality (===) ---");
  const num = 5;
  const str = "5";
  
  if (num == str) {
    console.log("✓ 5 == '5' is true (type coercion)");
  }
  
  if (num === 5) {
    console.log("✓ 5 === 5 is true");
  }
  
  if (str === "5") {
    console.log("✓ '5' === '5' is true");
  }
  
  if (!(num === str)) {
    console.log("✓ 5 === '5' is false (no type coercion)");
  }
  
  // Test strict inequality
  console.log("");
  console.log("--- Strict Inequality (!==) ---");
  
  if (num !== str) {
    console.log("✓ 5 !== '5' is true");
  }
  
  if (!(num !== 5)) {
    console.log("✓ 5 !== 5 is false");
  }
  
  const nullVal = null;
  const zero = 0;
  
  if (nullVal == zero) {
    console.log("✗ null == 0 should be false!");
  } else {
    console.log("✓ null == 0 is false");
  }
  
  if (nullVal !== zero) {
    console.log("✓ null !== 0 is true");
  }
  
  // Complex expression with all operators
  console.log("");
  console.log("--- Complex Expressions ---");
  const score = CC("Enter a test score (0-100):");
  
  if (score >= 90) {
    console.log("Grade: A");
  } else if (score >= 80) {
    console.log("Grade: B");
  } else if (score >= 70) {
    console.log("Grade: C");
  } else if (score >= 60) {
    console.log("Grade: D");
  } else {
    console.log("Grade: F");
  }
  
  // Check if score is divisible by 10
  if (score % 10 === 0) {
    console.log("Score is a multiple of 10!");
  } else {
    const remainder = score % 10;
    console.log("Score has remainder " + remainder + " when divided by 10");
  }
  
  // Array operations with new operators
  console.log("");
  console.log("--- Arrays with New Operators ---");
  const numbers = [15, 20, 25, 30, 35];
  let count = 0;
  let sum = 0;
  
  // Count numbers >= 25
  let idx = 0;
  while (idx < numbers.length) {
    if (numbers[idx] >= 25) {
      count = count + 1;
    }
    sum = sum + numbers[idx];
    idx = idx + 1;
  }
  
  console.log("Numbers >= 25: " + count);
  console.log("Sum: " + sum);
  console.log("Average: " + (sum / numbers.length));
  
  // Check array length with strict equality
  if (numbers.length === 5) {
    console.log("✓ Array has exactly 5 elements");
  }
  
  console.log("");
  console.log("=== All New Operators Working! ===");
  console.log("✓ Modulo (%)");
  console.log("✓ Less than or equal (<=)");
  console.log("✓ Greater than or equal (>=)");
  console.log("✓ Strict equality (===)");
  console.log("✓ Strict inequality (!==)");
}
main();