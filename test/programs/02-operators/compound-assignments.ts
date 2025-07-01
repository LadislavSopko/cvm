function main() {
  console.log("=== Compound Assignment Operators Test ===");
  
  // Addition assignment
  console.log("");
  console.log("Addition assignment (+=):");
  let x = 10;
  console.log("x = " + x);
  x += 5;
  console.log("x += 5 → x = " + x);
  
  // String concatenation with +=
  let msg = "Hello";
  console.log("");
  console.log("String concatenation:");
  console.log("msg = '" + msg + "'");
  msg += " World";
  console.log("msg += ' World' → msg = '" + msg + "'");
  
  // Subtraction assignment
  console.log("");
  console.log("Subtraction assignment (-=):");
  let y = 20;
  console.log("y = " + y);
  y -= 8;
  console.log("y -= 8 → y = " + y);
  
  // Multiplication assignment
  console.log("");
  console.log("Multiplication assignment (*=):");
  let z = 5;
  console.log("z = " + z);
  z *= 3;
  console.log("z *= 3 → z = " + z);
  
  // Division assignment
  console.log("");
  console.log("Division assignment (/=):");
  let a = 20;
  console.log("a = " + a);
  a /= 4;
  console.log("a /= 4 → a = " + a);
  
  // Modulo assignment
  console.log("");
  console.log("Modulo assignment (%=):");
  let b = 17;
  console.log("b = " + b);
  b %= 5;
  console.log("b %= 5 → b = " + b);
  
  // Complex expressions
  console.log("");
  console.log("Complex expressions:");
  let c = 10;
  let d = 5;
  console.log("c = " + c + ", d = " + d);
  c += d * 2;
  console.log("c += d * 2 → c = " + c);
  
  // Multiple compound assignments
  console.log("");
  console.log("Multiple compound assignments:");
  let e = 100;
  console.log("e = " + e);
  e -= 10;
  console.log("e -= 10 → e = " + e);
  e *= 2;
  console.log("e *= 2 → e = " + e);
  e /= 3;
  console.log("e /= 3 → e = " + e);
  
  // In loops
  console.log("");
  console.log("Using compound assignments in loops:");
  let sum = 0;
  let i = 1;
  while (i <= 5) {
    sum += i;
    console.log("i = " + i + ", sum += i → sum = " + sum);
    i++;
  }
  console.log("Final sum: " + sum);
  
  // Combining with other operators
  console.log("");
  console.log("Combining with increment:");
  let f = 10;
  console.log("f = " + f);
  f += ++f;  // f becomes 11, then 11 + 11 = 22
  console.log("f += ++f → f = " + f);
  
  console.log("");
  console.log("=== All compound assignment tests complete! ===");
}
main();