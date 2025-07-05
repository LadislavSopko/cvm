#!/bin/bash
# CVM Test Suite Runner
# This script runs all tests in the organized test directory structure

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Test results log
RESULTS_LOG="test-results.log"
echo "CVM Test Results - $(date)" > $RESULTS_LOG
echo "======================================" >> $RESULTS_LOG

# Function to run a test
run_test() {
    local test_file=$1
    shift
    local cc_responses=("$@")
    
    TOTAL=$((TOTAL + 1))
    
    # Extract test name from path
    local test_name=$(basename "$test_file" .ts)
    local category=$(basename $(dirname "$test_file"))
    
    echo -e "\n${YELLOW}[$category]${NC} Running: $test_name"
    echo -e "\n[$category] $test_name" >> $RESULTS_LOG
    
    # Change to integration directory
    cd test/integration
    
    # Run the test
    if [ ${#cc_responses[@]} -eq 0 ]; then
        # No CC responses needed
        if npx tsx mcp-test-client.ts "$test_file" >> $RESULTS_LOG 2>&1; then
            echo -e "${GREEN}✓ PASSED${NC}"
            echo "PASSED" >> $RESULTS_LOG
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            echo "FAILED" >> $RESULTS_LOG
            FAILED=$((FAILED + 1))
        fi
    else
        # CC responses provided
        if npx tsx mcp-test-client.ts "$test_file" "${cc_responses[@]}" >> $RESULTS_LOG 2>&1; then
            echo -e "${GREEN}✓ PASSED${NC}"
            echo "PASSED" >> $RESULTS_LOG
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            echo "FAILED" >> $RESULTS_LOG
            FAILED=$((FAILED + 1))
        fi
    fi
    
    # Return to root
    cd ../..
}

echo "CVM Test Suite Runner"
echo "===================="
echo "Starting test run..."

# First, ensure we're in the project root
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the CVM project root"
    exit 1
fi

# Rebuild all packages
echo -e "\n${YELLOW}Rebuilding all packages...${NC}"
npx nx reset
npx nx run-many --target=build --all --skip-nx-cache

# Run tests by category

echo -e "\n${YELLOW}=== 01-basics ===${NC}"
run_test "../programs/01-basics/variables-and-output.ts"
run_test "../programs/01-basics/implicit-main.ts"
run_test "../programs/01-basics/return-values.ts"
run_test "../programs/01-basics/return-types.ts" "string"
run_test "../programs/01-basics/return-with-output.ts"

echo -e "\n${YELLOW}=== 02-operators ===${NC}"
run_test "../programs/02-operators/comparison-operators.ts" "5"
run_test "../programs/02-operators/compound-assignments.ts"
run_test "../programs/02-operators/logical-operators.ts" "25" "yes" "secure123" "secure123" "75" "yes" "3" "14"
run_test "../programs/02-operators/new-operators.ts" "100" "4" "85"
run_test "../programs/02-operators/ternary-operator.ts" "25"
run_test "../programs/02-operators/unary-operators.ts" "42"
run_test "../programs/02-operators/undefined-handling.ts"

echo -e "\n${YELLOW}=== 03-control-flow ===${NC}"
run_test "../programs/03-control-flow/block-scoping.ts"
run_test "../programs/03-control-flow/for-of-loops.ts"
run_test "../programs/03-control-flow/for-of-with-files.ts"
run_test "../programs/03-control-flow/if-else-while.ts" "20" "85" "7" "3"
run_test "../programs/03-control-flow/if-statements-basic.ts"

echo -e "\n${YELLOW}=== 04-data-structures ===${NC}"
run_test "../programs/04-data-structures/array-indexing.ts"
run_test "../programs/04-data-structures/array-push-objects.ts"
run_test "../programs/04-data-structures/arrays-basic.ts"
run_test "../programs/04-data-structures/inline-object-push.ts"
run_test "../programs/04-data-structures/objects-basic.ts"
run_test "../programs/04-data-structures/objects-complex.ts" "John" "30" "Engineer" "Jane" "25" "Designer"
run_test "../programs/04-data-structures/objects-comprehensive.ts" "Alice" "28" "Boston" "Hello" "World"
run_test "../programs/04-data-structures/objects-with-variables.ts"

echo -e "\n${YELLOW}=== 05-strings ===${NC}"
run_test "../programs/05-strings/string-length.ts" "password123" "John"
run_test "../programs/05-strings/string-methods.ts"
run_test "../programs/05-strings/string-methods-extended.ts"
run_test "../programs/05-strings/tostring-conversion.ts"
run_test "../programs/05-strings/tostring-and-implicit-main.ts"

echo -e "\n${YELLOW}=== 06-file-system ===${NC}"
run_test "../programs/06-file-system/file-persistence.ts"
run_test "../programs/06-file-system/list-files-basic.ts"
run_test "../programs/06-file-system/list-files-iteration.ts"
run_test "../programs/06-file-system/load-file-test.ts"
run_test "../programs/06-file-system/read-file.ts"
run_test "../programs/06-file-system/read-write-combined.ts"
run_test "../programs/06-file-system/write-file.ts"
# file-operations-with-cc.ts needs specific setup, skipping for now

echo -e "\n${YELLOW}=== 07-cc-integration ===${NC}"
run_test "../programs/07-cc-integration/cc-multiple-calls.ts" "Alice" "30" "Bob" "25"
run_test "../programs/07-cc-integration/cc-with-objects.ts" "42"
run_test "../programs/07-cc-integration/objects-with-cc.ts" "TestUser"

echo -e "\n${YELLOW}=== 08-examples ===${NC}"
run_test "../programs/08-examples/execution-management.ts" "Alice" "analyze code" "8"
run_test "../programs/08-examples/password-validator.ts" "mypass123" "mypass123"
# restart-example.ts requires special handling, skipping

echo -e "\n${YELLOW}=== 09-comprehensive ===${NC}"
# all-features.ts: text processing, age, score, final score
run_test "../programs/09-comprehensive/all-features.ts" "Hello World!" "25" "85" "92"
# phase2-features.ts: age, password, confirm password
run_test "../programs/09-comprehensive/phase2-features.ts" "30" "secure123" "secure123"
# string-array-methods-all.ts: filename, windows path, invoice#, search pattern, email, log level, log message
run_test "../programs/09-comprehensive/string-array-methods-all.ts" "  test.js  " "C:\\Users\\test\\file.txt" "42" "projects" "user@example.com" "INFO" "Application started"
# test-new-language-features.ts: action, test choice
run_test "../programs/09-comprehensive/test-new-language-features.ts" "start" "1"
# complex-feature-combinations.ts: 3 commands for while loop cycles
run_test "../programs/09-comprehensive/complex-feature-combinations.ts" "start" "status" "stop"

# Summary
echo -e "\n${YELLOW}======================================${NC}"
echo -e "${YELLOW}Test Summary:${NC}"
echo -e "Total tests run: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

# Write summary to log
echo -e "\n======================================" >> $RESULTS_LOG
echo "Summary: Total=$TOTAL, Passed=$PASSED, Failed=$FAILED" >> $RESULTS_LOG

# Test artifacts are now in test/integration/tmp/ which is gitignored

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Check $RESULTS_LOG for details.${NC}"
    exit 1
fi