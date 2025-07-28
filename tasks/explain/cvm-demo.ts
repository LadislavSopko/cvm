function main() {
  let counter = 1;
  
  while (counter < 5) {
    const nextNumber = CC("Current number is " + counter.toString() + ". What comes next?");
    console.log("You said: " + nextNumber);
    counter = +nextNumber;
  }
  
  console.log("Counting complete!");
}