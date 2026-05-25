/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: PlanExecutor when uplan.json does not exist
 * Features: fs.readFile returns null, early return, no CC calls
 * CC Responses needed: none
 * Expected output: ERROR message, no CC prompts, clean exit
 */
function main() {
  var raw = fs.readFile(".cvm/uplan-nonexistent.json");
  if (raw === null) {
    console.log("ERROR: Cannot read uplan.json — run parsePlan first");
    console.log("Exit without CC calls - OK");
    return;
  }
  console.log("FAIL: should not reach here");
}
