/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: PlanExecutor with 2 blocks in sequence + retry on block 2
 * Features: multi-block loop, progress tracking (1/2, 2/2), retry on second block
 * CC Responses needed: "done" "done" "done" "passed" "done" "done" "done" "failed" "done" "passed" "done" "done"
 *   1: MISSION BRIEFING → done
 *   2: RED PHASE [1/2] → done
 *   3: GREEN PHASE [1/2] → done
 *   4: VERIFY PHASE [1/2] → passed
 *   5: COMMIT PHASE [1/2] → done
 *   6: RED PHASE [2/2] → done
 *   7: GREEN PHASE [2/2] → done
 *   8: VERIFY PHASE [2/2] → failed  (triggers retry)
 *   9: FIX PHASE [2/2] → done
 *  10: RE-VERIFY [2/2] → passed  (exits retry)
 *  11: COMMIT PHASE [2/2] → done
 *  12: FINAL REVIEW → done
 */
function main() {
  var testPlan = JSON.stringify({
    "mission": "Test multi-block execution",
    "sourceFile": "multi-test.md",
    "blocks": [
      {
        "id": "01-alpha",
        "title": "Alpha Block",
        "intro": "First block passes cleanly",
        "red": "- test: alpha works",
        "success": "- [ ] alpha done",
        "planRef": "See multi-test.md lines 1-10"
      },
      {
        "id": "02-beta",
        "title": "Beta Block",
        "intro": "Second block fails once then passes",
        "red": "- test: beta works",
        "success": "- [ ] beta done",
        "planRef": "See multi-test.md lines 11-20"
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

  console.log("=== Multi-Block Test ===");
  console.log("Blocks: " + blocks.length);

  CC("MISSION BRIEFING: " + data.mission + " This plan has " + blocks.length + " blocks. Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var blockNum = blockIndex + 1;
    var progress = blockNum + "/" + blocks.length;

    console.log("=== Block " + progress + ": " + block.id + " ===");

    CC("RED PHASE [" + progress + "] block " + block.id + ". TESTS: " + block.red + " Respond with done when complete.");
    CC("GREEN PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    var testResult = CC("VERIFY PHASE [" + progress + "] block " + block.id + ". SUCCESS CRITERIA: " + block.success + " Respond with passed or failed.");
    console.log("VERIFY result: " + testResult);

    var fixAttempt = 0;
    while (testResult === "failed") {
      fixAttempt = fixAttempt + 1;
      console.log("Fix attempt " + fixAttempt + " for " + block.id);

      CC("FIX PHASE [" + progress + "] block " + block.id + " (attempt " + fixAttempt + "). Respond with done when complete.");
      testResult = CC("RE-VERIFY [" + progress + "] block " + block.id + " (after fix " + fixAttempt + "). Respond with passed or failed.");
      console.log("RE-VERIFY result: " + testResult);
    }

    CC("COMMIT PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");
    console.log("Block " + block.id + " COMPLETED (" + blockNum + "/" + blocks.length + ")");
    blockIndex = blockIndex + 1;
  }

  console.log("=== ALL " + blocks.length + " BLOCKS COMPLETED ===");
  CC("FINAL REVIEW: All " + blocks.length + " blocks done. Respond with done when complete.");
  console.log("TDDAB execution complete.");
}
