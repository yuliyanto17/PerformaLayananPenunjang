// run-sql.js

/**
 * Helper script untuk run SQL files
 * Usage: node run-sql.js <filename>
 * Example: node run-sql.js 01_create_tables
 */

const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function runSQLFile(filename) {
  try {
    const filepath = path.join(__dirname, 'src/database/scripts', `${filename}.sql`);
    
    console.log(`\n📄 Reading file: ${filepath}`);
    
    if (!fs.existsSync(filepath)) {
      console.error(`❌ File not found: ${filepath}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(filepath, 'utf8');
    
    console.log(`📊 Executing SQL script...\n`);
    console.log('─'.repeat(50));
    
    // Split by GO statement
    const batches = sql
      .split(/^\s*GO\s*$/gim)
      .filter(batch => batch.trim().length > 0);
    
    console.log(`Found ${batches.length} batches to execute\n`);
    
    const pool = await db.getLocalPool();
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i].trim();
      
      if (batch.length === 0) continue;
      
      // Skip comments only batches
      if (batch.match(/^--.*$/gm) && !batch.match(/[^-\s]/)) continue;
      
      try {
        const result = await pool.request().batch(batch);
        
        // Print messages from SQL (PRINT statements)
        if (result.output) {
          console.log(result.output);
        }
        
      } catch (err) {
        console.error(`\n❌ Error in batch ${i + 1}:`);
        console.error(err.message);
        console.error('\nBatch content:');
        console.error(batch.substring(0, 200) + '...');
        throw err;
      }
    }
    
    console.log('\n' + '─'.repeat(50));
    console.log(`✅ SQL script executed successfully\n`);
    
    await db.closeAllPools();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Failed to run SQL script:', error.message);
    await db.closeAllPools();
    process.exit(1);
  }
}

// Get filename from command line argument
const filename = process.argv[2];

if (!filename) {
  console.log(`
Usage: node run-sql.js <filename>

Available scripts:
  • 01_create_tables  - Create all tables
  • 02_seed_data      - Insert seed data
  • 03_create_views   - Create views

Example:
  node run-sql.js 01_create_tables
  `);
  process.exit(1);
}

runSQLFile(filename);