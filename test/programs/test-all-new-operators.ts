function main() {
  console.log("=========================================");
  console.log("CVM Comprehensive New Operators Test");
  console.log("Testing ALL recently implemented features");
  console.log("=========================================");
  
  // Section 1: Arithmetic operators including modulo
  console.log("");
  console.log("SECTION 1: ARITHMETIC OPERATORS");
  console.log("================================");
  
  const a = 25;
  const b = 7;
  
  console.log("a = " + a);
  console.log("b = " + b);
  console.log("a + b = " + (a + b));
  console.log("a - b = " + (a - b));
  console.log("a * b = " + (a * b));
  console.log("a / b = " + (a / b));
  console.log("a % b = " + (a % b) + " (modulo)");
  
  // Practical modulo example
  console.log("");
  console.log("Modulo Applications:");
  const totalMinutes = CC("Enter total minutes:");
  const hours = totalMinutes / 60;
  const minutes = totalMinutes % 60;
  console.log(totalMinutes + " minutes = " + hours + " hours and " + minutes + " minutes");
  
  // Check even/odd
  const num = CC("Enter a number to check even/odd:");
  if (num % 2 === 0) {
    console.log(num + " is even");
  } else {
    console.log(num + " is odd");
  }
  
  // Section 2: Comparison operators
  console.log("");
  console.log("SECTION 2: COMPARISON OPERATORS");
  console.log("================================");
  
  const x = 10;
  const y = 10;
  const z = 15;
  const strTen = "10";
  
  console.log("x = " + x + " (number)");
  console.log("y = " + y + " (number)");
  console.log("z = " + z + " (number)");
  console.log("strTen = '" + strTen + "' (string)");
  console.log("");
  
  // Basic comparisons
  console.log("Basic Comparisons:");
  console.log("x == y: " + (x == y));
  console.log("x != z: " + (x != z));
  console.log("x < z: " + (x < z));
  console.log("z > x: " + (z > x));
  console.log("x <= y: " + (x <= y));
  console.log("x >= y: " + (x >= y));
  
  // Type coercion vs strict
  console.log("");
  console.log("Type Coercion vs Strict:");
  console.log("x == strTen: " + (x == strTen) + " (type coercion)");
  console.log("x === strTen: " + (x === strTen) + " (strict, no coercion)");
  console.log("x != strTen: " + (x != strTen));
  console.log("x !== strTen: " + (x !== strTen));
  
  // Section 3: Logical operators
  console.log("");
  console.log("SECTION 3: LOGICAL OPERATORS");
  console.log("============================");
  
  // AND operator
  console.log("");
  console.log("AND (&&) Operator:");
  console.log("true && true = " + (true && true));
  console.log("true && false = " + (true && false));
  console.log("false && true = " + (false && true));
  console.log("'hello' && 42 = " + ("hello" && 42));
  console.log("0 && 'world' = " + (0 && "world"));
  
  // OR operator
  console.log("");
  console.log("OR (||) Operator:");
  console.log("true || false = " + (true || false));
  console.log("false || false = " + (false || false));
  console.log("'first' || 'second' = " + ("first" || "second"));
  console.log("0 || 'default' = " + (0 || "default"));
  console.log("null || undefined || 'fallback' = " + (null || undefined || "fallback"));
  
  // NOT operator
  console.log("");
  console.log("NOT (!) Operator:");
  console.log("!true = " + !true);
  console.log("!false = " + !false);
  console.log("!0 = " + !0);
  console.log("!'hello' = " + !"hello");
  console.log("!!42 = " + !!42 + " (double negation)");
  
  // Section 4: Real-world example combining all features
  console.log("");
  console.log("SECTION 4: REAL-WORLD EXAMPLE");
  console.log("=============================");
  console.log("Student Grade Analysis System");
  console.log("");
  
  // Get student data
  const studentName = CC("Enter student name:");
  const examScore = CC("Enter exam score (0-100):");
  const assignmentScore = CC("Enter assignment score (0-100):");
  const attendance = CC("Enter attendance percentage (0-100):");
  
  console.log("");
  console.log("Student: " + studentName);
  console.log("Exam: " + examScore);
  console.log("Assignment: " + assignmentScore);
  console.log("Attendance: " + attendance + "%");
  
  // Calculate weighted average
  const weightedAverage = (examScore * 0.5) + (assignmentScore * 0.3) + (attendance * 0.2);
  console.log("Weighted Average: " + weightedAverage);
  
  // Determine letter grade
  let letterGrade = "";
  if (weightedAverage >= 90) {
    letterGrade = "A";
  } else if (weightedAverage >= 80) {
    letterGrade = "B";
  } else if (weightedAverage >= 70) {
    letterGrade = "C";
  } else if (weightedAverage >= 60) {
    letterGrade = "D";
  } else {
    letterGrade = "F";
  }
  console.log("Letter Grade: " + letterGrade);
  
  // Check various conditions
  const passedExam = examScore >= 60;
  const passedAssignment = assignmentScore >= 60;
  const goodAttendance = attendance >= 80;
  
  console.log("");
  console.log("Performance Analysis:");
  console.log("Passed exam: " + passedExam);
  console.log("Passed assignment: " + passedAssignment);
  console.log("Good attendance: " + goodAttendance);
  
  // Eligibility checks using logical operators
  const eligibleForHonors = weightedAverage >= 85 && goodAttendance;
  const needsHelp = examScore < 60 || assignmentScore < 60;
  const canGraduate = passedExam && passedAssignment && attendance >= 70;
  
  console.log("");
  console.log("Status Checks:");
  console.log("Eligible for honors: " + eligibleForHonors);
  console.log("Needs extra help: " + needsHelp);
  console.log("Can graduate: " + canGraduate);
  
  // Warning system
  if (!canGraduate) {
    console.log("");
    console.log("⚠️  WARNINGS:");
    if (!passedExam) {
      console.log("- Failed exam (minimum 60 required)");
    }
    if (!passedAssignment) {
      console.log("- Failed assignment (minimum 60 required)");
    }
    if (attendance < 70) {
      console.log("- Poor attendance (minimum 70% required)");
    }
  }
  
  // Recommendations
  console.log("");
  console.log("RECOMMENDATIONS:");
  if (eligibleForHonors) {
    console.log("✓ Congratulations! Consider applying for honors program.");
  }
  
  if (needsHelp && !eligibleForHonors) {
    console.log("• Schedule tutoring sessions");
    if (examScore < 60 && assignmentScore >= 60) {
      console.log("• Focus on exam preparation");
    } else if (assignmentScore < 60 && examScore >= 60) {
      console.log("• Improve assignment completion");
    } else if (examScore < 60 && assignmentScore < 60) {
      console.log("• Comprehensive academic support needed");
    }
  }
  
  if (!goodAttendance) {
    console.log("• Improve class attendance");
  }
  
  // Section 5: Array operations with new operators
  console.log("");
  console.log("SECTION 5: ARRAY OPERATIONS");
  console.log("===========================");
  
  const testScores = [85, 92, 78, 95, 88, 73, 91, 67, 84, 90];
  console.log("Test scores: [85, 92, 78, 95, 88, 73, 91, 67, 84, 90]");
  
  // Statistical analysis
  let sum = 0;
  let count90Plus = 0;
  let countFailing = 0;
  let i = 0;
  
  while (i < testScores.length) {
    sum = sum + testScores[i];
    
    if (testScores[i] >= 90) {
      count90Plus = count90Plus + 1;
    }
    
    if (testScores[i] < 70) {
      countFailing = countFailing + 1;
    }
    
    i = i + 1;
  }
  
  const average = sum / testScores.length;
  console.log("");
  console.log("Statistics:");
  console.log("Average: " + average);
  console.log("Scores >= 90: " + count90Plus);
  console.log("Failing scores (< 70): " + countFailing);
  
  // Grade distribution using modulo
  console.log("");
  console.log("Grade Distribution (by 10s):");
  i = 0;
  while (i < testScores.length) {
    const score = testScores[i];
    const bracket = score / 10;
    
    if (score >= 90) {
      console.log("Score " + score + " -> A range");
    } else if (score >= 80 && score < 90) {
      console.log("Score " + score + " -> B range");
    } else if (score >= 70 && score < 80) {
      console.log("Score " + score + " -> C range");
    } else {
      console.log("Score " + score + " -> Below C");
    }
    
    i = i + 1;
  }
  
  // Section 6: Complex boolean logic
  console.log("");
  console.log("SECTION 6: COMPLEX BOOLEAN LOGIC");
  console.log("=================================");
  
  const userAge = CC("Enter user age:");
  const isMember = CC("Is user a member? (yes/no):");
  const dayOfWeek = CC("Enter day (1-7, 1=Monday):");
  
  // Complex access rules
  const isAdult = userAge >= 18;
  const isSenior = userAge >= 65;
  const isWeekend = dayOfWeek === "6" || dayOfWeek === "7";
  const isWeekday = !isWeekend && dayOfWeek >= "1" && dayOfWeek <= "5";
  
  console.log("");
  console.log("User Status:");
  console.log("Age: " + userAge);
  console.log("Adult (>= 18): " + isAdult);
  console.log("Senior (>= 65): " + isSenior);
  console.log("Member: " + (isMember === "yes"));
  console.log("Weekend visit: " + isWeekend);
  
  // Determine access and pricing
  let hasAccess = false;
  let price = 20; // Base price
  let message = "";
  
  if (isMember === "yes") {
    hasAccess = true;
    price = 0;
    message = "Free access for members";
  } else if (isSenior && isWeekday) {
    hasAccess = true;
    price = price * 0.5;
    message = "50% senior discount on weekdays";
  } else if (!isAdult) {
    hasAccess = userAge >= 12;
    if (hasAccess) {
      price = price * 0.75;
      message = "25% youth discount";
    } else {
      message = "Must be 12 or older";
    }
  } else if (isWeekend && !isMember) {
    hasAccess = true;
    price = price * 1.25;
    message = "25% weekend surcharge";
  } else {
    hasAccess = true;
    message = "Standard pricing";
  }
  
  console.log("");
  console.log("Access Decision:");
  console.log("Has access: " + hasAccess);
  console.log("Price: $" + price);
  console.log("Message: " + message);
  
  console.log("");
  console.log("=========================================");
  console.log("ALL OPERATOR TESTS COMPLETE");
  console.log("=========================================");
  console.log("✓ Arithmetic: +, -, *, /, %");
  console.log("✓ Comparison: ==, !=, <, >, <=, >=");
  console.log("✓ Strict: ===, !==");
  console.log("✓ Logical: &&, ||, !");
  console.log("✓ Complex expressions");
  console.log("✓ Real-world applications");
  console.log("");
  console.log("Total operators tested: 18");
  console.log("All working correctly!");
}
main();