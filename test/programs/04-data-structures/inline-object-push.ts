function main() {
  console.log("Testing inline object push");
  
  const arr = [];
  
  // Test inline object creation in push
  arr.push({
    round: 1,
    value: 5
  });
  console.log("Pushed inline object");
  console.log("Array: " + JSON.stringify(arr));
  
  arr.push({
    round: 2,
    value: 10
  });
  console.log("Pushed second object");
  console.log("Array: " + JSON.stringify(arr));
  
  return JSON.stringify(arr);
}

main();