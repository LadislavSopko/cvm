function main() {
  console.log("=== Unary Operators Test ===");
  
  // Unary minus
  console.log("");
  console.log("Unary minus (-x):");
  const positive = 42;
  const negative = -positive;
  console.log("positive: " + positive);
  console.log("-positive: " + negative);
  
  const expr = -(10 + 5);
  console.log("-(10 + 5) = " + expr);
  
  // Unary plus
  console.log("");
  console.log("Unary plus (+x) for type conversion:");
  const str = "123";
  const num = +str;
  console.log("str: '" + str + "' (type: " + typeof str + ")");
  console.log("+str: " + num + " (type: " + typeof num + ")");
  
  const bool = true;
  const boolAsNum = +bool;
  console.log("true as number: " + boolAsNum);
  
  const empty = "";
  const emptyAsNum = +empty;
  console.log("empty string as number: " + emptyAsNum);
  
  // Pre-increment and pre-decrement
  console.log("");
  console.log("Pre-increment (++x) and pre-decrement (--x):");
  let i = 5;
  console.log("i = " + i);
  const j = ++i;
  console.log("j = ++i → j = " + j + ", i = " + i);
  
  let k = 10;
  console.log("k = " + k);
  const l = --k;
  console.log("l = --k → l = " + l + ", k = " + k);
  
  // Post-increment and post-decrement
  console.log("");
  console.log("Post-increment (x++) and post-decrement (x--):");
  let m = 5;
  console.log("m = " + m);
  const n = m++;
  console.log("n = m++ → n = " + n + ", m = " + m);
  
  let p = 10;
  console.log("p = " + p);
  const q = p--;
  console.log("q = p-- → q = " + q + ", p = " + p);
  
  // In loops
  console.log("");
  console.log("Using increment in loop:");
  let count = 0;
  while (count < 3) {
    console.log("count: " + count);
    count++;
  }
  console.log("Final count: " + count);
  
  // Complex expressions
  console.log("");
  console.log("Complex expressions:");
  let x = 5;
  const result1 = -x + 10;
  console.log("-5 + 10 = " + result1);
  
  const result2 = +(x > 3);  // Convert boolean to number
  console.log("+(5 > 3) = " + result2);
  
  // User input conversion
  console.log("");
  console.log("User input conversion:");
  const userInput = CC("Enter a number:");
  const userNumber = +userInput;
  console.log("You entered: '" + userInput + "'");
  console.log("As number: " + userNumber);
  console.log("Type: " + typeof userNumber);
  
  const doubled = userNumber * 2;
  console.log("Doubled: " + doubled);
  
  // Pre vs Post increment difference
  console.log("");
  console.log("Pre vs Post increment in expressions:");
  let a = 5;
  let b = 5;
  const preResult = 10 + ++a;
  const postResult = 10 + b++;
  console.log("10 + ++a (a was 5) = " + preResult + ", a is now " + a);
  console.log("10 + b++ (b was 5) = " + postResult + ", b is now " + b);
  
  // Decrement to zero
  console.log("");
  console.log("Countdown with decrement:");
  let countdown = 3;
  while (countdown > 0) {
    console.log("T-" + countdown);
    countdown--;
  }
  console.log("Liftoff!");
  
  console.log("");
  console.log("=== All unary operator tests complete! ===");
}
main();