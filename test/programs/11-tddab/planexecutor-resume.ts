/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: PlanExecutor resume — skips blocks listed in uplan-progress.json
 * Features: progress read at startup, skip logic, progress write after completion
 * CC Responses needed: "done" "done" "done" "passed" "done" "done"
 *   1: MISSION BRIEFING → done
 *   2: RED PHASE [2/2] block 02-beta → done
 *   3: GREEN PHASE [2/2] block 02-beta → done
 *   4: VERIFY PHASE [2/2] block 02-beta → passed
 *   5: COMMIT PHASE [2/2] block 02-beta → done
 *   6: FINAL REVIEW → done
 * Expected: block 01-alpha SKIPPED, block 02-beta executed normally
 */

function main() {
  fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(["01-alpha"]));

  var testPlan = JSON.stringify({
    "mission": "Test resume capability",
    "sourceFile": "resume-test.md",
    "blocks": [
      { "id": "01-alpha", "title": "Alpha", "intro": "Already done", "red": "- test: alpha", "success": "- [ ] alpha", "planRef": "lines 1-5" },
      { "id": "02-beta", "title": "Beta", "intro": "Needs work", "red": "- test: beta", "success": "- [ ] beta", "planRef": "lines 6-10" }
    ]
  });
  fs.writeFile(".cvm/uplan.json", testPlan);

  var raw = fs.readFile(".cvm/uplan.json");
  var data = JSON.parse(raw);
  var blocks = data.blocks;
  var completedBlocks = [];

  var progressRaw = fs.readFile(".cvm/uplan-progress.json");
  var skipBlocks = [];
  if (progressRaw !== null) {
    skipBlocks = JSON.parse(progressRaw);
    console.log("Resuming: " + skipBlocks.length + " blocks already completed");
  }

  CC("MISSION BRIEFING: " + data.mission + " Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];

    var shouldSkip = false;
    var si = 0;
    while (si < skipBlocks.length) {
      if (skipBlocks[si] === block.id) {
        shouldSkip = true;
      }
      si = si + 1;
    }
    if (shouldSkip) {
      console.log("SKIP block " + block.id + " (already completed)");
      completedBlocks.push(block.id);
      blockIndex = blockIndex + 1;
      continue;
    }

    var progress = (blockIndex + 1) + "/" + blocks.length;
    CC("RED PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");
    CC("GREEN PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");

    var testResult = CC("VERIFY PHASE [" + progress + "] block " + block.id + ". Respond with passed or failed.");

    while (testResult === "failed") {
      CC("FIX PHASE block " + block.id + ". Respond with done when complete.");
      testResult = CC("RE-VERIFY block " + block.id + ". Respond with passed or failed.");
    }

    CC("COMMIT PHASE [" + progress + "] block " + block.id + ". Respond with done when complete.");
    completedBlocks.push(block.id);
    fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
    console.log("Block " + block.id + " COMPLETED");
    blockIndex = blockIndex + 1;
  }

  console.log("=== ALL BLOCKS COMPLETED ===");
  CC("FINAL REVIEW: All blocks done. Respond with done when complete.");
  console.log("Completed: " + JSON.stringify(completedBlocks));
}
