/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

function main() {
  var raw = fs.readFile(".cvm/uplan.json");
  if (raw === null) {
    console.log("ERROR: Cannot read .cvm/uplan.json — run parsePlan first");
    return;
  }
  var data = JSON.parse(raw);
  var mission = data.mission;
  var blocks = data.blocks;
  var sourceFile = data.sourceFile;
  var sourceFiles = data.sourceFiles;

  var submitDone = " Respond with done when complete.";
  var submitTest = " Respond with passed if ALL criteria are checked, or failed if ANY is not met.";
  var toolsReminder = " Use Read, Edit, Write, Bash and code navigation tools (LSAI, vs-mcp, xmp4) for file operations, commands and code inspection.";

  var planType = data.type;
  if (planType === null || planType === undefined) {
    planType = "tddab";
  }
  console.log("=== PlanExecutor (" + planType + ") ===");
  if (sourceFiles) {
    console.log("Plan: " + sourceFiles.length + " files");
    var fi = 0;
    while (fi < sourceFiles.length) {
      console.log("  - " + sourceFiles[fi]);
      fi = fi + 1;
    }
  } else {
    console.log("Plan: " + sourceFile);
  }
  console.log("Blocks: " + blocks.length);

  var completedBlocks = [];

  var progressRaw = fs.readFile(".cvm/uplan-progress.json");
  var skipBlocks = [];
  if (progressRaw !== null) {
    skipBlocks = JSON.parse(progressRaw);
    console.log("Resuming: " + skipBlocks.length + " blocks already completed");
  }

  var missionCtx = "PROJECT CONTEXT: " + mission + " ";

  var blockIndex = 0;

  while (blockIndex < blocks.length) {
    var block = blocks[blockIndex];
    var blockNum = blockIndex + 1;
    var progress = blockNum + "/" + blocks.length;

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

    console.log("");
    console.log("=== Block " + progress + ": " + block.id + " - " + block.title + " ===");

    if (planType === "step") {

      CC(missionCtx + "EXECUTE [" + progress + "] step " + block.id + ": " + block.title + ". " +
        "CONTEXT: " + block.intro + " " +
        "ACTIONS TO PERFORM: " + block.red + " " +
        block.planRef + toolsReminder + submitDone);

      console.log("EXECUTE done for " + block.id);

      var stepResult = CC("VERIFY [" + progress + "] step " + block.id + ": " + block.title + ". " +
        "MANDATORY: For EACH criterion below, verify against actual state. " +
        "Output CHECKLIST with [x]/[ ] and evidence. COUNT: X/Y. " +
        "SUCCESS CRITERIA: " + block.success + " " +
        "Respond passed ONLY if ALL are [x]. If ANY is [ ], respond failed." + toolsReminder + submitTest);

      console.log("VERIFY result for " + block.id + ": " + stepResult);

      var stepFix = 0;
      while (stepResult === "failed") {
        stepFix = stepFix + 1;
        console.log("Fix attempt " + stepFix + " for " + block.id);

        CC("FIX [" + progress + "] step " + block.id + " (attempt " + stepFix + "). " +
          "Apply Protocol D: quote exact error, isolate location, one hypothesis, one fix, verify. " +
          "ACTIONS: " + block.red + " " +
          "CRITERIA: " + block.success + " " +
          block.planRef + toolsReminder + submitDone);

        stepResult = CC("RE-VERIFY [" + progress + "] step " + block.id + " (after fix " + stepFix + "). " +
          "MANDATORY: For EACH criterion, verify against actual state. " +
          "Output CHECKLIST with [x]/[ ] and evidence. COUNT: X/Y. " +
          "SUCCESS CRITERIA: " + block.success + " " +
          "Respond passed ONLY if ALL are [x]." + toolsReminder + submitTest);

        console.log("RE-VERIFY result for " + block.id + ": " + stepResult);
      }

      CC("UPDATE MEMORY BANK [" + progress + "] step " + block.id + ": " + block.title + ". " +
        "Update memory-bank/activeContext.md and memory-bank/progress.md with what was completed in this block." + toolsReminder + submitDone);

      CC("COMMIT [" + progress + "] step " + block.id + ": " + block.title + ". " +
        "All criteria verified. " +
        "Git add and commit with message: chore: " + block.title + "." + submitDone);

    } else {

      CC(missionCtx + "RED PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
        "CONTEXT: " + block.intro + " " +
        "Write ONLY the failing tests listed below. Do NOT implement any production code yet. " +
        "TESTS TO WRITE: " + block.red + " " +
        block.planRef + toolsReminder + submitDone);

      console.log("RED done for " + block.id);

      CC("GREEN PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
        "Implement the minimum code to make all failing tests pass. " +
        "IMPORTANT: Read the plan file for implementation details and reference code: " + block.planRef + " " +
        "CONTEXT: " + block.intro + " " +
        toolsReminder + submitDone);

      console.log("GREEN done for " + block.id);

      var verifyPrompt = "VERIFY PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
        "MANDATORY: For EACH criterion below, use code navigation tools to verify against actual code. " +
        "Output this EXACT format before responding: " +
        "CHECKLIST: (one line per criterion with [x] or [ ] and file:line evidence) " +
        "COUNT: X/Y passed. " +
        "SUCCESS CRITERIA: " + block.success + " " +
        "Respond passed ONLY if ALL criteria are [x]. If ANY is [ ], respond failed." + toolsReminder + submitTest;

      var testResult = CC(verifyPrompt);
      console.log("VERIFY result for " + block.id + ": " + testResult);

      var fixAttempt = 0;
      while (testResult === "failed") {
        fixAttempt = fixAttempt + 1;
        console.log("Fix attempt " + fixAttempt + " for " + block.id);

        CC("FIX PHASE [" + progress + "] block " + block.id + " (attempt " + fixAttempt + "). " +
          "Tests or criteria failed. Apply Protocol D: quote exact error, isolate location, one hypothesis, one fix, verify. " +
          "CRITERIA THAT MUST PASS: " + block.success + " " +
          "TESTS REQUIRED: " + block.red + " " +
          block.planRef + toolsReminder + submitDone);

        testResult = CC("RE-VERIFY [" + progress + "] block " + block.id + " (after fix " + fixAttempt + "). " +
          "MANDATORY: For EACH criterion, use code navigation tools to verify against actual code. " +
          "Output CHECKLIST with [x]/[ ] and evidence. COUNT: X/Y. " +
          "SUCCESS CRITERIA: " + block.success + " " +
          "Respond passed ONLY if ALL are [x]." + toolsReminder + submitTest);

        console.log("RE-VERIFY result for " + block.id + ": " + testResult);
      }

      var redKeys = block.redKeys;
      var jsonTemplate = "{";
      var ki = 0;
      while (ki < redKeys.length) {
        if (ki > 0) {
          jsonTemplate = jsonTemplate + ", ";
        }
        jsonTemplate = jsonTemplate + "\"" + redKeys[ki] + "\": null";
        ki = ki + 1;
      }
      jsonTemplate = jsonTemplate + "}";

      var crossCheckResponse = CC("CROSS-CHECK [" + progress + "] block " + block.id + ". " +
        "Use code navigation tools to verify EACH test exists in actual test file(s). " +
        "REQUIRED TESTS: " + block.red + " " +
        "Complete this JSON — set each value to true (test exists) or false (missing): " +
        jsonTemplate + " " +
        "Respond ONLY with the completed JSON. NOTHING else." + toolsReminder);

      var crossCheckPassed = true;
      var checkResults = JSON.parse(crossCheckResponse);
      for (var crKey in checkResults) {
        if (checkResults[crKey] === false) {
          crossCheckPassed = false;
        }
      }
      console.log("CROSS-CHECK result for " + block.id + ": " + crossCheckResponse + " passed=" + crossCheckPassed);

      if (crossCheckPassed === false) {
        fixAttempt = fixAttempt + 1;
        console.log("CROSS-CHECK failed, fix attempt " + fixAttempt + " for " + block.id);

        CC("FIX PHASE [" + progress + "] block " + block.id + " (cross-check fix " + fixAttempt + "). " +
          "Cross-check found missing tests. Apply Protocol D: identify exactly which tests are missing, add them. " +
          "TESTS REQUIRED: " + block.red + " " +
          "CRITERIA: " + block.success + " " +
          block.planRef + toolsReminder + submitDone);

        CC("RE-VERIFY [" + progress + "] block " + block.id + " (after cross-check fix). " +
          "MANDATORY: For EACH criterion, use code navigation tools to verify against actual code. " +
          "Output CHECKLIST with [x]/[ ] and evidence. COUNT: X/Y. " +
          "SUCCESS CRITERIA: " + block.success + " " +
          "Respond passed ONLY if ALL are [x]." + toolsReminder + submitTest);
      }

      CC("UPDATE MEMORY BANK [" + progress + "] block " + block.id + ": " + block.title + ". " +
        "Update memory-bank/activeContext.md and memory-bank/progress.md with what was completed in this block." + toolsReminder + submitDone);

      CC("COMMIT PHASE [" + progress + "] block " + block.id + ": " + block.title + ". " +
        "All tests pass and all criteria verified. " +
        "Git add and commit with message: feat: " + block.title + "." + submitDone);

    }

    completedBlocks.push(block.id);
    fs.writeFile(".cvm/uplan-progress.json", JSON.stringify(completedBlocks));
    console.log("Block " + block.id + " COMPLETED (" + completedBlocks.length + "/" + blocks.length + ")");

    blockIndex = blockIndex + 1;
  }

  console.log("");
  console.log("=== ALL " + completedBlocks.length + " BLOCKS COMPLETED ===");
  console.log("Completed: " + JSON.stringify(completedBlocks));

  CC("FINAL REVIEW: All " + completedBlocks.length + " blocks are done. " +
    "Run a final full test suite to confirm no regressions. " +
    "Report the final status." + toolsReminder + submitDone);

  console.log("TDDAB execution complete.");
}
