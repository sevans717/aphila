require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Database connections
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Initialize Redis connection
async function initRedis() {
  try {
    await redisClient.connect();
    console.log('✓ Connected to Redis');
  } catch (err) {
    console.error('Redis connection failed:', err.message);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const status = { postgres: 'unknown', redis: 'unknown' };
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    status.postgres = 'ok';
  } catch (err) {
    console.error('Postgres health error:', err.message);
    status.postgres = 'error';
  }

  try {
    await redisClient.ping();
    status.redis = 'ok';
  } catch (err) {
    console.error('Redis health error:', err.message);
    status.redis = 'error';
  }

  const overall = status.postgres === 'ok' && status.redis === 'ok' ? 'ok' : 'degraded';
  res.json({ 
    status: overall, 
    details: status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// List databases
app.get('/databases', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT datname, pg_size_pretty(pg_database_size(datname)) as size FROM pg_database WHERE datistemplate = false;"
    );
    res.json({ 
      databases: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error('List databases error:', err);
    res.status(500).json({ error: 'Failed to list databases' });
  }
});

// Create database and user (Railway-like provisioning)
app.post('/databases', async (req, res) => {
  const { name, description } = req.body;
  
  if (!name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
    return res.status(400).json({ 
      error: 'Invalid database name. Must start with letter and contain only alphanumeric characters and underscores.' 
    });
  }

  try {
    // Generate secure credentials
    const username = `user_${name}_${crypto.randomBytes(4).toString('hex')}`;
    const password = crypto.randomBytes(16).toString('hex');
    
    // Use a new client specifically for database creation (autocommit mode)
    const { Client } = require('pg');
    const adminClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    
    await adminClient.connect();
    
    // Create database (must be in autocommit mode, not in transaction)
    await adminClient.query(`CREATE DATABASE "${name}"`);
    
    // Create user and grant privileges
    await adminClient.query(`CREATE ROLE "${username}" WITH LOGIN PASSWORD '${password}'`);
    await adminClient.query(`GRANT CONNECT ON DATABASE "${name}" TO "${username}"`);
    
    await adminClient.end();
    
    // Store metadata in Redis (Railway-like service registry)
    const metadata = {
      name,
      username,
      created_at: new Date().toISOString(),
      description: description || '',
      status: 'active'
    };
    
    await redisClient.setEx(`db:${name}`, 3600 * 24 * 30, JSON.stringify(metadata)); // 30 days TTL
    
    // Return connection info (Railway-like response)
    res.status(201).json({
      database: {
        name,
        username,
        // Don't return password in logs - in production, use secure delivery
        connection_url: `postgresql://${username}:${password}@localhost:5433/${name}`,
        internal_url: `postgresql://${username}:${password}@postgres:5432/${name}`,
        created_at: metadata.created_at,
        status: 'active'
      }
    });
    
  } catch (err) {
    console.error('Create database error:', err);
    res.status(500).json({ 
      error: 'Failed to create database', 
      details: err.message.includes('already exists') ? 'Database name already taken' : err.message
    });
  }
});

// Get database info
app.get('/databases/:name', async (req, res) => {
  const { name } = req.params;
  
  try {
    // Get from Redis cache first
    const cached = await redisClient.get(`db:${name}`);
    if (cached) {
      const metadata = JSON.parse(cached);
      
      // Get current size from Postgres
      const result = await pool.query(
        "SELECT pg_size_pretty(pg_database_size($1)) as size",
        [name]
      );
      
      res.json({
        database: {
          ...metadata,
          size: result.rows[0]?.size || 'unknown'
        }
      });
    } else {
      res.status(404).json({ error: 'Database not found' });
    }
  } catch (err) {
    console.error('Get database info error:', err);
    res.status(500).json({ error: 'Failed to get database info' });
  }
});

// Basic metrics endpoint (Railway-like observability)
app.get('/metrics', async (req, res) => {
  try {
    const dbStats = await pool.query(`
      SELECT 
        count(*) as database_count,
        sum(pg_database_size(datname)) as total_size
      FROM pg_database 
      WHERE datistemplate = false
    `);
    
    const connectionStats = await pool.query(`
      SELECT 
        count(*) as active_connections,
        max(max_conn) as max_connections
      FROM pg_stat_activity, 
           (SELECT setting::int as max_conn FROM pg_settings WHERE name='max_connections') as mc
    `);
    
    res.json({
      databases: {
        count: parseInt(dbStats.rows[0].database_count),
        total_size_bytes: parseInt(dbStats.rows[0].total_size) || 0
      },
      connections: {
        active: parseInt(connectionStats.rows[0].active_connections),
        max: parseInt(connectionStats.rows[0].max_connections)
      },
      redis: {
        status: redisClient.isOpen ? 'connected' : 'disconnected'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodejs_version: process.version
      }
    });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Recommendation workflow
// POST /recommendations/generate { user_id, limit }
// Generates simple recommendations for a user and stores them in `recommendations` table and Redis cache
app.post('/recommendations/generate', async (req, res) => {
  const { user_id, limit = 20 } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });

  try {
    // Fetch user preferences and location
    const userRes = await pool.query('SELECT id, location, (SELECT genders FROM preferences WHERE user_id = users.id) as genders, birthdate FROM users WHERE id = $1', [user_id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'user not found' });

    // Build a simple candidate query: geo-distance + optional gender filter + exclude self + exclude existing likes
    const genders = user.genders || null;

    let genderFilter = '';
    const params = [user_id, user.location, limit];
    if (genders && genders.length > 0) {
      // Use a simple ANY filter
      genderFilter = 'AND gender = ANY($4)';
      params.splice(2, 0, genders); // insert at position 3
    }

    // crude: order by distance ascending, exclude self and users already liked by or who liked the user
    const candidateQuery = `
      SELECT id, username, display_name, gender, birthdate, location,
        ST_Distance(location, $2) as distance
      FROM users
      WHERE id <> $1
        AND id NOT IN (SELECT to_user FROM likes WHERE from_user = $1)
        ${genderFilter}
      ORDER BY distance ASC
      LIMIT $3
    `;

    const candidateResult = await pool.query(candidateQuery, params.filter(p => p !== undefined));
    const candidates = candidateResult.rows;

    // Insert into recommendations table and cache the list in Redis
    const insertPromises = candidates.map(c => {
      return pool.query(
        `INSERT INTO recommendations (user_id, candidate_id, score, algorithm_version, context, status, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6, now() + interval '7 days')
         ON CONFLICT DO NOTHING`,
        [user_id, c.id, 1.0, 'v1', JSON.stringify({ distance: c.distance }), 'pending']
      );
    });

    await Promise.all(insertPromises);

    const recIds = candidates.map(c => c.id);
    await redisClient.setEx(`recs:${user_id}`, 60 * 60 * 24, JSON.stringify(recIds)); // cache 24h

    res.json({ generated: candidates.length, candidates });
  } catch (err) {
    console.error('Generate recommendations error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// GET /recommendations/:userId - fetch cached recommendations or fallback to recent rows
app.get('/recommendations/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const cached = await redisClient.get(`recs:${userId}`);
    if (cached) {
      const ids = JSON.parse(cached);
      const rows = await pool.query('SELECT r.candidate_id as id, u.username, u.display_name, r.score, r.status FROM recommendations r JOIN users u ON u.id = r.candidate_id WHERE r.user_id = $1 AND r.candidate_id = ANY($2::uuid[]) ORDER BY r.score DESC', [userId, ids]);
      return res.json({ recommendations: rows.rows });
    }

    // Fallback: recent pending recommendations
    const result = await pool.query('SELECT r.candidate_id as id, u.username, u.display_name, r.score, r.status FROM recommendations r JOIN users u ON u.id = r.candidate_id WHERE r.user_id = $1 AND r.status = $2 ORDER BY r.score DESC LIMIT 50', [userId, 'pending']);
    res.json({ recommendations: result.rows });
  } catch (err) {
    console.error('Fetch recommendations error:', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// PATCH /recommendations/:userId - update status for a single recommendation
app.patch('/recommendations/:userId', async (req, res) => {
  const { userId } = req.params;
  const { candidate_id, status } = req.body;
  if (!candidate_id || !status) return res.status(400).json({ error: 'candidate_id and status required' });

  try {
    const result = await pool.query(
      'UPDATE recommendations SET status = $1 WHERE user_id = $2 AND candidate_id = $3 RETURNING *',
      [status, userId, candidate_id]
    );

    // If cached recs exist, invalidate or remove candidate
    const cached = await redisClient.get(`recs:${userId}`);
    if (cached) {
      const ids = JSON.parse(cached).filter(id => id !== candidate_id);
      await redisClient.setEx(`recs:${userId}`, 60 * 60 * 24, JSON.stringify(ids));
    }

    if (result.rowCount === 0) return res.status(404).json({ error: 'Recommendation not found' });
    res.json({ updated: result.rows[0] });
  } catch (err) {
    console.error('Update recommendation status error:', err);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

// POST /recommendations/:userId/seen { candidate_ids: [] } - mark many recs as shown/seen
app.post('/recommendations/:userId/seen', async (req, res) => {
  const { userId } = req.params;
  const { candidate_ids } = req.body;
  if (!Array.isArray(candidate_ids)) return res.status(400).json({ error: 'candidate_ids array required' });

  try {
    await pool.query(
      'UPDATE recommendations SET status = $1 WHERE user_id = $2 AND candidate_id = ANY($3::uuid[])',
      ['shown', userId, candidate_ids]
    );

    // Update cache: remove seen ids
    const cached = await redisClient.get(`recs:${userId}`);
    if (cached) {
      const ids = JSON.parse(cached).filter(id => !candidate_ids.includes(id));
      await redisClient.setEx(`recs:${userId}`, 60 * 60 * 24, JSON.stringify(ids));
    }

    res.json({ marked: candidate_ids.length });
  } catch (err) {
    console.error('Mark seen error:', err);
    res.status(500).json({ error: 'Failed to mark recommendations as seen' });
  }
});

// Start server
async function startServer() {
  await initRedis();
  
  app.listen(port, () => {
    console.log(`🚄 Railway-like DB Provisioner running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(`💾 Admin UI: http://localhost:8080 (Adminer)`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await redisClient.quit();
  await pool.end();
  process.exit(0);
});

startServer().catch(console.error);
