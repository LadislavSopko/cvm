function main() {
  console.log("Step 1: Creating empty object");
  const obj = {};
  console.log("Step 2: Object created");
  
  console.log("Step 3: Setting property x");
  obj.x = 5;
  console.log("Step 4: Property set");
  
  console.log("Step 5: Reading property");
  console.log("x = " + obj.x);
  
  console.log("Step 6: Stringifying");
  const json = JSON.stringify(obj);
  console.log("Step 7: JSON = " + json);
  
  return json;
}

main();