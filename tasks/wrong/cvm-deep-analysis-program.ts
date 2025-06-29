/// <reference no-default-lib="true"/>
/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
declare function CC(prompt: string): string;

function main() {
    console.log("=== CVM Deep Analysis Program Started ===");
    
    // Base context prompt for every analysis task
    var contextPrompt = "CONTEXT: You are conducting a comprehensive deep analysis of the CVM [] accessor and reference system. CRITICAL: Read the detailed analysis plan at /home/laco/cvm/tasks/deep-analysis-plan.md for exact specifications. The line numbers in each task refer to this plan document. Your goal is UNDERSTANDING and DOCUMENTATION only - no code fixes or modifications. ";
    
    console.log("Context prompt created");
    
    // Common prompt parts for analysis
    var analysisBase = contextPrompt + "Use Read, Grep, LS tools to examine code. Use mcp__zen__codereview and mcp__zen__analyze for deep insights. ";
    var zenHelp = "Use Zen tools (mcp__zen__*) for comprehensive analysis with large context windows. ";
    var reviewFile = "Write ALL findings to /home/laco/cvm/tasks/cvm-project-review.md using Write or Edit tools. ";
    var submitDone = " Submit 'analyzed' when analysis complete.";
    var noCodeChanges = "IMPORTANT: Do NOT write, edit, or modify any CVM source code - only analyze and document. ";
    
    console.log("Analysis prompts initialized");
    
    // Track completed analysis tasks
    var completedTasks = [];
    
    // Define all analysis tasks as atomic units with plan line references
    var analysisTasks = [
        // Phase 1: Foundation Analysis (Lines 10-42)
        {
            name: "CVMValue Union Type Analysis",
            task: "Analyze CVMValue type system following plan lines 15-21. Read packages/types/src/lib/cvm-value.ts completely. Document: 1) All types in the union, 2) Which are primitives vs references vs direct objects, 3) The fundamental ambiguity between CVMArray values and CVMArrayRef references, 4) Type guard completeness. Use Zen for deep analysis.",
            planSection: "1.1 Type System Examination",
            files: ["packages/types/src/lib/cvm-value.ts"],
            zenRequired: true
        },
        
        {
            name: "Reference Creation Pattern Analysis", 
            task: "Map all reference creation points following plan lines 24-29. Search entire codebase for heap.allocate() calls and direct object creation. Document when references are chosen vs direct objects. Identify decision logic inconsistencies.",
            planSection: "1.2 Reference vs Direct Object Usage Patterns",
            files: ["packages/vm/src/lib/vm-heap.ts", "packages/"],
            zenRequired: true
        },
        
        {
            name: "Heap Structure Deep Dive",
            task: "Examine heap implementation following plan lines 32-36. Read vm-heap.ts completely. Document: 1) Storage format analysis, 2) {type, data} wrapper redundancy, 3) ID management, 4) Allocation/deallocation patterns. Use Zen for architectural analysis.",
            planSection: "1.3 Heap Structure Analysis", 
            files: ["packages/vm/src/lib/vm-heap.ts"],
            zenRequired: true
        },
        
        // Phase 2: Compiler Behavior Analysis (Lines 44-65)
        {
            name: "Element Access Compilation Analysis",
            task: "Trace bracket notation compilation following plan lines 49-53. Read element-access.ts line by line. Document exactly what opcodes are emitted for target[index] with different target types (string, array, object) and index types (number, string, variable).",
            planSection: "2.1 Bracket Notation Compilation",
            files: ["packages/parser/src/lib/compiler/expressions/element-access.ts"],
            zenRequired: false
        },
        
        {
            name: "Property Access vs Element Access Comparison",
            task: "Compare property vs element access compilation following plan lines 56-59. Read property-access.ts and compare with element-access.ts. Document if obj.prop and obj['prop'] emit equivalent bytecode. Identify compilation inconsistencies.",
            planSection: "2.2 Property Access Compilation",
            files: ["packages/parser/src/lib/compiler/expressions/property-access.ts", "packages/parser/src/lib/compiler/expressions/element-access.ts"],
            zenRequired: false
        },
        
        {
            name: "Compiler Opcode Selection Logic Analysis",
            task: "Map complete compiler decision tree following plan lines 62-65. Examine bytecode.ts for all opcodes. Document when ARRAY_GET vs PROPERTY_GET vs other opcodes are chosen. Check if compiler has type information for better decisions.",
            planSection: "2.3 Opcode Selection Logic",
            files: ["packages/parser/src/lib/bytecode.ts", "packages/parser/src/lib/compiler.ts"],
            zenRequired: true
        },
        
        // Phase 3: Runtime Handler Analysis (Lines 67-107) 
        {
            name: "ARRAY_GET Handler Execution Flow Analysis",
            task: "Trace complete ARRAY_GET execution following plan lines 72-78. Read handlers/arrays.ts ARRAY_GET section completely. Document each branch: ArrayRef, ObjectRef, direct Array, error cases. Map stack operations and type conversion points.",
            planSection: "3.1 ARRAY_GET Handler Deep Dive",
            files: ["packages/vm/src/lib/handlers/arrays.ts"],
            zenRequired: false
        },
        
        {
            name: "Object Handling in ARRAY_GET Critical Analysis",
            task: "Analyze the critical bug following plan lines 80-85. Focus on line 114: 'const key = index as string;' - document this unsafe cast. Check numeric index to string conversion. Test conceptually: what happens with obj[0] vs obj['0']?",
            planSection: "3.1 ARRAY_GET Handler Deep Dive - Object Handling",
            files: ["packages/vm/src/lib/handlers/arrays.ts"],
            zenRequired: false
        },
        
        {
            name: "String Accessor Support Analysis",
            task: "Check string indexing support following plan lines 89-93. Search codebase for string[index] handling. Test conceptually: does 'hello'[0] work? Document if strings are handled by ARRAY_GET or separate logic.",
            planSection: "3.2 String Access Analysis",
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        {
            name: "Cross-Type Behavior Matrix Creation",
            task: "Create behavior matrix following plan lines 95-98. Document actual behavior for: [string, array, object] × [number index, string index]. Compare with expected JavaScript behavior. Identify inconsistencies and missing cases.",
            planSection: "3.3 Cross-Type Consistency Check",
            files: ["packages/vm/src/lib/handlers/arrays.ts", "packages/vm/src/lib/handlers/strings.ts"],
            zenRequired: true
        },
        
        // Phase 4: Missing Functionality Audit (Lines 109-138)
        {
            name: "JavaScript Semantics Comparison",
            task: "Complete feature audit following plan lines 114-124. Check: string[0], array[0], obj['key'], obj[0], negative indices, non-integer indices, out-of-bounds access. Document what works vs what's missing compared to JavaScript.",
            planSection: "4.1 JavaScript Semantics Comparison", 
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        {
            name: "Type Coercion Analysis",
            task: "Analyze index type coercion following plan lines 126-130. Check how obj[1] becomes obj['1'], how arr['0'] becomes arr[0]. Test with boolean, null, undefined indices. Document coercion rules.",
            planSection: "4.2 Type Coercion Analysis",
            files: ["packages/vm/src/lib/handlers/arrays.ts", "packages/types/src/lib/cvm-value.ts"],
            zenRequired: false
        },
        
        {
            name: "Edge Case Inventory",
            task: "Catalog all error conditions following plan lines 132-138. Check null/undefined targets, null/undefined indices, stack underflow scenarios, heap corruption cases. Document what errors occur vs what should occur.",
            planSection: "4.3 Edge Case Inventory",
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        // Phase 5: Reference System Integrity (Lines 140-168)
        {
            name: "Reference Lifecycle Analysis", 
            task: "Trace reference lifecycle following plan lines 145-150. From creation to destruction, check for dangling references, reference counting, garbage collection. Test persistence across CC() calls.",
            planSection: "5.1 Reference Lifecycle Analysis",
            files: ["packages/vm/src/lib/vm-heap.ts", "packages/vm/src/lib/vm-manager.ts"],
            zenRequired: true
        },
        
        {
            name: "Serialization Safety Analysis",
            task: "Examine serialization logic following plan lines 152-157. Read vm-manager.ts serialization. Check reference restoration after CC(), circular reference handling, deep nesting limits. Document the recursive restoreReferences stack overflow risk.",
            planSection: "5.2 Serialization/Deserialization",
            files: ["packages/vm/src/lib/vm-manager.ts"],
            zenRequired: true
        },
        
        {
            name: "Memory Safety Analysis",
            task: "Check heap integrity following plan lines 159-163. Verify bounds on heap access, ID collision handling, heap overflow scenarios, memory leaks. Use Zen for comprehensive safety analysis.",
            planSection: "5.3 Memory Safety",
            files: ["packages/vm/src/lib/vm-heap.ts"],
            zenRequired: true
        },
        
        // Phase 6: Integration Testing Matrix (Lines 170-187)
        {
            name: "Accessor Pattern Matrix Construction",
            task: "Build complete behavior matrix following plan lines 175-181. Create systematic table: Target Type × Index Type × Expected vs Actual behavior. Test each combination conceptually against JavaScript semantics.",
            planSection: "6.1 Accessor Pattern Matrix",
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        {
            name: "Error Condition Matrix Construction", 
            task: "Build error matrix following plan lines 183-187. Document expected vs actual errors for: null[0], undefined[0], 'hello'[-1], array[1.5], invalid heap refs. Compare with JavaScript error behavior.",
            planSection: "6.2 Error Condition Matrix",
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        // Phase 7: Performance & Safety Analysis (Lines 189-208)
        {
            name: "Performance Bottleneck Analysis",
            task: "Identify performance issues following plan lines 194-197. Count type checks per accessor operation, redundant conversions, unnecessary heap lookups. Use Zen for performance analysis.",
            planSection: "7.1 Performance Bottlenecks",
            files: ["packages/vm/src/lib/handlers/arrays.ts"],
            zenRequired: true
        },
        
        {
            name: "Safety Vulnerability Assessment",
            task: "Catalog safety issues following plan lines 199-205. Find all pop()! without bounds checking, unsafe 'as Type' casts, missing type guards. Document potential crash scenarios.",
            planSection: "7.2 Safety Vulnerabilities", 
            files: ["packages/vm/src/lib/handlers/"],
            zenRequired: true
        },
        
        // Final Synthesis
        {
            name: "Complete Architecture Assessment",
            task: "Synthesize all findings following plan lines 210-220. Create final assessment: complete behavior documentation, issue inventory with severity, missing functionality list, architecture inconsistencies, safety vulnerabilities, performance bottlenecks.",
            planSection: "Deliverables Synthesis",
            files: [],
            zenRequired: true
        }
    ];
    
    // Initialize global review file
    CC("" + analysisBase + reviewFile + "Initialize /home/laco/cvm/tasks/cvm-project-review.md with title '# CVM Deep Analysis Review - [] Accessor & Reference System' and introduction explaining this is a comprehensive analysis of the CVM accessor implementation and reference architecture." + submitDone);
    
    // Process all analysis tasks
    console.log("Starting analysis processing. Total tasks: " + analysisTasks.length);
    var i = 0;
    while (i < analysisTasks.length) {
        console.log("\n=== Analysis Task " + (i + 1) + " of " + analysisTasks.length + " ===");
        var task = analysisTasks[i];
        
        var taskName = task["name"];
        var taskAnalysis = task["task"];
        var planSection = task["planSection"];
        var files = task["files"];
        var zenRequired = task["zenRequired"];
        
        console.log("Analyzing: " + taskName);
        console.log("Plan Section: " + planSection);
        
        // Build analysis prompt with full context
        var analysisPrompt = "" + analysisBase + zenHelp + reviewFile + noCodeChanges;
        analysisPrompt = analysisPrompt + "TASK: " + taskAnalysis + " ";
        analysisPrompt = analysisPrompt + "PLAN REFERENCE: " + planSection + " ";
        
        if (files.length > 0) {
            analysisPrompt = analysisPrompt + "FILES TO EXAMINE: " + files.join(", ") + " ";
        }
        
        if (zenRequired) {
            analysisPrompt = analysisPrompt + "REQUIRED: Use mcp__zen__codereview or mcp__zen__analyze for deep analysis with large context. ";
        }
        
        analysisPrompt = analysisPrompt + "DOCUMENT: Write findings to /home/laco/cvm/tasks/cvm-project-review.md under section '## " + taskName + "'. Include specific code references, behavior descriptions, and identified issues." + submitDone;
        
        // Execute analysis task
        CC(analysisPrompt);
        
        completedTasks.push(taskName);
        console.log("Completed analysis: " + taskName);
        
        i = i + 1;
    }
    
    // Final comprehensive summary
    CC("" + analysisBase + reviewFile + "Create final summary section in /home/laco/cvm/tasks/cvm-project-review.md: '## Executive Summary'. Synthesize all findings into: 1) Critical Issues Found, 2) Missing Functionality, 3) Architecture Problems, 4) Safety Concerns, 5) Performance Issues. Prioritize issues by severity and impact." + submitDone);
    
    // Cross-reference with original findings
    CC("" + analysisBase + "Compare findings in /home/laco/cvm/tasks/cvm-project-review.md with original issues in /home/laco/cvm/tasks/code-review-findings.md. Document which issues were confirmed, which were deeper than expected, and what new issues were discovered." + submitDone);
    
    console.log("\n=== CVM Deep Analysis Complete! ===");
    console.log("Completed analysis tasks: " + completedTasks.length);
    console.log("Review document: /home/laco/cvm/tasks/cvm-project-review.md");
    
    return "Deep Analysis Complete - Review Generated";
}