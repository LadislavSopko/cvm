# Step Plan: Sample Cleanup
**Date:** 2026-05-27

<mission>
Test project for step plan E2E validation. Two cleanup steps
that remove files and verify the test suite stays green.
</mission>

<block id="01-config">
## TDDAB-1: Clean Config

<intro>
Remove legacy config entries from test config file.
</intro>

<actions>
- action: Remove legacy entries from config
- action: Verify no old references remain
</actions>

<success>
- [ ] config file cleaned
- [ ] no legacy references found
</success>
</block>

<block id="02-remove-files">
## TDDAB-2: Remove Legacy Files

<intro>
Remove legacy source files that are no longer used.
Depends on step 01.
</intro>

<actions>
- action: Delete legacy source files
- action: Run test suite to confirm nothing breaks
</actions>

<success>
- [ ] legacy files removed
- [ ] test suite passes
</success>
</block>
