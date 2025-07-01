function main() {
  console.log("Testing array push with objects");
  
  const arr = [];
  console.log("Empty array created");
  
  const obj1 = { x: 1 };
  console.log("Object 1 created: " + JSON.stringify(obj1));
  
  arr.push(obj1);
  console.log("Pushed object 1");
  console.log("Array length: " + arr.length);
  
  const obj2 = { x: 2 };
  console.log("Object 2 created: " + JSON.stringify(obj2));
  
  arr.push(obj2);
  console.log("Pushed object 2");
  console.log("Array length: " + arr.length);
  
  console.log("Attempting to stringify array...");
  const result = JSON.stringify(arr);
  console.log("Result: " + result);
  
  return result;
}

main();