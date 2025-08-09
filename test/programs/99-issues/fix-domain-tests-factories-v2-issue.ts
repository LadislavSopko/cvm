function main() {
  console.log("=== Domain Tests Factory Refactoring v2 ===");
  console.log("This program will refactor all Domain.Test files to use entity factories");
  console.log("instead of direct entity instantiation (new Entity { ... })");
  
  var contextPrompt = "You are refactoring Domain tests to use entity factories from Dfp.Core.Testing.Factories. " +
    "CRITICAL: You MUST follow the C# coding standards from CLAUDE.md. " +
    "Use vs-mcp tools ONLY for all .NET operations. " +
    "Add 'using Dfp.Core.Testing.Factories;' import where needed. " +
    "Replace direct entity instantiation with factory methods.";
  
  var fileOpsBase = contextPrompt + " Use Read, Write, Edit tools for file operations.";
  
  // Manual list of all test files (CVM fs.listFiles has bugs with recursive/filter)
  console.log("Using manual test file list due to CVM fs.listFiles bugs");
  
  let testFiles = [
    // Complete list of ALL test files from VS-MCP GetSolutionTree
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceSecureTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/ProjectServiceTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentServiceTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceSearchTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Activities/CreateUserTaskActivityTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Activities/UpdateDocumentActivityTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/SystemIntegrationTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceGarbageCollectionTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/AuditServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceBulkTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentTypeServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/FileValidationServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Interfaces/INamedOrderableEntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServicePerformanceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/UserServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/LabelServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/EntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/TranslationServiceWorkingScopeTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceConversionTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/NamedEntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentShareServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Interfaces/INamedEntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/CountryServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentWorkflowIntegrationTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/NamedOrderableEntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/TranslationServicePerformanceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentShareServiceSecureTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Interfaces/IEntityServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Security/PlaceholderVirusScanServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/PermissionServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentServiceSearchTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/Storage/LocalFileStorageProviderTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Services/ElsaWorkflowServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Services/WorkflowTaskServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/LanguageServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Extensions/ServiceCollectionExtensionsTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/TranslationServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/WorkingScopeComplianceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentCategoryServiceTests.cs"
  ];
  
  console.log("Manual test file list loaded: " + testFiles.length + " files");
  
  // Track changes made
  let filesChanged = 0;
  let totalEntitiesReplaced = 0;
  let hasAnyFailure = false;
  
  // Process each file
  let fileIndex = 0;
  for (const testFile of testFiles) {
    fileIndex++;
    console.log("\n=== Processing file " + fileIndex + "/" + testFiles.length + ": " + testFile + " ===");
    
    // First, introspect the file to see what entities it uses
    var introspectPrompt = contextPrompt + "\n\n" +
      "CURRENT TASK: Introspect test file\n" +
      "File: " + testFile + "\n\n" +
      "Instructions:\n" +
      "1. Read the file using Read tool\n" +
      "2. Search for patterns like 'new User {', 'new Document {', 'new Project {', etc.\n" +
      "3. Report ONLY one of these responses:\n" +
      "   - 'skip' if no direct entity instantiations found\n" +
      "   - 'refactor:N' where N is the number of instantiations found\n" +
      "Do NOT provide any other explanation.";
    
    var introspectionResult = CC(introspectPrompt);
    
    // Parse the introspection result
    if (introspectionResult.indexOf("skip") !== -1) {
      console.log("✓ File " + testFile + " - no changes needed");
      continue;
    }
    
    // Extract the count if provided
    var countMatch = introspectionResult.match(/refactor:(\d+)/);
    var instanceCount = countMatch ? +countMatch[1] : 0;
    
    if (instanceCount === 0 && introspectionResult.indexOf("refactor") === -1) {
      console.log("✓ File " + testFile + " - no entity instantiations found");
      continue;
    }
    
    // Now refactor the file
    var refactorPrompt = fileOpsBase + "\n\n" +
      "CURRENT TASK: Refactor entity creation\n" +
      "File: " + testFile + "\n" +
      "Entities to replace: " + instanceCount + "\n\n" +
      "Instructions:\n" +
      "1. Add 'using Dfp.Core.Testing.Factories;' if not present\n" +
      "2. Replace direct entity instantiations with factory methods\n" +
      "3. Report ONLY: 'done' if successful, 'fail:reason' if failed\n" +
      "Do NOT provide any other explanation.";
    
    var refactorResult = CC(refactorPrompt);
    
    if (refactorResult.indexOf("fail") !== -1) {
      console.log("✗ Failed to refactor " + testFile + ": " + refactorResult);
      hasAnyFailure = true;
      continue;
    }
    
    filesChanged++;
    totalEntitiesReplaced += instanceCount;
    
    // Build only once after changes
    var buildPrompt = contextPrompt + "\n\n" +
      "CURRENT TASK: Build project\n" +
      "Use mcp__vs-mcp__ExecuteCommand command='build' what='Dfp.Domain.Test' outputFormat='compact'\n" +
      "Report ONLY: 'success' if build succeeded, 'fail' if build failed.\n" +
      "Do NOT provide any other explanation.";
    
    var buildResult = CC(buildPrompt);
    
    if (buildResult.indexOf("fail") !== -1) {
      // One attempt to fix
      var fixPrompt = fileOpsBase + "\n\n" +
        "CURRENT TASK: Fix build errors\n" +
        "File: " + testFile + "\n" +
        "Fix compilation errors and report ONLY: 'fixed' or 'fail'";
      
      var fixResult = CC(fixPrompt);
      
      if (fixResult.indexOf("fail") !== -1) {
        console.log("✗ Failed to fix build errors in " + testFile);
        hasAnyFailure = true;
        continue;
      }
      
      // Try build again
      buildResult = CC(buildPrompt);
      if (buildResult.indexOf("fail") !== -1) {
        console.log("✗ Build still failing after fix attempt for " + testFile);
        hasAnyFailure = true;
        continue;
      }
    }
    
    console.log("✓ File " + testFile + " refactored successfully (" + instanceCount + " entities)");
  }
  
  console.log("\n=== Summary ===");
  console.log("Files processed: " + testFiles.length);
  console.log("Files changed: " + filesChanged);
  console.log("Total entities replaced: " + totalEntitiesReplaced);
  
  if (filesChanged === 0) {
    console.log("\nNo changes were needed - all files already use factories!");
    return;
  }
  
  // Run tests only if we made changes
  console.log("\n=== Running tests to verify refactoring ===");
  
  var testPrompt = contextPrompt + "\n\n" +
    "CURRENT TASK: Run tests\n" +
    "Use mcp__vs-mcp__ExecuteTest projectName='Dfp.Domain.Test'\n" +
    "Report ONLY one of: 'pass', 'fail:N' where N is number of failed tests, or 'error'\n" +
    "Do NOT provide any other explanation.";
  
  var testResult = CC(testPrompt);
  
  if (testResult.indexOf("fail") !== -1) {
    var failMatch = testResult.match(/fail:(\d+)/);
    var failCount = failMatch ? failMatch[1] : "unknown";
    console.log("✗ Tests failing: " + failCount + " test(s) failed after refactoring");
    
    // Get details about failures
    var detailPrompt = contextPrompt + "\n\n" +
      "CURRENT TASK: Get test failure details\n" +
      "Run the tests again and report which specific tests are failing and why.\n" +
      "Report in format: 'TestName: reason' one per line";
    
    var details = CC(detailPrompt);
    console.log("\nFailed tests:\n" + details);
    hasAnyFailure = true;
  } else if (testResult.indexOf("error") !== -1) {
    console.log("✗ Error running tests");
    hasAnyFailure = true;
  } else {
    console.log("✓ All tests passed!");
  }
  
  console.log("\n=== Domain Tests Factory Refactoring Complete ===");
  
  if (hasAnyFailure) {
    console.log("⚠ Completed with some failures - manual review needed");
  } else {
    console.log("✓ All refactoring completed successfully!");
  }
}