/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;

function main() {
  var raw = fs.readFile("/home/laco/cvm/tasks/poc/plan-data.json");
  if (raw === null) {
    console.log("ERROR: Cannot read plan-data.json");
    return;
  }
  var data = JSON.parse(raw);
  var mission = data.mission;
  var blocks = data.blocks;
  var sourceFile = data.sourceFile;

  var submitDone = " Respond with done when complete.";
  var submitTest = " Respond with passed if ALL criteria are checked, or failed if ANY is not met.";
  var toolsReminder = " Use Read, Edit, Write, Bash tools for file operations and commands.";

  console.log("=== TDDAB Universal Executor ===");
  console.log("Plan: " + sourceFile);
  console.log("Blocks: " + blocks.length);

  var completedBlocks = [];

  CC("MISSION BRIEFING: " + mission + " This plan has " + blocks.length + " blocks to implement in sequence. " + toolsReminder + submitDone);

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var blockNum = blockIndex + 1;
    var progress = blockNum + "/" + blocks.length;

    console.log("");
    console.log("=== Block " + progress + ": " + block.id + " - " + block.title + " ===");

    // RED: write failing tests
    CC("RED PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "CONTEXT: " + block.intro + " " +
      "Write ONLY the failing tests listed below. Do NOT implement any production code yet. " +
      "TESTS TO WRITE: " + block.red + " " +
      block.planRef + toolsReminder + submitDone);

    console.log("RED done for " + block.id);

    // GREEN: implement to make tests pass
    CC("GREEN PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "Implement the minimum code to make all failing tests pass. " +
      "CONTEXT: " + block.intro + " " +
      block.planRef + toolsReminder + submitDone);

    console.log("GREEN done for " + block.id);

    // VERIFY: run tests and check success criteria
    var verifyPrompt = "VERIFY PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "Run all tests and typecheck. Then verify EACH criterion below. " +
      "Mark each one as you check it: " +
      "SUCCESS CRITERIA: " + block.success + " " +
      "Are ALL criteria checked [x]?" + toolsReminder + submitTest;

    var testResult = CC(verifyPrompt);
    console.log("VERIFY result for " + block.id + ": " + testResult);

    var fixAttempt = 0;
    while (testResult === "failed") {
      fixAttempt = fixAttempt + 1;
      console.log("Fix attempt " + fixAttempt + " for " + block.id);

      CC("FIX PHASE [" + progress + "] block " + block.id + " (attempt " + fixAttempt + "). " +
        "Tests or criteria failed. Debug the issue and fix it. " +
        "CRITERIA THAT MUST PASS: " + block.success + " " +
        block.planRef + toolsReminder + submitDone);

      testResult = CC("RE-VERIFY [" + progress + "] block " + block.id + " (after fix " + fixAttempt + "). " +
        "Run all tests and typecheck again. Check EACH criterion: " +
        "SUCCESS CRITERIA: " + block.success + " " +
        "Are ALL criteria now checked [x]?" + toolsReminder + submitTest);

      console.log("RE-VERIFY result for " + block.id + ": " + testResult);
    }

    // COMMIT
    CC("COMMIT PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
      "All tests pass and all criteria verified. " +
      "Git add and commit with message: feat: " + block.title.toLowerCase() + ". " +
      "Then push." + submitDone);

    completedBlocks.push(block.id);
    console.log("Block " + block.id + " COMPLETED (" + completedBlocks.length + "/" + blocks.length + ")");

    blockIndex = blockIndex + 1;
  }

  console.log("");
  console.log("=== ALL " + completedBlocks.length + " BLOCKS COMPLETED ===");

  CC("FINAL REVIEW: All " + completedBlocks.length + " blocks are done. " +
    "Run a final full test suite to confirm no regressions. " +
    "Report the final status." + toolsReminder + submitDone);

  console.log("TDDAB execution complete.");
}
