function main() {
  console.log("Test array indexing");
  const arr = [10, 20, 30];
  console.log("Array created");
  
  // Test direct index
  console.log("Direct access:");
  console.log(arr[0]);
  console.log(arr[1]);
  console.log(arr[2]);
  
  // Test with variable
  console.log("Variable access:");
  let i = 0;
  console.log(arr[i]);
  i = 1;
  console.log(arr[i]);
  i = 2;
  console.log(arr[i]);
  
  console.log("Done");
}
main();