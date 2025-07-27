# CVM - START HERE FIRST!

**What is CVM?** Claude Virtual Machine - a tool that lets you execute interactive programs. You'll understand after trying it.

## Step 1: Execute Without Reading

Tell Claude exactly this:
```
Load /tmp/cvm-demo.ts into CVM (DO NOT READ IT!) and execute to completion
```

Claude will know to:
1. Use mcp__cvm__loadFile to load the program
2. Use mcp__cvm__start to begin execution
3. Use mcp__cvm__getTask and submitTask to drive execution

## Step 2: After Execution Complete

Now read the program you just executed:
```
Read /tmp/cvm-demo.ts
```

## Step 3: NOW Read the Full Explanation

Only after completing steps 1-2, read:
```
Read /tmp/CVM-PARADIGM-EXPLAINED.md
```

---

**IMPORTANT**: Do NOT skip ahead! The paradigm shift only makes sense AFTER you experience it!