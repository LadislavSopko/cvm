#!/bin/bash
# Run a single test with optional CC responses

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./run-test.sh <test-path> [cc-response1] [cc-response2] ..."
    echo ""
    echo "Examples:"
    echo "  ./run-test.sh 01-basics/variables-and-output.ts"
    echo "  ./run-test.sh 07-cc-integration/cc-with-objects.ts 42"
    echo "  ./run-test.sh 08-examples/password-validator.ts mypass123 mypass123"
    exit 1
fi

TEST_PATH=$1
shift
CC_RESPONSES=("$@")

# Ensure we're in project root
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the CVM project root"
    exit 1
fi

# Check if test file exists
if [ ! -f "test/programs/$TEST_PATH" ]; then
    echo -e "${RED}Error: Test file 'test/programs/$TEST_PATH' not found${NC}"
    exit 1
fi

# Extract test name
TEST_NAME=$(basename "$TEST_PATH" .ts)
CATEGORY=$(dirname "$TEST_PATH")

echo -e "${YELLOW}Running test: [$CATEGORY] $TEST_NAME${NC}"
echo "========================================"

# Show CC responses if any
if [ ${#CC_RESPONSES[@]} -gt 0 ]; then
    echo "CC Responses:"
    for i in "${!CC_RESPONSES[@]}"; do
        echo "  $((i+1)): ${CC_RESPONSES[$i]}"
    done
    echo ""
fi

# Change to integration directory
cd test/integration

# Run the test
echo "Output:"
echo "--------"

if [ ${#CC_RESPONSES[@]} -eq 0 ]; then
    # No CC responses
    if npx tsx mcp-test-client.ts "../programs/$TEST_PATH"; then
        echo -e "\n${GREEN}✓ Test PASSED${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Test FAILED${NC}"
        exit 1
    fi
else
    # With CC responses
    if npx tsx mcp-test-client.ts "../programs/$TEST_PATH" "${CC_RESPONSES[@]}"; then
        echo -e "\n${GREEN}✓ Test PASSED${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ Test FAILED${NC}"
        exit 1
    fi
fi