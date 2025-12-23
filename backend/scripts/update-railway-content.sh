#!/bin/bash

# Master script to update learning content on Railway
# Run this in Railway Shell: bash scripts/update-railway-content.sh

echo "=========================================="
echo "Railway Learning Content Update Script"
echo "=========================================="
echo ""

# Navigate to backend directory
cd backend || {
    echo "❌ Error: Could not navigate to backend directory"
    echo "Make sure you're in the project root"
    exit 1
}

echo "✓ Changed to backend directory"
echo ""

# Step 1: Check current state
echo "Step 1: Checking current database state..."
echo "----------------------------------------"
node scripts/check-module1-section1.js

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Warning: Check script had issues, but continuing..."
fi

echo ""
echo "Press Enter to continue with update, or Ctrl+C to cancel..."
read

# Step 2: Run update script
echo ""
echo "Step 2: Updating learning content..."
echo "----------------------------------------"
node scripts/update-module1-section1-embedded.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Error: Update script failed!"
    echo "Check the error messages above"
    exit 1
fi

echo ""
echo "✓ Update script completed"
echo ""

# Step 3: Verify update
echo "Step 3: Verifying update..."
echo "----------------------------------------"
node scripts/check-module1-section1.js

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ SUCCESS! Content has been updated"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Clear your browser cache (Ctrl+Shift+R)"
    echo "2. Visit your website and check Module 1 Section 1"
    echo "3. Verify the new content appears"
else
    echo ""
    echo "⚠️  Verification had issues - please check manually"
fi

