/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

/**
 * Tests: Full resume cycle — run 2 blocks, stop, verify progress, restart and skip
 * This test does TWO separate executions to simulate the real workflow:
 *
 * FIRST RUN (simulates work then stop after block 1):
 * - Writes uplan with 3 blocks
 * - Executes block 01 fully (RED→GREEN→VERIFY→COMMIT)
 * - After block 01 COMMIT, checks progress file exists with ["01-first"]
 * - Stops (doesn't continue to block 02)
 *
 * SECOND RUN (simulates resume after plan fix):
 * - Reads existing progress file
 * - Skips block 01 (already in progress)
 * - Executes block 02 and 03 normally
 * - Verifies final progress has all 3 blocks
 *
 * CC Responses (first run: MISSION + block01 RED/GREEN/VERIFY/COMMIT = 5):
 *   1: MISSION → done
 *   2: RED [1/3] 01-first → done
 *   3: GREEN [1/3] 01-first → done
 *   4: VERIFY [1/3] 01-first → passed
 *   5: COMMIT [1/3] 01-first → done
 * Then we verify progress and start second run:
 *   6: MISSION (second run) → done
 *   7: RED [2/3] 02-second → done
 *   8: GREEN [2/3] 02-second → done
 *   9: VERIFY [2/3] 02-second → passed
 *  10: COMMIT [2/3] 02-second → done
 *  11: RED [3/3] 03-third → done
 *  12: GREEN [3/3] 03-third → done
 *  13: VERIFY [3/3] 03-third → passed
 *  14: COMMIT [3/3] 03-third → done
 *  15: FINAL REVIEW → done
 */

function main() {
  var testPlan = JSON.stringify({
    "mission": "Full resume cycle test",
    "sourceFile": "full-cycle.md",
    "blocks": [
      { "id": "01-first", "title": "First", "intro": "Block one", "red": "- test: first works", "success": "- [ ] first done", "planRef": "lines 1-5" },
      { "id": "02-second", "title": "Second", "intro": "Block two", "red": "- test: second works", "success": "- [ ] second done", "planRef": "lines 6-10" },
      { "id": "03-third", "title": "Third", "intro": "Block three", "red": "- test: third works", "success": "- [ ] third done", "planRef": "lines 11-15" }
    ]
  });
  fs.writeFile(".cvm/uplan.json", testPlan);
  fs.writeFile(".cvm/uplan-progress.json", JSON.stringify([]));

  // === FIRST RUN: execute only block 01, then stop ===
  console.log("=== FIRST RUN ===");

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

  CC("MISSION BRIEFING: " + data.mission + " First run. Respond with done when complete.");

  // Execute only block 01
  var block = blocks[0];
  CC("RED PHASE [1/3] block " + block.id + ". Respond with done when complete.");
  CC("GREEN PHASE [1/3] block " + block.id + ". Respond with done when complete.");
  var testResult = CC("VERIFY PHASE [1/3] block " + block.id + ". Respond with passed or failed.");
  CC("COMMIT PHASE [1/3] block " + block.id + ". Respond with done when complete.");
  completedBlocks.push(block.id);
  fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
  console.log("Block " + block.id + " COMPLETED");

  // Verify progress file was written correctly
  var savedProgress = fs.readFile(".cvm/uplan-progress.json");
  console.log("Progress after first run: " + savedProgress);

  // === SECOND RUN: resume, skip block 01, execute blocks 02 and 03 ===
  console.log("");
  console.log("=== SECOND RUN (resume) ===");

  var raw2 = fs.readFile(".cvm/uplan.json");
  var data2 = JSON.parse(raw2);
  var blocks2 = data2.blocks;
  var completedBlocks2 = [];

  var progressRaw2 = fs.readFile(".cvm/uplan-progress.json");
  var skipBlocks2 = [];
  if (progressRaw2 !== null) {
    skipBlocks2 = JSON.parse(progressRaw2);
    console.log("Resuming: " + skipBlocks2.length + " blocks already completed");
  }

  CC("MISSION BRIEFING: " + data2.mission + " Second run (resume). Respond with done when complete.");

  var blockIndex = 0;
  while (blockIndex < blocks2.length) {
    var block2 = blocks2[blockIndex];

    var shouldSkip = false;
    var si = 0;
    while (si < skipBlocks2.length) {
      if (skipBlocks2[si] === block2.id) {
        shouldSkip = true;
      }
      si = si + 1;
    }
    if (shouldSkip) {
      console.log("SKIP block " + block2.id + " (already completed)");
      completedBlocks2.push(block2.id);
      blockIndex = blockIndex + 1;
      continue;
    }

    var progress = (blockIndex + 1) + "/" + blocks2.length;
    CC("RED PHASE [" + progress + "] block " + block2.id + ". Respond with done when complete.");
    CC("GREEN PHASE [" + progress + "] block " + block2.id + ". Respond with done when complete.");

    var testResult2 = CC("VERIFY PHASE [" + progress + "] block " + block2.id + ". Respond with passed or failed.");

    while (testResult2 === "failed") {
      CC("FIX PHASE block " + block2.id + ". Respond with done when complete.");
      testResult2 = CC("RE-VERIFY block " + block2.id + ". Respond with passed or failed.");
    }

    CC("COMMIT PHASE [" + progress + "] block " + block2.id + ". Respond with done when complete.");
    completedBlocks2.push(block2.id);
    fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks2));
    console.log("Block " + block2.id + " COMPLETED");
    blockIndex = blockIndex + 1;
  }

  console.log("=== ALL BLOCKS COMPLETED ===");
  CC("FINAL REVIEW: All blocks done. Respond with done when complete.");

  // Final verification
  var finalProgress = fs.readFile(".cvm/uplan-progress.json");
  console.log("Final progress: " + finalProgress);
  console.log("Full cycle verified.");
}
