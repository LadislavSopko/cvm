function main() {
  console.log("Testing object with variables");
  
  const arr = [];
  const total = 0;
  const num1 = 5;
  
  const obj = {
    round: 1,
    value: num1,
    runningTotal: total + num1
  };
  
  console.log("Object created: " + JSON.stringify(obj));
  arr.push(obj);
  console.log("Pushed to array");
  
  const report = {
    items: arr,
    total: total + num1
  };
  
  console.log("Report: " + JSON.stringify(report));
  
  return JSON.stringify(report);
}

main();