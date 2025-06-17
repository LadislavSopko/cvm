function main() {
  const name = "World";
  console.log("Hello, " + name + "!");
  
  const response = CC("What should I say next?");
  console.log("You said: " + response);
  
  console.log("Goodbye!");
}

main();