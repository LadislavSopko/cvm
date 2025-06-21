function main() {
  console.log("Testing multiple CC with objects");
  const arr = [];
  
  const r1 = CC("First number?");
  console.log("Got: " + r1);
  arr.push({ num: +r1 });
  console.log("Array: " + JSON.stringify(arr));
  
  const r2 = CC("Second number?");
  console.log("Got: " + r2);
  arr.push({ num: +r2 });
  console.log("Array: " + JSON.stringify(arr));
  
  const r3 = CC("Third number?");
  console.log("Got: " + r3);
  arr.push({ num: +r3 });
  console.log("Array: " + JSON.stringify(arr));
  
  return JSON.stringify(arr);
}

main();