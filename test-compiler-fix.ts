import { compile } from './packages/parser/src/lib/compiler.js';

// Test program that previously failed
const testSource = `
function main() {
  console.log("Testing for-of loop with multiple continue statements");
  
  let items = ["item1", "item2", "item3"];
  
  for (const item of items) {
    console.log("Processing: " + item);
    
    if (item === "item1") {
      console.log("Skipping item1");
      continue;
    }
    
    if (item === "item2") {
      console.log("Skipping item2");
      continue;
    }
    
    if (item === "item3") {
      console.log("Skipping item3");  
      continue;
    }
    
    console.log("Processing completed for: " + item);
  }
  
  console.log("Loop completed");
}
`;

console.log('Testing compiler fix...');
const result = compile(testSource);

if (!result.success) {
  console.log('Compilation failed:');
  result.errors.forEach(err => {
    console.log(`  Error: ${err.message} at line ${err.line}, char ${err.character}`);
  });
} else {
  console.log('Compilation successful!');
  console.log(`Generated ${result.bytecode.length} instructions`);
  
  // Find the for-of loop instructions
  let foundIterStart = false;
  let jumpIfFalseInstr = null;
  let iterEndIndex = -1;
  
  for (let i = 0; i < result.bytecode.length; i++) {
    const instr = result.bytecode[i];
    
    if (instr.op === 'ITER_START') {
      foundIterStart = true;
      console.log(`Found ITER_START at ${i}`);
    }
    
    if (instr.op === 'JUMP_IF_FALSE' && foundIterStart && !jumpIfFalseInstr) {
      jumpIfFalseInstr = { index: i, target: instr.arg };
      console.log(`Found JUMP_IF_FALSE at ${i}: target = ${instr.arg}`);
    }
    
    if (instr.op === 'ITER_END') {
      iterEndIndex = i;
      console.log(`Found ITER_END at ${i}`);
    }
  }
  
  // Verify the fix
  if (jumpIfFalseInstr && iterEndIndex !== -1) {
    if (jumpIfFalseInstr.target === iterEndIndex) {
      console.log('✅ FIX SUCCESSFUL: JUMP_IF_FALSE correctly points to ITER_END');
    } else if (jumpIfFalseInstr.target === -1) {
      console.log('❌ BUG STILL EXISTS: JUMP_IF_FALSE has invalid target -1');
    } else {
      console.log(`⚠️  UNEXPECTED: JUMP_IF_FALSE points to ${jumpIfFalseInstr.target}, ITER_END is at ${iterEndIndex}`);
    }
  }
}