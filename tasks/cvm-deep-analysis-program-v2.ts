/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Full-Stack Architecture Analysis v3.0 Started ===");
    console.log("Including comprehensive test coverage analysis across all packages");
    
    // Base context prompt for multi-package analysis with test coverage
    var contextPrompt = "CONTEXT: You are conducting a comprehensive full-stack architectural analysis of CVM's [] accessor system across ALL packages: Parser, Types, VM, MCP-Server, and Storage. This includes deep test coverage analysis revealing systemic testing failures. Focus on multi-layer integration problems, cross-package testing gaps, and the 'Interface Testing Illusion' where 729 tests validate wrong behaviors. Your goal is complete architectural understanding of how TypeScript compilation → Bytecode → Execution → Integration → Persistence creates accessor failures AND how inadequate testing masks these failures. ";
    
    console.log("Full-stack context prompt created");
    
    // Common prompt parts for cross-package analysis with test coverage focus
    var analysisBase = contextPrompt + "Use Read, Grep, LS tools to examine ALL packages. Use mcp__zen__analyze for deep cross-package insights. Include test coverage analysis findings. ";
    var crossPackage = "Examine how data flows between packages and where integration breaks down. Analyze test coverage gaps that hide these failures. ";
    var realWorld = "Focus on real-world impact on actual CVM programs and Claude Code integration. Consider how testing failures mask production issues. ";
    var testCoverage = "Include test coverage analysis: identify missing tests, interface testing vs functional testing, and cross-package integration gaps. ";
    var reviewFile = "Update /home/laco/cvm/tasks/cvm-project-review.md with all findings including test coverage insights. ";
    var submitDone = " Submit 'analyzed' when analysis complete.";
    
    console.log("Cross-package analysis prompts initialized");
    
    // Track completed analysis tasks
    var completedTasks = [];
    
    // Define full-stack analysis tasks
    var analysisTasks = [
        // Phase 1: Full-Stack Architecture Discovery
        {
            name: "Multi-Package Architecture Mapping",
            task: "Map the complete data flow: TypeScript source → PARSER compilation → TYPES system → VM execution → MCP-SERVER integration → STORAGE persistence. Identify all packages involved in [] accessor operations and their responsibilities.",
            phase: "1: Architecture Discovery",
            packages: "parser, types, vm, mcp-server, storage",
            zenRequired: true
        },
        
        {
            name: "Parser Layer Analysis", 
            task: "Examine packages/parser/src/lib/compiler/expressions/element-access.ts and property-access.ts. How does TypeScript obj[key] become bytecode? What type information is lost? How does compilation strategy affect runtime behavior?",
            phase: "1: Architecture Discovery",
            packages: "parser",
            zenRequired: true
        },
        
        {
            name: "Types Layer Integration Analysis",
            task: "Examine packages/types/src/lib/cvm-value.ts CVMValue system. What conversion tools exist? How should primitive extraction work? Why aren't VM handlers using these tools?",
            phase: "1: Architecture Discovery", 
            packages: "types",
            zenRequired: true
        },
        
        // Phase 2: Cross-Package Integration Problems
        {
            name: "VM Handler Implementation Analysis",
            task: "Deep dive into packages/vm/src/lib/handlers/arrays.ts. Focus on lines 114, 139, 187, 211 primitive extraction failures. How do these bugs affect the entire stack? What's the real impact on data integrity?",
            phase: "2: Integration Problems",
            packages: "vm",
            zenRequired: true
        },
        
        {
            name: "MCP Server Integration Impact",
            task: "Analyze packages/mcp-server/src/lib/mcp-server.ts integration with VM. How do broken accessors affect real CVM programs? What's the impact on Claude Code task execution? Examine actual program failures.",
            phase: "2: Integration Problems",
            packages: "mcp-server",
            zenRequired: true
        },
        
        {
            name: "Storage Layer Data Corruption",
            task: "Examine packages/storage/src/lib/file-adapter.ts and mongodb-adapter.ts. How do broken accessor operations corrupt persisted data? What corrupted data patterns get saved? Impact on data integrity?",
            phase: "2: Integration Problems", 
            packages: "storage",
            zenRequired: true
        },
        
        // Phase 3: End-to-End Pipeline Analysis
        {
            name: "Compilation to Execution Pipeline",
            task: "Trace complete pipeline: TypeScript obj['key'] → Parser bytecode → VM execution → Result. Where exactly does the pipeline break? How do compilation decisions affect runtime failures?",
            phase: "3: Pipeline Analysis",
            packages: "parser, vm",
            zenRequired: true
        },
        
        {
            name: "Type Safety Across Package Boundaries",
            task: "Analyze type safety guarantees (or lack thereof) between packages. How does CVMValue system integration fail? What contracts are missing between package boundaries?",
            phase: "3: Pipeline Analysis",
            packages: "types, vm, mcp-server",
            zenRequired: true
        },
        
        {
            name: "Real Program Execution Analysis",
            task: "Examine actual CVM programs (like this analysis program itself) for accessor usage. How do broken accessors affect task tracking, data storage, progress monitoring? Real-world failure modes. Include comprehensive test coverage analysis findings showing why 729 tests fail to catch these bugs.",
            phase: "3: Pipeline Analysis",
            packages: "mcp-server, storage",
            zenRequired: true
        },
        
        // Phase 4: Cross-Layer Problem Synthesis  
        {
            name: "Architectural Debt Assessment",
            task: "Synthesize findings across all packages. What's the total technical debt? Which problems are isolated vs systemic? How do package-level issues compound into architectural failures?",
            phase: "4: Synthesis",
            packages: "all",
            zenRequired: true
        },
        
        {
            name: "Multi-Package Remediation Strategy",
            task: "Design coordinated fixes across all affected packages. What needs to change in Parser, Types, VM, MCP-Server, Storage? How to sequence fixes to avoid breaking integration?",
            phase: "4: Synthesis", 
            packages: "all",
            zenRequired: true
        },
        
        {
            name: "Global Test Coverage Crisis Analysis",
            task: "Analyze comprehensive test coverage findings: 729 tests across 13,590 lines validating wrong behaviors, 0% cross-package integration testing, Storage package crisis (63.86% coverage), Interface Testing Illusion masking critical bugs. Execute actual 'npx nx test --coverage' commands to validate findings. How does testing philosophy failure enable architectural system collapse?",
            phase: "4: Synthesis",
            packages: "all",
            zenRequired: true
        },
        
        {
            name: "Full-Stack Testing Strategy",
            task: "Design comprehensive testing strategy that validates end-to-end functionality across all packages. Integration tests, cross-package validation, real program testing requirements. Address the need for 525+ new tests to achieve functional correctness.",
            phase: "4: Synthesis",
            packages: "all",
            zenRequired: true
        }
    ];
    
    // Process all full-stack analysis tasks
    console.log("Starting full-stack analysis processing. Total tasks: " + analysisTasks.length);
    var i = 0;
    while (i < analysisTasks.length) {
        console.log("\\n=== Full-Stack Analysis Task " + (i + 1) + " of " + analysisTasks.length + " ===");
        var task = analysisTasks[i];
        
        var taskName = task["name"];
        var taskAnalysis = task["task"];
        var phase = task["phase"];
        var packages = task["packages"];
        var zenRequired = task["zenRequired"];
        
        console.log("Phase: " + phase);
        console.log("Analyzing: " + taskName);
        console.log("Packages: " + packages);
        
        // Build cross-package analysis prompt with test coverage focus
        var analysisPrompt = "" + analysisBase + crossPackage + realWorld + testCoverage + reviewFile;
        analysisPrompt = analysisPrompt + "PHASE: " + phase + " ";
        analysisPrompt = analysisPrompt + "TASK: " + taskAnalysis + " ";
        analysisPrompt = analysisPrompt + "PACKAGES TO EXAMINE: " + packages + " ";
        analysisPrompt = analysisPrompt + "TEST COVERAGE CONTEXT: Consider how testing gaps in this area contribute to the overall architectural failure. ";
        
        if (zenRequired) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__analyze for comprehensive cross-package analysis. ";
        }
        
        analysisPrompt = analysisPrompt + "UPDATE: Add findings to /home/laco/cvm/tasks/cvm-project-review.md under section '## " + taskName + "'. Focus on cross-package integration and real architectural problems." + submitDone;
        
        // Execute cross-package analysis task
        CC(analysisPrompt);
        
        completedTasks.push(taskName);
        console.log("Completed analysis: " + taskName);
        
        i = i + 1;
    }
    
    // Final architectural synthesis with test coverage integration
    CC("" + analysisBase + crossPackage + realWorld + testCoverage + reviewFile + "Create comprehensive architectural summary in /home/laco/cvm/tasks/cvm-project-review.md. Synthesize all multi-package findings including test coverage crisis into: 1) Full-Stack Problem Assessment, 2) Cross-Package Integration Failures, 3) Test Coverage Systemic Failures, 4) Real-World Impact on Claude Code, 5) Complete Remediation Roadmap including 525+ new tests. Focus on architectural rescue strategy addressing both code and testing failures." + submitDone);
    
    console.log("\\n=== CVM Full-Stack Architecture Analysis v3.0 Complete! ===");
    console.log("Completed analysis tasks: " + completedTasks.length);
    console.log("Analyzed packages: Parser, Types, VM, MCP-Server, Storage");
    console.log("Integrated test coverage findings: 729 tests, 525+ new tests needed");
    console.log("Review document: /home/laco/cvm/tasks/cvm-project-review.md");
    
    return "Full-Stack Architectural Analysis Complete - Multi-Package Problems + Test Coverage Crisis Documented";
}