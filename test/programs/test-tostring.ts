function main() {
  console.log("=== Testing toString() Method ===");
  
  // Test on different types
  console.log("String: " + "hello".toString());
  console.log("Number: " + (42).toString());
  console.log("Boolean true: " + true.toString());
  console.log("Boolean false: " + false.toString());
  
  // Test with variables
  const num = 123;
  const str = "world";
  const bool = true;
  const arr = [1, 2, 3];
  const obj = { a: 1, b: 2 };
  const nothing = null;
  
  console.log("Variable num: " + num.toString());
  console.log("Variable str: " + str.toString());
  console.log("Variable bool: " + bool.toString());
  console.log("Variable arr: " + arr.toString());
  console.log("Variable obj: " + obj.toString());
  console.log("Variable null: " + nothing.toString());
  
  // Test in expressions
  const result = "The answer is: " + (6 * 7).toString();
  console.log(result);
  
  // Test chaining
  const len = "hello".toString().length;
  console.log("Length of 'hello' string: " + len);
  
  console.log("=== All toString() tests complete ===");
}

main();