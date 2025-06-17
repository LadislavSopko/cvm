function main() {
  console.log("Let's count together!");
  console.log("Starting with: 1");
  
  const num1 = CC("Say next number after 1");
  console.log("Next number: " + num1);
  
  const num2 = CC("Say next number after " + num1);
  console.log("Next number: " + num2);
  
  const num3 = CC("Say next number after " + num2);
  console.log("Next number: " + num3);
  
  console.log("Great counting! We went from 1 to " + num3);
}

main();