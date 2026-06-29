§MBEL:5.0

[FOCUS]
@state::CVMProtocolOutreach
@date::2026-06-29

[COMPLETED]
>audit-2026-06-09::completed✓{security+arch findings→tasks/}
>cvm-pp-spec::docs/PLAN_FORMAT.md{CVM-PPv1.0}✓
>paradigm-framing::clarified✓{CVMsequences+AIdrives+stateManaged}
>readme-updates::CVM-PP announcement+section+QRef✓

[CVMPlanProtocol]
@spec::docs/PLAN_FORMAT.md{title:"CVM Plan Protocol (CVM-PP) Specification"}
@version::1.0
@consumers::parsePlan{mcp-server}+planexecutor{test/programs/tddab}
@format::single-file|multi-file{index+<files>subdirs}
@types::tddab|step{auto-detected via deducePlanType}
@compiled-to::.cvm/uplan.json{type+mission+sourceFile+blocks[]}

[OUTREACH]
→next{update-issue-6-wording}⚠pending{branding→CVM-PP}
→next{add-cvm-skills}⚠pending{2generic:generate-plan,validate-plan}
@external::ndom91/open-plan-annotator#6{requestingCVM-PPexport}
