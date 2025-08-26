const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

exports.handler = async function(event) {
  try {
    const resp = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: event.body,
    });

    const text = await resp.text();
    return { statusCode: resp.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Bad Gateway', message: err.message }) };
  }
};
