function main() {
  console.log("=== Simple Logical Operators Test ===");
  
  // AND operator
  console.log("AND tests:");
  console.log("true && true = " + (true && true));
  console.log("true && false = " + (true && false));
  console.log("'hello' && 42 = " + ("hello" && 42));
  console.log("0 && 'world' = " + (0 && "world"));
  
  // OR operator  
  console.log("");
  console.log("OR tests:");
  console.log("true || false = " + (true || false));
  console.log("false || false = " + (false || false));
  console.log("'hello' || 'world' = " + ("hello" || "world"));
  console.log("0 || 'fallback' = " + (0 || "fallback"));
  
  // NOT operator
  console.log("");
  console.log("NOT tests:");
  console.log("!true = " + !true);
  console.log("!false = " + !false);
  console.log("!'hello' = " + !"hello");
  console.log("!0 = " + !0);
  console.log("!!42 = " + !!42);
  
  // Complex expressions
  console.log("");
  console.log("Complex expressions:");
  const age = 25;
  const hasLicense = true;
  const canDrive = age >= 18 && hasLicense;
  console.log("age >= 18 && hasLicense = " + canDrive);
  
  const username = "";
  const displayName = username || "Guest";
  console.log("username || 'Guest' = " + displayName);
  
  console.log("");
  console.log("✓ All logical operators working!");
}
main();