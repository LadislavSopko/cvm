#!/bin/bash
# Run tests for a specific category

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: ./run-category.sh <category>"
    echo "Categories:"
    echo "  01-basics"
    echo "  02-operators"
    echo "  03-control-flow"
    echo "  04-data-structures"
    echo "  05-strings"
    echo "  06-file-system"
    echo "  07-cc-integration"
    echo "  08-examples"
    echo "  09-comprehensive"
    exit 1
fi

CATEGORY=$1

# Ensure we're in project root
if [ ! -f "package.json" ]; then
    echo "Error: This script must be run from the CVM project root"
    exit 1
fi

# Check if category exists
if [ ! -d "test/programs/$CATEGORY" ]; then
    echo -e "${RED}Error: Category '$CATEGORY' not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Running tests for category: $CATEGORY${NC}"
echo "========================================"

# Rebuild if requested
if [ "$2" == "--rebuild" ]; then
    echo -e "${YELLOW}Rebuilding packages...${NC}"
    npx nx reset
    npx nx run-many --target=build --all --skip-nx-cache
fi

# Count tests
TOTAL=0
PASSED=0
FAILED=0

# Run each test in the category
for test_file in test/programs/$CATEGORY/*.ts; do
    if [ -f "$test_file" ]; then
        TOTAL=$((TOTAL + 1))
        test_name=$(basename "$test_file" .ts)
        echo -e "\nRunning: $test_name"
        
        # Change to integration directory
        cd test/integration
        
        # Determine if test needs CC responses based on common patterns
        relative_path="../programs/$CATEGORY/$(basename "$test_file")"
        
        # Default: no CC responses
        if npx tsx mcp-test-client.ts "$relative_path" > /tmp/test-output.log 2>&1; then
            echo -e "${GREEN}✓ PASSED${NC}"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            echo "Output:"
            cat /tmp/test-output.log
            FAILED=$((FAILED + 1))
        fi
        
        # Return to root
        cd ../..
    fi
done

# Summary
echo -e "\n${YELLOW}======================================${NC}"
echo -e "${YELLOW}Summary for $CATEGORY:${NC}"
echo -e "Total: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

# Exit code
if [ $FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi