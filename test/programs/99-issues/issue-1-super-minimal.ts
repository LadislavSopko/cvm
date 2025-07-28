/**
 * Tests: Super minimal for-continue test
 * Features: Simplest possible for loop with continue
 * CC Responses needed: none
 */

function main() {
  for (let i = 0; i < 3; i++) {
    if (i === 1) {
      continue;
    }
    console.log(i.toString());
  }
}