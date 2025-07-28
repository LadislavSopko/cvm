function main() {
  console.log("=== Debug Stack for Replace Operation ===");
  
  var text = "hello world";
  var pattern = /hello/g;
  
  console.log("Before replace:");
  console.log("  text: " + text);
  console.log("  pattern type: " + typeof pattern);
  console.log("  pattern.source: " + pattern.source);
  
  // This should help us see what's happening in the stack
  // The replace operation compiles to:
  // 1. Push text (string)
  // 2. Push pattern (regex object reference)  
  // 3. Push replacement (string)
  // 4. STRING_REPLACE_REGEX opcode
  
  var result = text.replace(pattern, "hi");
  console.log("Replace result: " + result);
  
  return 0;
}