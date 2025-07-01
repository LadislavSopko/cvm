function main() {
  console.log("Debug: Testing object persistence across CC");
  
  const obj = { x: 5 };
  console.log("Before CC: " + JSON.stringify(obj));
  
  const response = CC("Continue?");
  console.log("Response: " + response);
  
  console.log("After CC: " + JSON.stringify(obj));
  console.log("obj.x = " + obj.x);
  
  // Modify object
  obj.x = 10;
  console.log("Modified: " + JSON.stringify(obj));
  
  const response2 = CC("Continue again?");
  console.log("Response2: " + response2);
  
  console.log("After 2nd CC: " + JSON.stringify(obj));
  console.log("obj.x = " + obj.x);
  
  return "done";
}

main();