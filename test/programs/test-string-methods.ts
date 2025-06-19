function main() {
  console.log("Testing string methods...");
  
  // Test substring
  const str = "Hello, World!";
  const sub1 = str.substring(7, 12);
  console.log("substring(7, 12): " + sub1); // "World"
  
  const sub2 = str.substring(7);
  console.log("substring(7): " + sub2); // "World!"
  
  // Test indexOf
  const index1 = str.indexOf("World");
  console.log("indexOf('World'): " + index1); // 7
  
  const index2 = str.indexOf("xyz");
  console.log("indexOf('xyz'): " + index2); // -1
  
  const index3 = str.indexOf("");
  console.log("indexOf(''): " + index3); // 0
  
  // Test split
  const csv = "apple,banana,cherry";
  const parts = csv.split(",");
  console.log("split(',') length: " + parts.length); // 3
  console.log("First part: " + parts[0]); // "apple"
  console.log("Second part: " + parts[1]); // "banana"
  console.log("Third part: " + parts[2]); // "cherry"
  
  // Test split with empty delimiter
  const word = "Hello";
  const chars = word.split("");
  console.log("split('') length: " + chars.length); // 5
  console.log("First char: " + chars[0]); // "H"
  console.log("Last char: " + chars[4]); // "o"
  
  // Test chained methods
  const result = str.substring(0, 5).indexOf("llo");
  console.log("Chained result: " + result); // 2
  
  // Test with variable
  const delimiter = " ";
  const words = str.split(delimiter);
  console.log("Words count: " + words.length); // 2
  
  console.log("All string method tests completed!");
  
  return "success";
}

main();