// src/config/database.js

/**
 * ============================================
 * DUAL DATABASE CONNECTION CONFIGURATION
 * ============================================
 * 
 * Mengatur 2 koneksi database:
 * 1. Production DB (Read-only) - untuk data pasien
 * 2. Local DB (Read/Write) - untuk CRUD performa layanan
 * 
 * Setiap database punya connection pool sendiri
 */

const sql = require('mssql');
require('dotenv').config();

/**
 * ============================================
 * PRODUCTION DATABASE CONFIG (READ ONLY)
 * ============================================
 * Untuk mengambil data dari View_PasienMasukPoli
 * dan master data lain dari SIMRS
 */
const dbProductionConfig = {
  user: process.env.DB_PROD_USER,
  password: process.env.DB_PROD_PASSWORD,
  server: process.env.DB_PROD_SERVER,
  database: process.env.DB_PROD_DATABASE,
  port: parseInt(process.env.DB_PROD_PORT) || 1433,
  
  options: {
    encrypt: process.env.DB_PROD_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_PROD_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    // Tambahan untuk production
    readOnlyIntent: true,  // Hint ke SQL Server bahwa ini read-only
    connectTimeout: 15000, // Lebih cepat timeout jika production down
  },
  
  pool: {
    min: parseInt(process.env.DB_PROD_POOL_MIN) || 2,
    max: parseInt(process.env.DB_PROD_POOL_MAX) || 5,
    idleTimeoutMillis: parseInt(process.env.DB_PROD_IDLE_TIMEOUT) || 30000,
  },
  
  connectionTimeout: parseInt(process.env.DB_PROD_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: parseInt(process.env.DB_PROD_REQUEST_TIMEOUT) || 30000,
};

/**
 * ============================================
 * LOCAL DATABASE CONFIG (READ/WRITE)
 * ============================================
 * Untuk CRUD data performa layanan
 */
const dbLocalConfig = {
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  server: process.env.DB_LOCAL_SERVER,
  database: process.env.DB_LOCAL_DATABASE,
  port: parseInt(process.env.DB_LOCAL_PORT) || 1433,
  
  options: {
    encrypt: process.env.DB_LOCAL_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_LOCAL_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  
  pool: {
    min: parseInt(process.env.DB_LOCAL_POOL_MIN) || 2,
    max: parseInt(process.env.DB_LOCAL_POOL_MAX) || 10,
    idleTimeoutMillis: parseInt(process.env.DB_LOCAL_IDLE_TIMEOUT) || 30000,
  },
  
  connectionTimeout: parseInt(process.env.DB_LOCAL_CONNECTION_TIMEOUT) || 30000,
  requestTimeout: parseInt(process.env.DB_LOCAL_REQUEST_TIMEOUT) || 30000,
};

/**
 * Connection Pools
 * Singleton pattern untuk masing-masing database
 */
let productionPoolPromise = null;
let localPoolPromise = null;

/**
 * ============================================
 * GET PRODUCTION POOL (READ ONLY)
 * ============================================
 */
const getProductionPool = () => {
  if (!productionPoolPromise) {
    productionPoolPromise = new sql.ConnectionPool(dbProductionConfig)
      .connect()
      .then(pool => {
        console.log('✅ Connected to PRODUCTION database (Read-Only)');
        console.log(`   Server: ${dbProductionConfig.server}`);
        console.log(`   Database: ${dbProductionConfig.database}`);
        
        pool.on('error', err => {
          console.error('❌ Production DB pool error:', err.message);
          productionPoolPromise = null;
        });
        
        return pool;
      })
      .catch(err => {
        console.error('❌ Failed to connect to Production DB:', err.message);
        productionPoolPromise = null;
        throw err;
      });
  }
  
  return productionPoolPromise;
};

/**
 * ============================================
 * GET LOCAL POOL (READ/WRITE)
 * ============================================
 */
const getLocalPool = () => {
  if (!localPoolPromise) {
    localPoolPromise = new sql.ConnectionPool(dbLocalConfig)
      .connect()
      .then(pool => {
        console.log('✅ Connected to LOCAL database (Read/Write)');
        console.log(`   Server: ${dbLocalConfig.server}`);
        console.log(`   Database: ${dbLocalConfig.database}`);
        
        pool.on('error', err => {
          console.error('❌ Local DB pool error:', err.message);
          localPoolPromise = null;
        });
        
        return pool;
      })
      .catch(err => {
        console.error('❌ Failed to connect to Local DB:', err.message);
        localPoolPromise = null;
        throw err;
      });
  }
  
  return localPoolPromise;
};

/**
 * ============================================
 * EXECUTE QUERY ON PRODUCTION DB
 * ============================================
 * Untuk query ke database production (read-only)
 * 
 * @param {string} query - SQL query
 * @param {object} params - Query parameters
 * @returns {Promise<object>}
 * 
 * Contoh:
 * const pasien = await executeProductionQuery(
 *   'SELECT * FROM View_PasienMasukPoli WHERE No_MR = @noMR',
 *   { noMR: '812151' }
 * );
 */
const executeProductionQuery = async (query, params = {}) => {
  try {
    const pool = await getProductionPool();
    const request = pool.request();
    
    // Bind parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
    
  } catch (err) {
    console.error('❌ Production query error:', err.message);
    throw err;
  }
};

/**
 * ============================================
 * EXECUTE QUERY ON LOCAL DB
 * ============================================
 * Untuk query ke database lokal (read/write)
 * 
 * @param {string} query - SQL query
 * @param {object} params - Query parameters
 * @returns {Promise<object>}
 * 
 * Contoh:
 * const result = await executeLocalQuery(
 *   'INSERT INTO m_layanan (layanan_name) VALUES (@name)',
 *   { name: 'Radiologi' }
 * );
 */
const executeLocalQuery = async (query, params = {}) => {
  try {
    const pool = await getLocalPool();
    const request = pool.request();
    
    // Bind parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(query);
    return result;
    
  } catch (err) {
    console.error('❌ Local query error:', err.message);
    throw err;
  }
};

/**
 * ============================================
 * EXECUTE STORED PROCEDURE ON PRODUCTION DB
 * ============================================
 */
const executeProductionSP = async (procedureName, params = {}) => {
  try {
    const pool = await getProductionPool();
    const request = pool.request();
    
    Object.keys(params).forEach(key => {
      const param = params[key];
      if (param.type && param.value !== undefined) {
        request.input(key, param.type, param.value);
      } else {
        request.input(key, param);
      }
    });
    
    const result = await request.execute(procedureName);
    return result;
    
  } catch (err) {
    console.error('❌ Production SP error:', err.message);
    throw err;
  }
};

/**
 * ============================================
 * EXECUTE STORED PROCEDURE ON LOCAL DB
 * ============================================
 */
const executeLocalSP = async (procedureName, params = {}) => {
  try {
    const pool = await getLocalPool();
    const request = pool.request();
    
    Object.keys(params).forEach(key => {
      const param = params[key];
      if (param.type && param.value !== undefined) {
        request.input(key, param.type, param.value);
      } else {
        request.input(key, param);
      }
    });
    
    const result = await request.execute(procedureName);
    return result;
    
  } catch (err) {
    console.error('❌ Local SP error:', err.message);
    throw err;
  }
};

/**
 * ============================================
 * TRANSACTION SUPPORT (LOCAL DB ONLY)
 * ============================================
 * Untuk operasi yang butuh transaction (INSERT/UPDATE/DELETE multiple tables)
 * 
 * @param {Function} callback - Async function yang akan dijalankan dalam transaction
 * @returns {Promise<any>}
 * 
 * Contoh penggunaan:
 * await executeTransaction(async (transaction) => {
 *   await transaction.request()
 *     .input('name', 'Test')
 *     .query('INSERT INTO table1 VALUES (@name)');
 *   
 *   await transaction.request()
 *     .input('id', 1)
 *     .query('UPDATE table2 SET status = 1 WHERE id = @id');
 * });
 */
const executeTransaction = async (callback) => {
  const pool = await getLocalPool();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // Jalankan callback dengan transaction object
    const result = await callback(transaction);
    
    await transaction.commit();
    return result;
    
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Transaction error:', err.message);
    throw err;
  }
};

/**
 * ============================================
 * TEST CONNECTIONS
 * ============================================
 */
const testConnections = async () => {
  const results = {
    production: false,
    local: false,
  };
  
  // Test Production DB
  try {
    console.log('\n🔍 Testing PRODUCTION database connection...');
    const pool = await getProductionPool();
    await pool.request().query('SELECT 1 as test');
    console.log('✅ Production DB connection OK');
    results.production = true;
  } catch (err) {
    console.error('❌ Production DB connection FAILED:', err.message);
  }
  
  // Test Local DB
  try {
    console.log('\n🔍 Testing LOCAL database connection...');
    const pool = await getLocalPool();
    await pool.request().query('SELECT 1 as test');
    console.log('✅ Local DB connection OK');
    results.local = true;
  } catch (err) {
    console.error('❌ Local DB connection FAILED:', err.message);
  }
  
  return results;
};

/**
 * ============================================
 * CLOSE ALL CONNECTIONS
 * ============================================
 */
const closeAllPools = async () => {
  const promises = [];
  
  if (productionPoolPromise) {
    promises.push(
      productionPoolPromise
        .then(pool => pool.close())
        .then(() => console.log('✅ Production DB pool closed'))
        .catch(err => console.error('❌ Error closing production pool:', err.message))
    );
    productionPoolPromise = null;
  }
  
  if (localPoolPromise) {
    promises.push(
      localPoolPromise
        .then(pool => pool.close())
        .then(() => console.log('✅ Local DB pool closed'))
        .catch(err => console.error('❌ Error closing local pool:', err.message))
    );
    localPoolPromise = null;
  }
  
  await Promise.all(promises);
};

/**
 * ============================================
 * HELPER: GET POOL BY NAME
 * ============================================
 * Untuk flexibility, bisa ambil pool by name
 */
const getPool = (dbName = 'local') => {
  switch (dbName.toLowerCase()) {
    case 'production':
    case 'prod':
      return getProductionPool();
    case 'local':
    case 'default':
    default:
      return getLocalPool();
  }
};

/**
 * ============================================
 * EXPORTS
 * ============================================
 */
module.exports = {
  sql,                          // SQL types & utilities
  
  // Connection Pools
  getProductionPool,            // Get production pool
  getLocalPool,                 // Get local pool
  getPool,                      // Get pool by name
  
  // Query Execution
  executeProductionQuery,       // Query production DB (read-only)
  executeLocalQuery,            // Query local DB (read/write)
  executeProductionSP,          // Execute SP on production
  executeLocalSP,               // Execute SP on local
  executeTransaction,           // Transaction support (local only)
  
  // Utilities
  testConnections,              // Test both connections
  closeAllPools,                // Close all pools
};