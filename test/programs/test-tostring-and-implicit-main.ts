function main() {
  // Test toString() on various types
  console.log("Testing toString():");
  console.log((42).toString());
  console.log(true.toString());
  console.log("hello".toString());
  
  const arr = [1, 2, 3];
  console.log(arr.toString());
  
  const obj = { name: "test", value: 123 };
  console.log(obj.toString());
  
  // Test that main() is called implicitly (no main() call at end)
  console.log("Main executed without explicit call!");
}