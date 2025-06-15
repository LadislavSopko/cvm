#!/bin/bash
# Test script for CVM server npm package

echo "Testing CVM server npm package..."
echo "Current version: 0.2.1"
echo ""

# Clear any cached versions
echo "Clearing npm cache..."
rm -rf ~/.npm/_npx/*

# Test direct execution
echo "Testing direct execution with npx..."
timeout 2s npx cvm-server@0.2.1 2>&1 | head -5

echo ""
echo "Package test complete!"
echo ""
echo "To use in your MCP configuration, copy the .mcp.json file"
echo "to your Claude Desktop configuration directory."