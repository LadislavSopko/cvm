/// <reference no-default-lib="true"/>

// Documents CVM variable scoping: CVM uses function-level scope.
// Variables declared with let/const inside a block stay visible after the block.
function main() {
  console.log("=== Testing Block Scoping (function-level scope) ===");

  let outer = "outer";
  console.log("Before block: outer = " + outer);

  if (true) {
    console.log("Inside if block: outer = " + outer);

    let inner = "inner";
    console.log("Inside if block: inner = " + inner);

    outer = "modified in block";
    console.log("Inside if block: outer after modification = " + outer);
  }

  console.log("After block: outer = " + outer);
  console.log("After block: inner is still visible = " + inner);

  for (let i = 0; i < 3; i++) {
    let loopVar = "loop" + i;
    console.log("In loop: i = " + i + ", loopVar = " + loopVar);
  }

  console.log("After loop: i is still visible = " + i);
  console.log("After loop: loopVar is still visible = " + loopVar);

  if (true) {
    let level1 = "level1";
    if (true) {
      let level2 = "level2";
      console.log("Nested: can access level1 = " + level1);
      console.log("Nested: can access level2 = " + level2);
    }
    console.log("After nested: level1 = " + level1);
    console.log("After nested: level2 is still visible = " + level2);
  }

  return "Scoping test complete";
}

main();
