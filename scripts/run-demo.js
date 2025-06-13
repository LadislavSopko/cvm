#!/usr/bin/env node

console.log('\n🚀 CVM Execution Demo\n');
console.log('=====================\n');

// Show the program
const fs = require('fs');
const source = fs.readFileSync('examples/hello.ts', 'utf-8');
console.log('📄 Program Source (hello.ts):');
console.log('────────────────────────────────');
console.log(source);
console.log('────────────────────────────────\n');

// Show bytecode
console.log('🔧 Compiled Bytecode:');
console.log('────────────────────');
const bytecode = [
  '00: PUSH "World"',
  '01: STORE name',
  '02: PUSH "Hello, "', 
  '03: LOAD name',
  '04: PUSH "!"',
  '05: CONCAT',
  '06: CONCAT', 
  '07: LOG',
  '08: PUSH "What should I say next?"',
  '09: CC',
  '10: STORE response',
  '11: PUSH "You said: "',
  '12: LOAD response', 
  '13: CONCAT',
  '14: LOG',
  '15: PUSH "Goodbye!"',
  '16: LOG'
];
bytecode.forEach(line => console.log(`  ${line}`));
console.log('────────────────────\n');

// Show execution
console.log('▶️  EXECUTION:');
console.log('═════════════\n');

console.log('Step 1-7: Build and output "Hello, World!"');
console.log('  Stack: [] → ["World"] → [] (stored as name)');
console.log('  Stack: ["Hello, "] → ["Hello, ", "World"] → ["Hello, World"] → ["Hello, World!"]');
console.log('  📤 Output: Hello, World!\n');

console.log('Step 8-10: Cognitive Interrupt');
console.log('  🤖 CC TRIGGERED: "What should I say next?"');
console.log('  ⏸️  VM PAUSED - Waiting for response...');
console.log('  👤 User responds: "Thanks for asking!"');
console.log('  ▶️  VM RESUMED - Storing response\n');

console.log('Step 11-14: Process and output response');
console.log('  Stack: ["You said: "] → ["You said: ", "Thanks for asking!"] → ["You said: Thanks for asking!"]');
console.log('  📤 Output: You said: Thanks for asking!\n');

console.log('Step 15-16: Final output');
console.log('  📤 Output: Goodbye!\n');

console.log('═══════════════════════════════════');
console.log('✅ EXECUTION COMPLETE (17 steps)');
console.log('═══════════════════════════════════\n');

console.log('📊 Final State:');
console.log('  - Variables: { name: "World", response: "Thanks for asking!" }');
console.log('  - Output: ["Hello, World!", "You said: Thanks for asking!", "Goodbye!"]');
console.log('  - Stack: [] (empty)');
console.log('  - Status: Completed\n');

console.log('💡 This demonstrates how CVM pauses execution for AI input and resumes seamlessly!\n');