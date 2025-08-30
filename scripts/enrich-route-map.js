const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const tmpPath = path.join(repoRoot, "tmp", "route_service_issues.json");
const outPath = path.join(
  repoRoot,
  "tmp",
  "route_service_issues.enriched.json"
);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/```json|```/g, ""));
}

function scanSrcForHandlers() {
  const files = {};
  const srcDir = path.join(repoRoot, "src");
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.ts$/.test(e.name))
        files[p.replace(srcDir + path.sep, "")] = fs.readFileSync(p, "utf8");
    }
  }
  walk(srcDir);
  return files;
}

function resolveHandlerToken(token, routeFile, srcFiles) {
  // common tokens: requireAuth, auth, validate(schema, ...), async (_req
  token = token || "";
  token = token.trim();
  if (!token) return { token, resolved: null };
  if (token.startsWith("requireAuth") || token === "auth")
    return { token, resolved: "middleware:auth/requireAuth" };
  if (token.startsWith("validate("))
    return { token, resolved: "middleware:validate" };
  if (token.startsWith("async") || token.startsWith("(_req"))
    return { token, resolved: "inline:anonymous" };

  // try to find the token as an imported identifier in the route file
  const routeContent = srcFiles[path.join("routes", routeFile)] || "";
  const importRegex = new RegExp(
    "import\\s+\\{?\\s*([\\w,\\s]+)\\s*\\}?\\s+from\\s+['\"](\\./.*|../.*|.*)['\"]",
    "g"
  );
  let m;
  while ((m = importRegex.exec(routeContent))) {
    const names = m[1].split(",").map((s) => s.trim());
    if (
      names.includes(token) ||
      names.some((n) => n.replace(/as .*$/, "").trim() === token)
    ) {
      return { token, resolved: `import:${m[2]}` };
    }
  }

  // fallback: search across src files for function name
  // Escape token for safe regex usage
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const [file, content] of Object.entries(srcFiles)) {
    const t = esc(token);
    const fnRegex = new RegExp(
      `(?:function\\s+${t}\\s*\\(|const\\s+${t}\\s*=\\s*\\(|let\\s+${t}\\s*=\\s*\\(|var\\s+${t}\\s*=\\s*\\(|${t}\\s*:\\s*function\\s*\\()`
    );
    if (fnRegex.test(content)) return { token, resolved: `file:${file}` };
    const exportRegex = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${t}\\s*\\(`
    );
    if (exportRegex.test(content))
      return { token, resolved: `file-export:${file}` };
  }

  return { token, resolved: null };
}

function main() {
  if (!fs.existsSync(tmpPath)) {
    console.error("mapping not found:", tmpPath);
    process.exit(1);
  }
  const mapping = readJson(tmpPath);
  const srcFiles = scanSrcForHandlers();

  const enriched = {};
  for (const [routeFile, info] of Object.entries(mapping)) {
    enriched[routeFile] = Object.assign({}, info);
    enriched[routeFile].methods = {};
    for (const [method, mInfo] of Object.entries(info.methods || {})) {
      const token = (mInfo.handler || "").replace(/\s+$/g, "");
      const resolved = resolveHandlerToken(token, routeFile, srcFiles);
      enriched[routeFile].methods[method] = Object.assign({}, mInfo, {
        handlerToken: token,
        resolved: resolved.resolved,
      });
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(enriched, null, 2), "utf8");
  console.log("wrote", outPath);
}

main();
