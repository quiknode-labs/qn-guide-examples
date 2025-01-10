const { Pool } = require('pg');

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
});

module.exports = async (blockNumber) => {
  const query = `
    SELECT data
    FROM "block-metrics"
    WHERE (data->>'blockNumber')::BIGINT = $1
  `;

  try {
    const result = await pool.query(query, [blockNumber]);

    if (result.rows.length > 0) {
      return result.rows[0].data; // Data is already parsed JSON
    } else {
      return null;
    }
  } catch (err) {
    console.error("Database query error:", err.message);
    throw new Error("Failed to fetch block metrics.");
  }
};