function main() {
  console.log("Testing CC with objects");
  
  const response = CC("Enter a number");
  const num = +response;
  console.log("Got: " + num);
  
  const obj = {
    value: num
  };
  console.log("Object: " + JSON.stringify(obj));
  
  const arr = [];
  arr.push(obj);
  console.log("Array: " + JSON.stringify(arr));
  
  return JSON.stringify(arr);
}

main();