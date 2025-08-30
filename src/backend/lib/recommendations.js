const { Pool } = require('pg');
const { createClient } = require('redis');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function ensureRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}

async function generateForUser(userId, limit = 20) {
  await ensureRedis();

  const userRes = await pool.query('SELECT id, location, (SELECT genders FROM preferences WHERE user_id = users.id) as genders FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  if (!user) throw new Error('user not found');

  const genders = user.genders || null;
  let genderFilter = '';
  const params = [userId, user.location, limit];
  if (genders && genders.length > 0) {
    genderFilter = 'AND gender = ANY($4)';
    params.splice(2, 0, genders);
  }

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

  const insertPromises = candidates.map(c => {
    return pool.query(
      `INSERT INTO recommendations (user_id, candidate_id, score, algorithm_version, context, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() + interval '7 days')
       ON CONFLICT DO NOTHING`,
      [userId, c.id, 1.0, 'v1', JSON.stringify({ distance: c.distance }), 'pending']
    );
  });

  await Promise.all(insertPromises);
  const recIds = candidates.map(c => c.id);
  await redisClient.setEx(`recs:${userId}`, 60 * 60 * 24, JSON.stringify(recIds));

  return candidates;
}

module.exports = { generateForUser };
