/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: PlanExecutor with a minimal 1-block uplan.json
 * Features: fs.readFile, JSON.parse, CC() orchestration, while loops, string concat
 * CC Responses needed: "done" "done" "done" "passed" "done" "done"
 *   1: MISSION BRIEFING → done
 *   2: RED PHASE → done
 *   3: GREEN PHASE → done
 *   4: VERIFY PHASE → passed
 *   5: COMMIT PHASE → done
 *   6: FINAL REVIEW → done
 *
 * Prerequisites: .cvm/uplan.json must exist in sandbox with test data.
 * The mcp-test-client runs from test/integration/ with CVM_SANDBOX_PATHS=pwd,
 * so uplan.json is written to test/integration/.cvm/uplan.json.
 */
function main() {
  // Write uplan.json for the test
  var testPlan = JSON.stringify({
    "mission": "Test mission for planexecutor-test",
    "sourceFile": "test-plan.md",
    "blocks": [
      {
        "id": "01-test-block",
        "title": "Test Block",
        "intro": "A simple test block for verification",
        "red": "- test: something works",
        "success": "- [ ] it works",
        "planRef": "See test-plan.md lines 1-10"
      }
    ]
  });
  fs.writeFile(".cvm/uplan.json", testPlan);

  // Now read it back like planexecutor does
  var raw = fs.readFile(".cvm/uplan.json");
  if (raw === null) {
    console.log("ERROR: Cannot read .cvm/uplan.json");
    return;
  }
  var data = JSON.parse(raw);
  var mission = data.mission;
  var blocks = data.blocks;

  console.log("=== TDDAB PlanExecutor Test ===");
  console.log("Blocks: " + blocks.length);

  CC("MISSION BRIEFING: " + mission + " Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var blockNum = blockIndex + 1;
    var progress = blockNum + "/" + blocks.length;

    CC("RED PHASE [" + progress + "] block " + block.id + ": " + block.title + ". TESTS: " + block.red + " Respond with done when complete.");

    CC("GREEN PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    var testResult = CC("VERIFY PHASE [" + progress + "] block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond with passed or failed.");
    console.log("VERIFY result: " + testResult);

    while (testResult === "failed") {
      CC("FIX PHASE block " + block.id + ". Respond with done when complete.");
      testResult = CC("RE-VERIFY block " + block.id + ". Respond with passed or failed.");
      console.log("RE-VERIFY result: " + testResult);
    }

    CC("COMMIT PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    console.log("Block " + block.id + " COMPLETED");
    blockIndex = blockIndex + 1;
  }

  console.log("=== ALL BLOCKS COMPLETED ===");

  CC("FINAL REVIEW: All blocks done. Respond with done when complete.");

  console.log("TDDAB execution complete.");
}
