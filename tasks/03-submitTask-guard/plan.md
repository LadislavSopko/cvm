<mission>
Add state guard to reportCCResult in VMManager. Currently submitTask accepts results regardless of execution state, which can desync the plan executor if called out of order. The guard must reject submitTask when execution.state !== 'AWAITING_COGNITIVE_RESULT', returning a clear error via the existing MCP error handling chain. Related: GitHub issue #9.
</mission>

<block id="state-guard" title="reportCCResult state validation guard">
<intro>
vm-manager.ts reportCCResult (line 215) loads execution from storage but does not validate that execution.state is AWAITING_COGNITIVE_RESULT before calling vm.resume(). Add a guard that throws if the state is wrong. The MCP server catch block at mcp-server.ts:257 already converts thrown errors into isError:true responses to the client.
</intro>
<red>
- test: reportCCResult throws when execution state is COMPLETED
- test: reportCCResult throws when execution state is READY
- test: reportCCResult throws when execution state is ERROR
- test: reportCCResult succeeds when execution state is AWAITING_COGNITIVE_RESULT (existing behavior, ensure no regression)
</red>
<success>
- reportCCResult throws Error with message containing 'AWAITING_COGNITIVE_RESULT' when state is COMPLETED
- reportCCResult throws Error with message containing 'AWAITING_COGNITIVE_RESULT' when state is READY
- reportCCResult throws Error with message containing 'AWAITING_COGNITIVE_RESULT' when state is ERROR
- reportCCResult still works normally when state is AWAITING_COGNITIVE_RESULT
- All existing tests in packages/vm and packages/mcp-server pass
</success>
</block>
