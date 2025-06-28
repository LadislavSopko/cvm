// CVM Focus Program - Forces Claude to read Memory Bank at session start
// This ensures Claude has full context of the project state

function main() {
  CC("Review CLAUDE.md for project-specific rules and conventions, respond just 'done' when finished.");
  
  CC("Read the Memory Bank README at memory-bank/README.md and what is defined to be readent there, respond just 'done' when finished.");

  CC("Check for any active todos using TodoRead tool, after You are now fully synchronized with the CVM project state. Current mode: PLAN. What would you like to work on today? respond 'done' when finished.");
}