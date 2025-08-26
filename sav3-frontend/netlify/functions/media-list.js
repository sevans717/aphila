const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

exports.handler = async function(event) {
  try {
    const query = event.queryStringParameters ? Object.entries(event.queryStringParameters).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';
    const headers = { 'Content-Type': 'application/json' };
    if (event.headers && event.headers.authorization) headers.Authorization = event.headers.authorization;

    const resp = await fetch(`${BACKEND}/api/v1/media${query ? `?${query}` : ''}`, {
      method: 'GET',
      headers,
    });

    const text = await resp.text();
    return { statusCode: resp.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Bad Gateway', message: err.message }) };
  }
};
