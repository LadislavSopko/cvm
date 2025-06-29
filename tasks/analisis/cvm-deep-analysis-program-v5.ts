/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Complete Project Analysis v5.0 with Zen Second Opinions ===");
    console.log("Analyzing ALL architectural problems with multiple AI perspectives");
    
    // Define paths
    var reviewPath = "/home/laco/cvm/tasks/cvm-project-review.md";
    var outputPath = "/home/laco/cvm/tasks/cvm-complete-analysis-output.md";
    
    // Base context for complete analysis
    var contextPrompt = "CONTEXT: You are conducting a COMPLETE architectural analysis of the CVM project to identify ALL problems preventing project completion. The existing review at " + reviewPath + " covers [] accessor issues (lines 1-1134) and lists additional areas needing analysis (lines 1138-1260). Your goal is to create a comprehensive analysis at " + outputPath + " covering EVERYTHING needed to finish CVM. Focus on architectural problems that prevent extension, missing implementations, and what needs reorganization. NO NEW FEATURES - only analyze what exists and what's broken. ";
    
    console.log("Review document: " + reviewPath);
    console.log("Output document: " + outputPath);
    console.log("Using Zen tools for second opinions and deeper analysis");
    
    // Initialize output document
    CC("Create a new analysis document at " + outputPath + " with title '# CVM Complete Architectural Analysis with Zen Insights\\n\\nDate: ' + today's date + '\\n\\n## Overview\\n\\nThis document provides a complete analysis of the CVM project using multiple AI perspectives to identify all architectural problems preventing project completion.\\n\\n## Methodology\\n\\nEach area analyzed with:\\n- Direct code examination\\n- Zen tool second opinions\\n- Test execution results\\n- Multiple model perspectives\\n\\n' Submit 'initialized' when done.");
    
    // Track completed analyses
    var completedAnalyses = [];
    
    // Define all analysis tasks with zen tool strategies
    var analysisTasks = [
        // Phase 1: Core VM Analysis
        {
            name: "VM Opcode Implementation Status",
            task: "Analyze ALL VM opcodes: Which are implemented, partially implemented, or broken? Check arithmetic (ADD/SUB/MUL/DIV/MOD), comparison (EQ/NE/LT/GT), logical (AND/OR/NOT), control flow (IF/WHILE/FOR_OF/BREAK/CONTINUE), string ops, object ops, stack ops, variable ops. Test actual functionality.",
            reviewRef: "Lines 1140-1150: VM Opcode Implementation Status",
            packages: "vm/src/lib/handlers/*, vm/src/lib/vm.ts",
            phase: "Core VM Analysis",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        {
            name: "CC() Integration and State Management",
            task: "How does CC() preserve VM state? Analyze stack preservation, variable scope, iterator state in loops, heap references, PC management, error propagation. Test with programs having multiple CC() calls in loops.",
            reviewRef: "Lines 1152-1161: CC() Integration and State Management",
            packages: "vm/src/lib/handlers/io.ts, vm/src/lib/vm-manager.ts",
            phase: "Core VM Analysis",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: true
        },
        
        {
            name: "Memory Bank Priority Features",
            task: "Check implementation status of Memory Bank priorities: Array methods (map/filter/reduce) - HIGHEST priority, Error handling (try/catch) - HIGH priority, fs.readFile/writeFile - MEDIUM priority. What's implemented vs workarounds?",
            reviewRef: "Lines 1163-1169: Memory Bank Priority Features Status",
            packages: "memory-bank/*.md, vm/src/lib/handlers/arrays.ts",
            phase: "Core VM Analysis",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        // Phase 2: Architecture Problems
        {
            name: "Architectural Extensibility Problems",
            task: "Why is it hard to add new features? Analyze handler architecture modularity, opcode addition process, type system integration failures, cross-package coupling, state management patterns. Find concrete examples where extension attempts failed.",
            reviewRef: "Lines 1171-1178: Architectural Extensibility Problems",
            packages: "all packages - focus on integration points",
            phase: "Architecture Problems",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: true
        },
        
        {
            name: "Compiler Architecture Limitations", 
            task: "What TypeScript constructs are silently ignored? Find missing visitor implementations, check error reporting, analyze AST traversal gaps. Create list of unsupported but commonly used TypeScript features.",
            reviewRef: "Lines 1180-1187: Compiler Architecture Limitations",
            packages: "parser/src/lib/compiler/*, parser/src/lib/parser.ts",
            phase: "Architecture Problems",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        {
            name: "Integration Layer Problems",
            task: "Analyze VMManager coordination, MCP-Server to VM communication, storage adapter transactions, state serialization correctness, execution lifecycle, resource cleanup. Where do integrations break?",
            reviewRef: "Lines 1198-1205: Integration Layer Problems",
            packages: "mcp-server/src/lib/*, vm/src/lib/vm-manager.ts",
            phase: "Architecture Problems",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: true,
            useThinkDeep: false
        },
        
        // Phase 3: Missing Functionality
        {
            name: "Missing Core Functionality",
            task: "What core features are completely missing? Check function declarations/calls, return statements, scope chain, closures, exception handling, native bindings. Compare with basic JavaScript expectations.",
            reviewRef: "Lines 1207-1214: Missing Core Functionality",
            packages: "parser/src/lib/compiler/*, vm/src/lib/handlers/*",
            phase: "Missing Functionality",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        {
            name: "Real Program Execution Testing",
            task: "Test actual CVM programs: multi-file analysis, nested loops with CC(), data transformations, fs operations. Document what should work but doesn't. Include programs from test/examples/.",
            reviewRef: "Lines 1189-1196: Real Program Execution Analysis",
            packages: "test/examples/*, mcp-server integration",
            phase: "Missing Functionality",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: true,
            useThinkDeep: false
        },
        
        // Phase 4: Quality and Debt
        {
            name: "Performance and Scalability Issues",
            task: "Analyze opcode dispatch efficiency, heap allocation patterns, stack growth, memory leaks, large program handling, CC() overhead. Run performance tests with large arrays/objects.",
            reviewRef: "Lines 1216-1223: Performance and Scalability Architecture",
            packages: "vm/src/lib/vm.ts, vm/src/lib/vm-heap.ts",
            phase: "Quality and Debt",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        {
            name: "Test Infrastructure Reality Check",
            task: "Why do tests pass but functionality fails? Analyze test categories, isolation issues, mock vs real gaps. Run 'npx nx test vm' and compare with actual functionality. Find false positive tests.",
            reviewRef: "Lines 1225-1231: Test Infrastructure Problems",
            packages: "all test files - *.spec.ts",
            phase: "Quality and Debt",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: true
        },
        
        {
            name: "TODO/FIXME Technical Debt Scan",
            task: "Systematic scan for ALL TODO/FIXME comments, commented code, temporary workarounds, admitted hacks. Use grep to find patterns like 'TODO', 'FIXME', 'HACK', 'temporary'. Create categorized list.",
            reviewRef: "Lines 1233-1240: TODO/FIXME/Technical Debt Scan",
            packages: "all packages - comprehensive scan",
            phase: "Quality and Debt",
            useCodeReview: true,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: false
        },
        
        {
            name: "Development Workflow Impediments",
            task: "Why do simple changes require touching multiple packages? Analyze build complexity, debugging difficulty, error message quality. Document specific examples of simple features requiring complex changes.",
            reviewRef: "Lines 1242-1248: Development Workflow Impediments",
            packages: "build configuration, nx.json, package.json files",
            phase: "Quality and Debt",
            useCodeReview: false,
            useAnalyze: true,
            useDebug: false,
            useThinkDeep: true
        }
    ];
    
    // Process all analysis tasks with zen insights
    console.log("Starting comprehensive analysis with Zen insights. Total tasks: " + analysisTasks.length);
    
    var i = 0;
    while (i < analysisTasks.length) {
        console.log("\\n=== Analysis Task " + (i + 1) + " of " + analysisTasks.length + " ===");
        
        var task = analysisTasks[i];
        var taskName = task["name"];
        var taskDescription = task["task"];
        var reviewRef = task["reviewRef"];
        var packages = task["packages"];
        var phase = task["phase"];
        var useCodeReview = task["useCodeReview"];
        var useAnalyze = task["useAnalyze"];
        var useDebug = task["useDebug"];
        var useThinkDeep = task["useThinkDeep"];
        
        console.log("Phase: " + phase);
        console.log("Analyzing: " + taskName);
        console.log("Packages: " + packages);
        console.log("Review Reference: " + reviewRef);
        
        // Build base analysis prompt
        var analysisPrompt = contextPrompt;
        analysisPrompt = analysisPrompt + "Use Read, Grep, LS, and Bash tools to examine code. ";
        analysisPrompt = analysisPrompt + "Identify architectural problems, missing implementations, broken functionality, and why it's hard to extend. ";
        analysisPrompt = analysisPrompt + "Check actual implementation vs what's supposed to work. Look for TODO/FIXME comments. ";
        analysisPrompt = analysisPrompt + "Run actual tests with 'npx nx test' to see what really fails. ";
        analysisPrompt = analysisPrompt + "READ from " + reviewPath + " for context. WRITE findings to " + outputPath + ". ";
        
        // Add task specifics
        analysisPrompt = analysisPrompt + "PHASE: " + phase + " ";
        analysisPrompt = analysisPrompt + "TASK: " + taskDescription + " ";
        analysisPrompt = analysisPrompt + "REVIEW REFERENCE: In " + reviewPath + ", " + reviewRef + " ";
        analysisPrompt = analysisPrompt + "EXAMINE: " + packages + " ";
        
        // Add zen tool requirements based on flags
        if (useAnalyze) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__analyze with model='pro' for architectural insights. ";
        }
        if (useCodeReview) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__codereview with model='pro' for implementation quality assessment. ";
        }
        if (useDebug) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__debug with model='pro' when analyzing failures. ";
        }
        if (useThinkDeep) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__thinkdeep with thinking_mode='high' for complex architectural decisions. ";
        }
        
        // Add output instructions
        analysisPrompt = analysisPrompt + "OUTPUT: Write your findings to " + outputPath + " under section '## " + taskName + "'. ";
        analysisPrompt = analysisPrompt + "Include both direct analysis and Zen tool insights. ";
        analysisPrompt = analysisPrompt + "Focus on what's broken, what's missing, and why it's hard to fix or extend. ";
        analysisPrompt = analysisPrompt + "Submit 'analyzed' when complete.";
        
        // Execute analysis with zen insights
        CC(analysisPrompt);
        
        completedAnalyses.push(taskName);
        console.log("Completed: " + taskName);
        
        i = i + 1;
    }
    
    // Final synthesis with deep thinking
    var finalPrompt = contextPrompt;
    finalPrompt = finalPrompt + "REQUIRED: Use mcp__zen__thinkdeep with thinking_mode='max' for final synthesis. ";
    finalPrompt = finalPrompt + "Create final synthesis in " + outputPath + ". ";
    finalPrompt = finalPrompt + "Read all previous sections and the original review at " + reviewPath + ". ";
    finalPrompt = finalPrompt + "Create sections: ";
    finalPrompt = finalPrompt + "'## Executive Summary' (what works, what's broken, what's missing), ";
    finalPrompt = finalPrompt + "'## Critical Blockers' (must fix to have basic working system), ";
    finalPrompt = finalPrompt + "'## Architectural Reorganization Needed' (what needs restructuring), ";
    finalPrompt = finalPrompt + "'## Project Completion Roadmap' (prioritized steps to finish CVM). ";
    finalPrompt = finalPrompt + "Use insights from all Zen analyses to provide deep architectural recommendations. ";
    finalPrompt = finalPrompt + "Be realistic about effort and complexity. ";
    finalPrompt = finalPrompt + "Submit 'analyzed' when complete.";
    
    CC(finalPrompt);
    
    console.log("\\n=== CVM Complete Project Analysis v5.0 Complete! ===");
    console.log("Analyzed areas: " + completedAnalyses.length);
    console.log("Review source: " + reviewPath);
    console.log("Analysis output: " + outputPath);
    console.log("Zen tools used for deeper insights at every step");
    
    return "Complete CVM Analysis with Zen Insights Finished - Output at " + outputPath;
}