#!/usr/bin/env node
// Simple one-command script to update Railway content

/**
 * Simple one-command script to update Railway content
 * Run: node scripts/update-railway-simple.js
 */

const { initDatabase, getDatabase } = require('../database/init');
const { updateModule1Section1 } = require('./update-module1-section1-embedded');

async function updateRailwayContent() {
  console.log('');
  console.log('='.repeat(60));
  console.log('RAILWAY CONTENT UPDATE - AUTOMATED');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Step 1: Initialize database
    console.log('Step 1: Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized');
    console.log('');

    // Step 2: Check current state
    console.log('Step 2: Checking current content...');
    const db = getDatabase();
    
    const findSectionQuery = `
      SELECT s.id, s.display_name, m.display_name as module_name
      FROM sections s 
      JOIN modules m ON s.module_id = m.id 
      WHERE m.display_name = 'Security Awareness Essentials' 
      AND s.display_name = 'Phishing and Social Engineering'
      AND s.order_index = 1
    `;
    
    const section = await new Promise((resolve, reject) => {
      db.get(findSectionQuery, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!section) {
      console.error('❌ Error: Section not found!');
      process.exit(1);
    }

    console.log(`✓ Found section: ${section.module_name} > ${section.display_name} (ID: ${section.id})`);
    
    // Check existing content count
    const contentCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM learning_content WHERE section_id = ?', [section.id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });
    
    console.log(`✓ Current content items: ${contentCount}`);
    console.log('');

    // Step 3: Run update
    console.log('Step 3: Updating learning content...');
    console.log('─'.repeat(60));
    await updateModule1Section1();
    console.log('');

    // Step 4: Verify update
    console.log('Step 4: Verifying update...');
    const newContentCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM learning_content WHERE section_id = ?', [section.id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.count : 0);
      });
    });

    const introExists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM learning_content WHERE section_id = ? AND screen_title = ?', [section.id, 'Introduction'], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    const keyConceptsExists = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM learning_content WHERE section_id = ? AND screen_title = ?', [section.id, 'Key Concepts'], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    console.log(`✓ Total content items after update: ${newContentCount}`);
    console.log(`✓ Introduction: ${introExists ? '✓ EXISTS' : '❌ MISSING'}`);
    console.log(`✓ Key Concepts: ${keyConceptsExists ? '✓ EXISTS' : '❌ MISSING'}`);
    console.log('');

    // Final summary
    console.log('='.repeat(60));
    if (introExists && keyConceptsExists) {
      console.log('✅ SUCCESS! Content has been updated on Railway');
      console.log('='.repeat(60));
      console.log('');
      console.log('📋 Next steps:');
      console.log('  1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
      console.log('  2. Visit your production website');
      console.log('  3. Navigate to: Learn → Security Awareness Essentials → Phishing and Social Engineering');
      console.log('  4. Verify the new content appears');
      console.log('');
    } else {
      console.log('⚠️  WARNING: Update may have had issues');
      console.log('='.repeat(60));
      console.log('');
      console.log('Please run the diagnostic script:');
      console.log('  node scripts/check-module1-section1.js');
      console.log('');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    console.error('Please check the error above and try again.');
    process.exit(1);
  }
}

// Run the update
updateRailwayContent();

