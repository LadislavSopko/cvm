function main() {
  let current = 1;
  while (current <= 5) {
    const next = CC("Give next number:");
    console.log("You answered: " + next);
    current = +next;
  }
  console.log("Done!");
}