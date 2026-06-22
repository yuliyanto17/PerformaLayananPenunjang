// test-db.js

/**
 * Test script untuk dual database connection
 * Run: node test-db.js
 */

const db = require('./src/config/database');

async function testDualDB() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   DUAL DATABASE CONNECTION TEST            ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  try {
    // Test both connections
    const results = await db.testConnections();
    
    // Test Production DB - Query View Pasien
    if (results.production) {
      console.log('\n📊 Testing Production DB - View_PasienMasukPoli');
      console.log('─'.repeat(50));
      
      try {
        const pasienResult = await db.executeProductionQuery(`
          SELECT TOP 5
            No_MR,
            Nama_Pasien,
            Tgl_Masuk,
            Medis,
            No_Reg
          FROM View_PasienMasukPoli
          WHERE CAST(Tgl_Masuk AS DATE) = CAST(GETDATE() AS DATE)
          ORDER BY Tgl_Masuk DESC
        `);
        
        console.log(`✅ Found ${pasienResult.recordset.length} patients today`);
        
        if (pasienResult.recordset.length > 0) {
          console.log('\nSample data:');
          pasienResult.recordset.forEach((row, index) => {
            console.log(`\n${index + 1}. ${row.Nama_Pasien}`);
            console.log(`   No MR: ${row.No_MR}`);
            console.log(`   No Reg: ${row.No_Reg}`);
            console.log(`   Tgl Masuk: ${row.Tgl_Masuk}`);
            console.log(`   Medis: ${row.Medis}`);
          });
        }
      } catch (err) {
        console.log('⚠️  View_PasienMasukPoli might not exist yet');
        console.log('   Error:', err.message);
      }
    }
    
    // Test Local DB - Check Tables
    if (results.local) {
      console.log('\n📊 Testing Local DB - Tables');
      console.log('─'.repeat(50));
      
      try {
        const tablesResult = await db.executeLocalQuery(`
          SELECT 
            TABLE_NAME,
            TABLE_TYPE
          FROM INFORMATION_SCHEMA.TABLES
          WHERE TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `);
        
        console.log(`✅ Found ${tablesResult.recordset.length} tables in local DB`);
        
        if (tablesResult.recordset.length > 0) {
          console.log('\nTables:');
          tablesResult.recordset.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.TABLE_NAME}`);
          });
        } else {
          console.log('ℹ️  No tables yet - will be created from SQL scripts');
        }
      } catch (err) {
        console.log('❌ Error querying local DB:', err.message);
      }
    }
    
    // Summary
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                  ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log(`║ Production DB: ${results.production ? '✅ CONNECTED' : '❌ FAILED    '}          ║`);
    console.log(`║ Local DB:      ${results.local ? '✅ CONNECTED' : '❌ FAILED    '}          ║`);
    console.log('╚════════════════════════════════════════════╝\n');
    
    // Close connections
    await db.closeAllPools();
    
    if (results.production && results.local) {
      console.log('✅ All tests passed!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some connections failed. Check your .env configuration\n');
      process.exit(1);
    }
    
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    await db.closeAllPools();
    process.exit(1);
  }
}

// Run test
testDualDB();