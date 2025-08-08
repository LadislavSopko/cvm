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

# Function to get CC responses for a test
get_cc_responses() {
    local test_name=$1
    local category=$2
    
    # First check for .responses file
    local response_file="test/programs/$category/${test_name}.responses"
    if [ -f "$response_file" ]; then
        # Read all lines from file and join with spaces
        local responses=""
        while IFS= read -r line; do
            if [ -z "$responses" ]; then
                responses="$line"
            else
                responses="$responses $line"
            fi
        done < "$response_file"
        echo "$responses"
        return
    fi
    
    # Fall back to hardcoded responses
    case "$category/$test_name" in
        "01-basics/return-types") echo "string" ;;
        "02-operators/comparison-operators") echo "5" ;;
        "02-operators/logical-operators") echo "25 yes secure123 secure123 75 yes 3 14" ;;
        "02-operators/new-operators") echo "100 4 85" ;;
        "02-operators/ternary-operator") echo "25" ;;
        "02-operators/unary-operators") echo "42" ;;
        "03-control-flow/if-else-while") echo "20 85 7 3" ;;
        "04-data-structures/objects-complex") echo "John 30 Engineer Jane 25 Designer" ;;
        "04-data-structures/objects-comprehensive") echo "Alice 28 Boston Hello World" ;;
        "05-strings/string-length") echo "password123 John" ;;
        "07-cc-integration/cc-multiple-calls") echo "Alice 30 Bob 25" ;;
        "07-cc-integration/cc-with-objects") echo "42" ;;
        "07-cc-integration/objects-with-cc") echo "CVM\ project\ summary Architecture\ design\ summary Features\ capabilities\ summary Final\ comprehensive\ report" ;;
        "08-examples/execution-management") echo "Alice analyze\ code 8" ;;
        "08-examples/password-validator") echo "mypass123 mypass123" ;;
        "09-comprehensive/all-features") echo "Hello\ World! 25 85 92" ;;
        "09-comprehensive/phase2-features") echo "30 secure123 secure123" ;;
        "09-comprehensive/string-array-methods-all") echo "\ \ test.js\ \  C:\\Users\\test\\file.txt 42 projects user@example.com INFO Application\ started" ;;
        "09-comprehensive/test-new-language-features") echo "start 1" ;;
        "09-comprehensive/complex-feature-combinations") echo "start status stop" ;;
        *) echo "" ;;
    esac
}

# Run each test in the category
for test_file in test/programs/$CATEGORY/*.ts; do
    if [ -f "$test_file" ]; then
        TOTAL=$((TOTAL + 1))
        test_name=$(basename "$test_file" .ts)
        echo -e "\nRunning: $test_name"
        
        # Change to integration directory
        cd test/integration
        
        relative_path="../programs/$CATEGORY/$(basename "$test_file")"
        
        # Check for .responses file first
        response_file="../programs/$CATEGORY/${test_name}.responses"
        if [ -f "$response_file" ]; then
            # Read responses into an array
            CC_RESPONSES=()
            while IFS= read -r line; do
                CC_RESPONSES+=("$line")
            done < "$response_file"
            
            # Run with responses from file
            if npx tsx mcp-test-client.ts "$relative_path" "${CC_RESPONSES[@]}" > /tmp/test-output.log 2>&1; then
                echo -e "${GREEN}✓ PASSED${NC}"
                PASSED=$((PASSED + 1))
            else
                echo -e "${RED}✗ FAILED${NC}"
                echo "Output:"
                cat /tmp/test-output.log
                FAILED=$((FAILED + 1))
            fi
        else
            # Get hardcoded CC responses for this test
            cc_responses=$(get_cc_responses "$test_name" "$CATEGORY")
            
            # Run test with or without CC responses
            if [ -z "$cc_responses" ]; then
                # No CC responses needed
                if npx tsx mcp-test-client.ts "$relative_path" > /tmp/test-output.log 2>&1; then
                    echo -e "${GREEN}✓ PASSED${NC}"
                    PASSED=$((PASSED + 1))
                else
                    echo -e "${RED}✗ FAILED${NC}"
                    echo "Output:"
                    cat /tmp/test-output.log
                    FAILED=$((FAILED + 1))
                fi
            else
                # CC responses needed
                if npx tsx mcp-test-client.ts "$relative_path" $cc_responses > /tmp/test-output.log 2>&1; then
                    echo -e "${GREEN}✓ PASSED${NC}"
                    PASSED=$((PASSED + 1))
                else
                    echo -e "${RED}✗ FAILED${NC}"
                    echo "Output:"
                    cat /tmp/test-output.log
                    FAILED=$((FAILED + 1))
                fi
            fi
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