function main() {
  console.log("====================================");
  console.log("CVM Logical Operators Test");
  console.log("Testing &&, ||, and ! operators");
  console.log("====================================");
  
  // Basic AND operator
  console.log("");
  console.log("BASIC AND (&&) OPERATOR");
  console.log("-----------------------");
  
  const hasLicense = true;
  const isAdult = true;
  const canDrive = hasLicense && isAdult;
  console.log("hasLicense: " + hasLicense);
  console.log("isAdult: " + isAdult);
  console.log("canDrive (hasLicense && isAdult): " + canDrive);
  
  // AND with falsy values
  const hasCar = false;
  const canTravel = canDrive && hasCar;
  console.log("hasCar: " + hasCar);
  console.log("canTravel (canDrive && hasCar): " + canTravel);
  
  // AND returns first falsy or last value
  console.log("");
  console.log("AND Value Return Behavior:");
  const result1 = "hello" && 42;
  console.log("'hello' && 42 = " + result1);
  
  const result2 = 0 && "world";
  console.log("0 && 'world' = " + result2);
  
  const result3 = null && true;
  console.log("null && true = " + result3);
  
  // Basic OR operator
  console.log("");
  console.log("BASIC OR (||) OPERATOR");
  console.log("----------------------");
  
  const hasCash = false;
  const hasCard = true;
  const canPay = hasCash || hasCard;
  console.log("hasCash: " + hasCash);
  console.log("hasCard: " + hasCard);
  console.log("canPay (hasCash || hasCard): " + canPay);
  
  // OR for default values
  const username = "";
  const displayName = username || "Guest";
  console.log("username: '" + username + "'");
  console.log("displayName (username || 'Guest'): " + displayName);
  
  // OR returns first truthy or last value
  console.log("");
  console.log("OR Value Return Behavior:");
  const result4 = "first" || "second";
  console.log("'first' || 'second' = " + result4);
  
  const result5 = 0 || "fallback";
  console.log("0 || 'fallback' = " + result5);
  
  const result6 = null || 0;
  console.log("null || 0 = " + result6);
  
  // NOT operator
  console.log("");
  console.log("NOT (!) OPERATOR");
  console.log("----------------");
  
  const isLoggedIn = true;
  const isGuest = !isLoggedIn;
  console.log("isLoggedIn: " + isLoggedIn);
  console.log("isGuest (!isLoggedIn): " + isGuest);
  
  // NOT with truthy/falsy values
  console.log("");
  console.log("NOT with Different Values:");
  console.log("!true = " + !true);
  console.log("!false = " + !false);
  console.log("!'hello' = " + !"hello");
  console.log("!0 = " + !0);
  console.log("!null = " + !null);
  console.log("!'' = " + !"");
  
  // Double negation
  const value = "test";
  const asBool = !!value;
  console.log("!!'" + value + "' = " + asBool);
  
  // Complex expressions with operator precedence
  console.log("");
  console.log("OPERATOR PRECEDENCE");
  console.log("-------------------");
  console.log("NOT has highest precedence, then AND, then OR");
  
  const expr1 = !false && true;
  console.log("!false && true = " + expr1);
  
  const expr2 = true || false && false;
  console.log("true || false && false = " + expr2);
  console.log("(AND evaluates first, so: true || (false && false))");
  
  const expr3 = (true || false) && false;
  console.log("(true || false) && false = " + expr3);
  console.log("(Parentheses change evaluation order)");
  
  // User input with logical operators
  console.log("");
  console.log("USER INPUT VALIDATION");
  console.log("---------------------");
  const age = CC("Enter your age:");
  const hasPermit = CC("Do you have a permit? (yes/no):");
  
  console.log("Age: " + age);
  console.log("Has permit: " + hasPermit);
  
  // Complex validation logic
  if (age >= 18 && hasPermit === "yes") {
    console.log("✓ You can take the driving test!");
  } else if (age >= 16 && age < 18 && hasPermit === "yes") {
    console.log("✓ You can practice driving with supervision");
  } else if (age < 16 || hasPermit !== "yes") {
    console.log("✗ You cannot drive yet");
    if (age < 16) {
      console.log("  - You must be at least 16");
    }
    if (hasPermit !== "yes") {
      console.log("  - You need a permit first");
    }
  }
  
  // Array filtering with logical operators
  console.log("");
  console.log("ARRAY FILTERING");
  console.log("---------------");
  const scores = [85, 92, 78, 95, 88, 73, 91];
  console.log("Scores: [85, 92, 78, 95, 88, 73, 91]");
  
  // Count scores that are >= 80 AND <= 90
  let count = 0;
  let i = 0;
  while (i < scores.length) {
    if (scores[i] >= 80 && scores[i] <= 90) {
      console.log("Score " + scores[i] + " is in range [80-90]");
      count = count + 1;
    }
    i = i + 1;
  }
  console.log("Total scores in range [80-90]: " + count);
  
  // Find excellent (>= 95) OR needs improvement (< 75)
  console.log("");
  console.log("Extreme scores (>= 95 OR < 75):");
  i = 0;
  while (i < scores.length) {
    if (scores[i] >= 95 || scores[i] < 75) {
      const status = scores[i] >= 95 ? "Excellent" : "Needs work";
      console.log("Score " + scores[i] + " - " + status);
    }
    i = i + 1;
  }
  
  // Password validation example
  console.log("");
  console.log("PASSWORD VALIDATION");
  console.log("-------------------");
  const password = CC("Enter a password:");
  const confirmPassword = CC("Confirm password:");
  
  const isLongEnough = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const isValid = isLongEnough && passwordsMatch;
  
  console.log("Password length: " + password.length);
  console.log("Length >= 8: " + isLongEnough);
  console.log("Passwords match: " + passwordsMatch);
  console.log("Valid password: " + isValid);
  
  if (!isValid) {
    console.log("Password issues:");
    if (!isLongEnough) {
      console.log("- Must be at least 8 characters");
    }
    if (!passwordsMatch) {
      console.log("- Passwords do not match");
    }
  } else {
    console.log("✓ Password accepted!");
  }
  
  // Game logic example
  console.log("");
  console.log("GAME LOGIC EXAMPLE");
  console.log("------------------");
  const health = CC("Enter player health (0-100):");
  const hasShield = CC("Does player have shield? (yes/no):");
  const enemyDamage = 30;
  
  console.log("Player health: " + health);
  console.log("Has shield: " + hasShield);
  console.log("Incoming damage: " + enemyDamage);
  
  const isAlive = health > 0;
  const canSurviveHit = health > enemyDamage || hasShield === "yes";
  
  if (isAlive && canSurviveHit) {
    console.log("✓ Player survives the attack!");
    if (hasShield === "yes" && health <= enemyDamage) {
      console.log("  Shield saved you!");
    }
  } else if (!isAlive) {
    console.log("✗ Player is already defeated");
  } else {
    console.log("✗ Player will be defeated by this attack");
  }
  
  // Nested logical expressions
  console.log("");
  console.log("COMPLEX NESTED LOGIC");
  console.log("--------------------");
  const day = CC("Enter day of week (1-7):");
  const hour = CC("Enter hour (0-23):");
  
  const isWeekday = day >= 1 && day <= 5;
  const isWeekend = day == 6 || day == 7;
  const isBusinessHours = hour >= 9 && hour < 17;
  const isOpen = isWeekday && isBusinessHours || isWeekend && hour >= 10 && hour < 16;
  
  console.log("Day " + day + " at hour " + hour);
  console.log("Is weekday: " + isWeekday);
  console.log("Is weekend: " + isWeekend);
  console.log("Is business hours: " + isBusinessHours);
  console.log("Store is open: " + isOpen);
  
  if (isOpen) {
    console.log("✓ Store is OPEN");
  } else {
    console.log("✗ Store is CLOSED");
    if (!isWeekday && !isWeekend) {
      console.log("  Invalid day entered");
    } else if (isWeekday && !isBusinessHours) {
      console.log("  Weekday hours: 9 AM - 5 PM");
    } else if (isWeekend && (hour < 10 || hour >= 16)) {
      console.log("  Weekend hours: 10 AM - 4 PM");
    }
  }
  
  console.log("");
  console.log("====================================");
  console.log("LOGICAL OPERATORS TEST COMPLETE");
  console.log("====================================");
  console.log("✓ AND operator (&&)");
  console.log("✓ OR operator (||)");
  console.log("✓ NOT operator (!)");
  console.log("✓ Operator precedence");
  console.log("✓ Complex nested expressions");
  console.log("✓ Practical use cases");
}
main();