/// <reference no-default-lib="true"/>
declare function CC(prompt: string): string;
declare var fs: any;

function main() {
  var task = fs.readFile("instruction.md");
  if (task === null) {
    console.log("ERROR: Cannot read instruction.md — make sure you are in the task directory");
    return;
  }

  console.log("=== CVM Benchmark Runner ===");
  console.log("Task loaded: " + task.length + " chars");

  console.log("Phase 1: Understand the codebase...");
  CC("You have a coding task to solve. Before anything else, UNDERSTAND the project: " +
    "1. Read the task description below to know WHAT is needed. " +
    "2. Explore the codebase: file structure, existing code, tests, build system. " +
    "3. Identify the language, framework, test runner, and key patterns used. " +
    "TASK: " + task + " " +
    "Explore thoroughly. Respond with done when you understand the project.");

  console.log("Codebase explored");

  console.log("Phase 2: Initialize Memory Bank...");
  CC("Create a memory-bank/ directory and initialize it with project context from your exploration: " +
    "1. memory-bank/productContext.md — what this project does, its purpose " +
    "2. memory-bank/techContext.md — language, framework, build commands, test commands, dependencies " +
    "3. memory-bank/activeContext.md — current task context and what needs to be done " +
    "4. memory-bank/progress.md — empty for now, will track block progress " +
    "Use MBEL v5.0 format if memory-bank/README.md exists, otherwise use plain text. " +
    "Respond with done when memory-bank is initialized.");

  console.log("Memory Bank initialized");

  console.log("Phase 3: Generate TDDAB plan...");
  CC("Now generate the implementation plan. Follow these steps IN ORDER: " +
    "1. Load the TDDAB planner mindset: use skill /mind-sets:tddab-planner " +
    "2. Read the mindset carefully — it contains ALL the rules for creating plans. " +
    "3. Use your codebase understanding and memory-bank context to generate a TDDAB plan. " +
    "4. Save as plan.md. " +
    "Respond with done when plan.md is saved.");

  console.log("Plan generated");

  console.log("Phase 4: Review plan...");
  var reviewOk = "failed";
  while (reviewOk !== "passed") {
    reviewOk = CC("Review the plan you created. Follow these steps: " +
      "1. Re-read the TDDAB planner mindset: use skill /mind-sets:tddab-planner " +
      "2. Read plan.md " +
      "3. Check plan.md against EVERY rule in the mindset. " +
      "If ANY rule is violated: fix plan.md and respond failed. " +
      "If ALL rules pass: respond passed. " +
      "Be STRICT. A bad plan wastes more time than a good review.");
    console.log("Review result: " + reviewOk);
  }

  console.log("Plan reviewed and approved");

  console.log("Phase 5: Execute plan via CVM...");
  CC("Use skill /j-cvm-exec-plan on plan.md");

  console.log("=== Benchmark Runner Complete ===");
}
