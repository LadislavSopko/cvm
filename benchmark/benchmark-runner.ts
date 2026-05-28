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

  console.log("Phase 1: Generating TDDAB plan...");
  CC("You have a coding task to solve. Follow these steps IN ORDER: " +
    "1. Load the TDDAB planner mindset: use skill /mind-sets:tddab-planner " +
    "2. Read the mindset carefully — it contains ALL the rules for creating plans. " +
    "3. Read the task description below. " +
    "4. Generate a TDDAB plan following the mindset rules. Save as plan.md. " +
    "TASK: " + task + " " +
    "Respond with done when plan.md is saved.");

  console.log("Plan generated");

  console.log("Phase 2: Reviewing plan...");
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

  console.log("Phase 3: Executing plan via CVM...");
  CC("Use skill /j-cvm-exec-plan on plan.md");

  console.log("=== Benchmark Runner Complete ===");
}
