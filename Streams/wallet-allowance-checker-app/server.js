require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query('SELECT NOW()', (err, result) => {
    release();
    if (err) {
      return console.error('Error executing query', err.stack);
    }
    console.log('Connected to database successfully');
  });
});

const app = express();
app.use(cors());

app.get('/api/wallet-approval-states/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const result = await pool.query(
      'SELECT latest_approvals, approval_history FROM wallet_approval_states WHERE wallet_address = $1', //replace wallet_approval_states with your table name
      [walletAddress]
    );

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'Wallet address not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));