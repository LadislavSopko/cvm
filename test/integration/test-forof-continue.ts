function main() {
  console.log("Testing for-of with continue");
  
  for (const n of [1, 2, 3]) {
    if (n === 2) {
      console.log("Skipping: " + n);
      continue;
    }
    console.log("Processing: " + n);
  }
  
  console.log("Done");
}
main();