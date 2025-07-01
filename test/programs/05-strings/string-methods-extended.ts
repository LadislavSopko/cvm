function main() {
  // Test slice
  const str1 = "hello world";
  console.log(str1.slice(6));  // "world"
  console.log(str1.slice(0, 5));  // "hello"
  console.log(str1.slice(-5));  // "world"
  console.log(str1.slice(-5, -1));  // "worl"
  
  // Test charAt
  const str2 = "hello";
  console.log(str2.charAt(0));  // "h"
  console.log(str2.charAt(1));  // "e"
  console.log(str2.charAt(10)); // ""
  console.log(str2.charAt(-1)); // ""
  
  // Test toUpperCase
  const str3 = "Hello World!";
  console.log(str3.toUpperCase());  // "HELLO WORLD!"
  
  // Test toLowerCase
  const str4 = "Hello World!";
  console.log(str4.toLowerCase());  // "hello world!"
  
  // Test mixed/chained operations
  const str5 = "HELLO world";
  console.log(str5.slice(0, 5).toLowerCase());  // "hello"
  console.log(str5.slice(6).toUpperCase());      // "WORLD"
  
  // Test with variables
  const start = 2;
  const end = 7;
  const str6 = "JavaScript";
  console.log(str6.slice(start, end));  // "vaScr"
  console.log(str6.charAt(start));      // "v"
}

main();