/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: PlanExecutor retry loop — VERIFY fails once, FIX, RE-VERIFY passes
 * Features: while loop on "failed", fix attempt counter, RE-VERIFY exit on "passed"
 * CC Responses needed: "done" "done" "done" "failed" "done" "passed" "done" "done"
 *   1: MISSION BRIEFING → done
 *   2: RED PHASE → done
 *   3: GREEN PHASE → done
 *   4: VERIFY PHASE → failed  (triggers retry loop)
 *   5: FIX PHASE → done
 *   6: RE-VERIFY → passed  (exits retry loop)
 *   7: COMMIT PHASE → done
 *   8: FINAL REVIEW → done
 */
function main() {
  var testPlan = JSON.stringify({
    "mission": "Test retry loop",
    "sourceFile": "retry-test.md",
    "blocks": [
      {
        "id": "01-retry",
        "title": "Retry Block",
        "intro": "Block that will fail verification once",
        "red": "- test: retry works",
        "success": "- [ ] retry passes after fix",
        "planRef": "See retry-test.md lines 1-10"
      }
    ]
  });
  fs.writeFile(".cvm/uplan.json", testPlan);

  var raw = fs.readFile(".cvm/uplan.json");
  if (raw === null) {
    console.log("ERROR: Cannot read .cvm/uplan.json");
    return;
  }
  var data = JSON.parse(raw);
  var blocks = data.blocks;

  console.log("=== Retry Test ===");

  CC("MISSION BRIEFING: " + data.mission + " Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var progress = (blockIndex + 1) + "/" + blocks.length;

    CC("RED PHASE [" + progress + "] block " + block.id + ". TESTS: " + block.red + " Respond with done when complete.");
    CC("GREEN PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    var testResult = CC("VERIFY PHASE [" + progress + "] block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond with passed or failed.");
    console.log("VERIFY result: " + testResult);

    var fixAttempt = 0;
    while (testResult === "failed") {
      fixAttempt = fixAttempt + 1;
      console.log("Fix attempt " + fixAttempt + " for " + block.id);

      CC("FIX PHASE block " + block.id + " (attempt " + fixAttempt + "). Respond with done when complete.");
      testResult = CC("RE-VERIFY block " + block.id + " (after fix " + fixAttempt + "). Respond with passed or failed.");
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
