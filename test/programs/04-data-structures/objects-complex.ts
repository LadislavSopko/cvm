function main() {
  console.log("Starting object test...");
  const counts = [];
  let total = 0;
  
  // Use multiple CC calls instead of a loop
  console.log("Round 1");
  const response1 = CC("Round 1: What number should we add?");
  const num1 = +response1;
  counts.push({
    round: 1,
    value: num1,
    runningTotal: total + num1
  });
  total = total + num1;
  console.log("Added " + num1 + ", total is now: " + total);
  
  console.log("Round 2");
  const response2 = CC("Round 2: What number should we add?");
  const num2 = +response2;
  counts.push({
    round: 2,
    value: num2,
    runningTotal: total + num2
  });
  total = total + num2;
  console.log("Added " + num2 + ", total is now: " + total);
  
  console.log("Round 3");
  const response3 = CC("Round 3: What number should we add?");
  const num3 = +response3;
  counts.push({
    round: 3,
    value: num3,
    runningTotal: total + num3
  });
  total = total + num3;
  console.log("Added " + num3 + ", total is now: " + total);
  
  // Create final report
  console.log("Creating report...");
  console.log("Counts array length: " + counts.length);
  console.log("Total: " + total);
  
  const report = {
    rounds: counts,
    finalTotal: total,
    average: total / 3
  };
  
  console.log("Report created, attempting to stringify...");
  const reportJson = JSON.stringify(report);
  console.log("Final report: " + reportJson);
  return reportJson;
}

main();