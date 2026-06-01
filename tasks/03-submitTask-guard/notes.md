# Feature: 03-submitTask-guard

## Requirements (from user)
- reportCCResult in vm-manager.ts does not check execution state before resuming
- A submitTask call when state != AWAITING_COGNITIVE_RESULT silently advances the VM
- This caused desync in planexecutor when Claude Code batched tool calls (issue #9)
- Guard must reject submit with clear error if state is wrong
- ai-agent already updated j-cvm-exec-plan.md with sync protocol rules (v2.17.28)

## Analysis
- reportCCResult (vm-manager.ts:215) loads execution, forces status to waiting_cc, and resumes
- No state validation before resume
- MCP server catch block (mcp-server.ts:257) already handles thrown errors → returns isError:true to client
- Fix: add state check at top of reportCCResult, throw if not AWAITING_COGNITIVE_RESULT

## Proposed Solution
- Add 3 lines in reportCCResult after execution null check
- if (execution.state !== 'AWAITING_COGNITIVE_RESULT') throw Error with clear message
- Add test in planexecutor.spec.ts or mcp-server.spec.ts

## Status
- [x] Requirements gathered
- [x] Code analyzed
- [x] Solution proposed
- [ ] Plan created
- [ ] Development done
- [ ] Tested
- [ ] Deployed
