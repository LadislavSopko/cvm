function main() {
  console.log("=== Domain Tests Factory Refactoring ===");
  console.log("This program will refactor all Domain.Test files to use entity factories");
  console.log("instead of direct entity instantiation (new Entity { ... })");
  
  var contextPrompt = "You are refactoring Domain tests to use entity factories from Dfp.Core.Testing.Factories. " +
    "CRITICAL: You MUST follow the C# coding standards from CLAUDE.md. " +
    "Use vs-mcp tools ONLY for all .NET operations. " +
    "Add 'using Dfp.Core.Testing.Factories;' import where needed. " +
    "Replace direct entity instantiation with factory methods.";
  
  var fileOpsBase = contextPrompt + " Use Read, Write, Edit tools for file operations.";
  
  // Manual list of all test files (CVM fs.listFiles has bugs with recursive/filter)
  // TODO: Remove this hardcoded list once CVM issue is fixed
  console.log("Using manual test file list due to CVM fs.listFiles bugs");
  
  let testFiles = [
    // Complete list of ALL test files from VS-MCP GetSolutionTree
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceSecureTests.cs",
    // "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/ProjectServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/DocumentServiceTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceSearchTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Activities/CreateUserTaskActivityTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Elsa/Activities/UpdateDocumentActivityTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/SystemIntegrationTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/MediumServiceGarbageCollectionTests.cs",
    "/mnt/c/Projekty/AI_Works/DocFlowPro/libs/backend/domain/dfp.domain-test/Domain/Services/AuditServiceTests.cs",
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
  
  if (testFiles) {
    console.log("Found " + testFiles.length + " test files to process");
  } else {
    console.log("testFiles is null or undefined");
  }
  
  // Process each file
  let fileIndex = 0;
  for (const testFile of testFiles) {
    fileIndex++;
    console.log("\n=== Processing file " + fileIndex + "/" + testFiles.length + ": " + testFile + " ===");
    
    // First, introspect the file to see what entities it uses
    var introspectPrompt = contextPrompt + "\n\n" +
      "CURRENT TASK: Introspect test file to identify entity usage\n" +
      "File: " + testFile + "\n\n" +
      "Instructions:\n" +
      "1. Read the file using Read tool\n" +
      "2. Search for patterns like 'new User {', 'new Document {', 'new Project {', etc.\n" +
      "3. Identify which entities are being instantiated directly\n" +
      "4. Report back with a JSON-like response:\n" +
      "   - entities: comma-separated list of entity names found (e.g., 'User,Document,Project')\n" +
      "   - factories: corresponding factory names needed (e.g., 'UserFactory,DocumentFactory,ProjectFactory')\n" +
      "   - needsRefactoring: true/false\n" +
      "   - instanceCount: approximate number of direct instantiations found\n\n" +
      "If no direct entity instantiations are found, report needsRefactoring: false";
    
    var introspectionResult = CC(introspectPrompt);
    
    // Parse the introspection result to determine if we need to refactor
    if (introspectionResult.indexOf("needsRefactoring: false") !== -1) {
      console.log("✓ File " + testFile + " already uses factories or has no entity instantiations");
      continue;
    }
    
    // Now refactor the file based on what was found
    var refactorPrompt = fileOpsBase + "\n\n" +
      "CURRENT TASK: Refactor entity creation in test file\n" +
      "File: " + testFile + "\n" +
      "Based on introspection: " + introspectionResult + "\n\n" +
      "Instructions:\n" +
      "1. Add 'using Dfp.Core.Testing.Factories;' if not present\n" +
      "2. Replace each direct entity instantiation with appropriate factory method calls\n" +
      "3. Use factory extension methods for customization when needed\n" +
      "4. Preserve the exact same test logic and assertions\n\n" +
      "Example transformations:\n" +
      "- new User { Name = \"Test\", Role = UserRole.Admin } → UserFactory.CreateAdmin(\"Test\")\n" +
      "- new User { Name = \"Test\", IsActive = false } → UserFactory.Create(\"Test\").AsInactive()\n" +
      "- new Project { Name = \"Test\" } → ProjectFactory.Create(\"Test\")\n" +
      "- new Document { Title = \"Test\", ProjectId = 1 } → DocumentFactory.Create(\"Test\").WithProjectId(1)\n\n" +
      "Report what changes were made.";
    
    CC(refactorPrompt);
    
    // Verify changes compile
    var buildPrompt = contextPrompt + "\n\n" +
      "CURRENT TASK: Build the Domain.Test project to verify changes compile\n" +
      "Use mcp__vs-mcp__ExecuteCommand command='build' what='Dfp.Domain.Test' outputFormat='compact'\n" +
      "Report if build succeeds or if there are any compilation errors. You have to respond only [SUCCEED|FAIL]";
    
    var buildResult = CC(buildPrompt);
    
    // If build fails, fix it
    while (buildResult.indexOf("FAIL") !== -1) {
      var fixPrompt = fileOpsBase + "\n\n" +
        "CURRENT TASK: Fix compilation errors in " + testFile + "\n" +
        "The build failed. Review the errors and fix them.\n" +
        "Common issues:\n" +
        "- Missing using statements\n" +
        "- Incorrect factory method usage\n" +
        "- Property initialization differences\n" +
        "- Missing factory extension methods\n" +
        "Fix the issues and report what was changed.";
      
      CC(fixPrompt);
      
      // Build again
      buildResult = CC(buildPrompt);
    }

    // Final verification - run all Domain tests
  var testPrompt = contextPrompt + "\n\n" +
    "CURRENT TASK: Run all Domain.Test tests to verify refactoring didn't break anything\n" +
    "Use mcp__vs-mcp__ExecuteAsyncTest operation='start' projectName='Dfp.Domain.Test'\n" +
    "Then use mcp__vs-mcp__ExecuteAsyncTest operation='status' to check results\n" +
    " You have to respond only [SUCCEED|FAIL]";
  
  var testResult = CC(testPrompt);

  while(testResult.indexOf("FAIL") !== -1){
     var testResult = CC(" Try Fixx what is not working and : " + testPrompt);
  }

    
    console.log("✓ File " + testFile + " refactored successfully");
  }
  
 
  
  
  
  console.log("\n=== Domain Tests Factory Refactoring Complete ===");
  console.log("Processed " + testFiles.length + " test files");
  console.log("All test files now use entity factories for improved maintainability.");
}