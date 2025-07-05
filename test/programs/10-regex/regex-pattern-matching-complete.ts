function main() {
  console.log("=== Complete RegExp Pattern Matching E2E Test ===");
  
  // Test all three methods with practical examples
  console.log("\n--- RegExp.test() Method ---");
  
  var emailPattern = /\w+@\w+\.\w+/;
  var validEmail = "user@example.com";
  var invalidEmail = "not-an-email";
  
  var isValidEmail = emailPattern.test(validEmail);
  var isInvalidEmail = emailPattern.test(invalidEmail);
  
  console.log("✓ Email pattern: " + emailPattern.source);
  console.log("✓ Valid email test: " + (isValidEmail ? "true" : "false"));
  console.log("✓ Invalid email test: " + (isInvalidEmail ? "true" : "false"));
  
  // Case insensitive testing
  var casePattern = /hello/i;
  var mixedCase = "Hello World";
  var hasHello = casePattern.test(mixedCase);
  console.log("✓ Case insensitive test: " + (hasHello ? "true" : "false"));
  
  console.log("\n--- String.match() Method ---");
  
  var logText = "2024-01-01 ERROR: Database connection failed";
  var levelPattern = /ERROR|WARN|INFO|DEBUG/;
  var globalLevelPattern = /\d+/g;
  
  var levelMatch = logText.match(levelPattern);
  var numberMatches = logText.match(globalLevelPattern);
  var noMatch = "clean text".match(/ERROR/);
  
  console.log("✓ Log text: " + logText);
  console.log("✓ Level match found: " + (levelMatch !== null ? "true" : "false"));
  console.log("✓ Number matches count: " + (numberMatches !== null ? numberMatches.length : 0));
  console.log("✓ No match result: " + (noMatch === null ? "null" : "not null"));
  
  console.log("\n--- String.replace() with RegExp ---");
  
  var sensitiveData = "Contact john@example.com or call 555-1234";
  var emailRegex = /\w+@\w+\.\w+/g;
  var phoneRegex = /\d{3}-\d{4}/g;
  
  var hiddenEmails = sensitiveData.replace(emailRegex, "[EMAIL]");
  var hiddenPhones = hiddenEmails.replace(phoneRegex, "[PHONE]");
  var noChange = "clean text".replace(/sensitive/, "[HIDDEN]");
  
  console.log("✓ Original: " + sensitiveData);
  console.log("✓ Emails hidden: " + hiddenEmails);
  console.log("✓ All hidden: " + hiddenPhones);
  console.log("✓ No change: " + noChange);
  
  console.log("\n--- Complex Pattern Matching ---");
  
  var urlPattern = /https?:\/\/([a-zA-Z0-9.-]+)\/([a-zA-Z0-9\/_-]*)/;
  var urlText = "Visit https://example.com/docs/api for documentation";
  
  var hasUrl = urlPattern.test(urlText);
  var urlMatches = urlText.match(urlPattern);
  var maskedUrl = urlText.replace(urlPattern, "https://[DOMAIN]/[PATH]");
  
  console.log("✓ URL pattern: " + urlPattern.source);
  console.log("✓ Has URL: " + (hasUrl ? "true" : "false"));
  console.log("✓ URL matches: " + (urlMatches !== null ? urlMatches.length : 0));
  console.log("✓ Masked URL: " + maskedUrl);
  
  console.log("\n--- Flag Combinations ---");
  
  var multiText = "Test\nTEST\ntest";
  var globalIgnoreCase = /test/gi;
  var multiline = /^test/gim;
  
  var allTests = multiText.match(globalIgnoreCase);
  var lineTests = multiText.match(multiline);
  var replacedAll = multiText.replace(globalIgnoreCase, "DEMO");
  
  console.log("✓ Multi-line text: " + multiText.replace(/\n/g, "\\n"));
  console.log("✓ Global ignore case matches: " + (allTests !== null ? allTests.length : 0));
  console.log("✓ Multiline matches: " + (lineTests !== null ? lineTests.length : 0));
  console.log("✓ All replaced: " + replacedAll.replace(/\n/g, "\\n"));
  
  console.log("\n=== All RegExp Pattern Matching Tests Complete! ===");
  console.log("RegExp.test(), String.match(), and String.replace() with regex all working correctly");
  
  return 0;
}