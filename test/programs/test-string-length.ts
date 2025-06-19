function main() {
  console.log("Testing string length property");
  
  let text = "hello";
  console.log("Text: " + text);
  console.log("Type of text: " + typeof text);
  
  // Try to access length
  console.log("Attempting to access text.length...");
  let len = text.length;
  console.log("Length: " + len);
}
main();