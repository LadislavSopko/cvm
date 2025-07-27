function main() {
  console.log("=== Debug Heap Regex Storage ===");
  
  var pattern = /hello/g;
  
  console.log("Pattern created:");
  console.log("  pattern.source: " + pattern.source);
  console.log("  pattern.flags: " + pattern.flags);
  console.log("  pattern.global: " + pattern.global);
  console.log("  typeof pattern: " + typeof pattern);
  
  // Try accessing properties separately to see if heap storage works
  var source = pattern.source;
  var flags = pattern.flags;
  var global = pattern.global;
  
  console.log("After property access:");
  console.log("  source: " + source);
  console.log("  flags: " + flags);
  console.log("  global: " + global);
  
  // Now try the replace operation
  var text = "hello world hello universe";
  console.log("Original text: " + text);
  
  var result = text.replace(pattern, "hi");
  console.log("Replace result: " + result);
  
  return 0;
}