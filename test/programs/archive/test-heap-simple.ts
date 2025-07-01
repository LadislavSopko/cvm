function main() {
  console.log("Testing simple heap efficiency");
  
  // Test 1: Large array
  var arr = [];
  var i = 0;
  while (i < 10000) {
    arr.push(i);
    i = i + 1;
  }
  
  console.log("Created array with length: " + arr.length);
  CC("Large array ready");
  
  // Test 2: Nested object
  var obj = { a: { b: { c: { d: { e: "deep" } } } } };
  console.log("Created nested object");
  CC("Nested object ready");
  
  console.log("Tests complete");
  return true;
}

main();