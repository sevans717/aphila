Param()

# Serve the public directory on port 8888 using http-server. Install with: npm i -g http-server
# Fallback: use 'npx http-server' if not installed globally.
$port = 8888
if (Get-Command npx -ErrorAction SilentlyContinue) {
  Write-Output "Using npx http-server to serve ./public on port $port"
  npx http-server ./public -p $port
} else {
  Write-Output "Using http-server to serve ./public on port $port"
  http-server ./public -p $port
}
