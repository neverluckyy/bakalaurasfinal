const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

/**
 * Helper script to convert CSV file to embedded JavaScript data format
 * 
 * Usage:
 *   node scripts/generate-embedded-data.js [path-to-csv-file]
 * 
 * This will read the CSV and output JavaScript code that can be pasted
 * into update-module1-section1-embedded.js
 */

const csvFilePath = process.argv[2] || path.join(__dirname, '../../teaching_material_social_engineering.csv');

// Try multiple possible locations
const possiblePaths = [
  csvFilePath,
  'C:\\Users\\yoga\\Downloads\\teaching_material_social_engineering.csv',
  path.join(__dirname, '../../teaching_material_social_engineering.csv'),
  path.join(__dirname, '../../../teaching_material_social_engineering.csv'),
  path.join(__dirname, '../../social_engineering_learning_material.csv'),
  path.join(__dirname, '../../../social_engineering_learning_material.csv')
];

let foundPath = null;
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    foundPath = possiblePath;
    break;
  }
}

if (!foundPath) {
  console.error('CSV file not found. Tried:');
  possiblePaths.forEach(p => console.error('  -', p));
  console.error('\nUsage: node scripts/generate-embedded-data.js [path-to-csv-file]');
  process.exit(1);
}

console.log(`Reading CSV from: ${foundPath}\n`);

const results = [];

fs.createReadStream(foundPath)
  .pipe(csv())
  .on('data', (data) => {
    results.push(data);
  })
  .on('end', () => {
    console.log(`Read ${results.length} rows from CSV\n`);
    console.log('='.repeat(80));
    console.log('COPY THE CODE BELOW AND PASTE IT INTO update-module1-section1-embedded.js');
    console.log('Replace the csvData array with this:');
    console.log('='.repeat(80));
    console.log('\nconst csvData = [\n');
    
    results.forEach((row, index) => {
      // Escape backslashes and quotes in strings
      const escapeString = (str) => {
        if (!str) return '""';
        return JSON.stringify(str);
      };
      
      const topic = escapeString(row['Topic'] || row.Topic || '');
      const teachingMaterial = escapeString(row['Teaching_Material'] || row.Teaching_Material || '');
      const activityPrompt = escapeString(row['Activity_Prompt'] || row.Activity_Prompt || '');
      const references = escapeString(row['References'] || row.References || '');
      
      console.log('  {');
      console.log(`    Topic: ${topic},`);
      console.log(`    Teaching_Material: ${teachingMaterial},`);
      console.log(`    Activity_Prompt: ${activityPrompt},`);
      console.log(`    References: ${references}`);
      console.log('  }' + (index < results.length - 1 ? ',' : ''));
    });
    
    console.log('];\n');
    console.log('='.repeat(80));
    console.log('Done! Copy the array above and paste it into update-module1-section1-embedded.js');
  })
  .on('error', (error) => {
    console.error('Error reading CSV file:', error);
    process.exit(1);
  });

