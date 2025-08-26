const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

exports.handler = async function(event) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (event.headers && event.headers.authorization) headers.Authorization = event.headers.authorization;

    const resp = await fetch(`${BACKEND}/api/v1/me`, {
      method: 'GET',
      headers,
    });

    const text = await resp.text();
    return { statusCode: resp.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Bad Gateway', message: err.message }) };
  }
};
