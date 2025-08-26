const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`📥 Received ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Simple server working!', 
    timestamp: new Date().toISOString(),
    url: req.url 
  }));
});

const PORT = 3002;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Simple test server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
