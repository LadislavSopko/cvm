function main() {
  let count = 0;
  while (count < 5) {
    const next = CC("Current number is " + count + ". What's the next number? Please respond with just the number.");
    count = +next;  // Use unary plus instead of parseInt
    console.log("Count is now: " + count);
  }
  return count;  // Returns 5
}
main();