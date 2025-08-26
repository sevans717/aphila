const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

function guessService(fileName) {
  // e.g. media.routes.ts -> MediaService
  const base = fileName.replace(/\.routes?\.ts$/, '').replace(/\.ts$/, '');
  const parts = base.split(/[\.\-_/]/).filter(Boolean);
  const name = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return `${name}Service`;
}

function extractRoutes(content) {
  const methods = {};
  const routerRegex = /router\.(get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\2\s*,\s*([^,)\n]+)/g;
  let m;
  while ((m = routerRegex.exec(content)) !== null) {
    const method = m[1].toUpperCase();
    const route = m[3];
    let handler = m[4].trim();
    // trim trailing chars: , )
    handler = handler.replace(/\)\s*$/, '').replace(/,$/, '').trim();
    // keep only first token (in case of array or middleware list)
    handler = handler.split(/\s|\,|\)/)[0];
    const key = `${method} ${route}`;
    methods[key] = { status: 'scanned', handler };
  }
  return methods;
}

function main() {
  const routesDir = path.join(__dirname, '..', 'src', 'routes');
  if (!fs.existsSync(routesDir)) {
    console.error('Routes directory not found:', routesDir);
    process.exit(1);
  }
  const files = walk(routesDir).filter((f) => f.endsWith('.ts'));
  const mapping = {};
  files.forEach((filePath) => {
    const rel = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const methods = extractRoutes(content);
    mapping[fileName] = {
      service: guessService(fileName),
      status: Object.keys(methods).length ? 'scanned' : 'not-scanned',
      methods,
    };
  });

  const outDir = path.join(__dirname, '..', 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'route_service_issues.json');
  fs.writeFileSync(outPath, JSON.stringify(mapping, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main();
