const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const enrichedPath = path.join(
  repoRoot,
  "tmp",
  "route_service_issues.enriched.json"
);
const outPath = path.join(
  repoRoot,
  "tmp",
  "route_service_issues.resolved.json"
);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8").replace(/```json|```/g, ""));
}

function resolveImportToken(token, currentRouteFile) {
  // token example: import:../controllers/auth.controller
  if (!token || !token.startsWith("import:")) return null;
  const rel = token.replace("import:", "");
  // try .ts extension
  const base = path.join(
    repoRoot,
    "src",
    currentRouteFile.replace(/[^/\\]+$/, "")
  );
  const candidate = path.normalize(path.join(base, rel + ".ts"));
  if (fs.existsSync(candidate))
    return { file: path.relative(repoRoot, candidate), path: candidate };
  // try without prefix (maybe absolute relative to src)
  const alt = path.normalize(path.join(repoRoot, "src", rel));
  if (fs.existsSync(alt))
    return { file: path.relative(repoRoot, alt), path: alt };
  // try with index.ts
  const altIndex = alt + ".ts";
  if (fs.existsSync(altIndex))
    return { file: path.relative(repoRoot, altIndex), path: altIndex };
  return { file: rel, path: null };
}

function listExportsFromFile(p) {
  if (!p || !fs.existsSync(p)) return [];
  const src = fs.readFileSync(p, "utf8");
  const exports = new Set();
  // named exports: export function name( | export const name = | export async function name(
  const re =
    /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(src))) exports.add(m[1]);
  // export { a, b as c }
  const re2 = /export\s*\{([^}]+)\}/g;
  while ((m = re2.exec(src))) {
    const parts = m[1].split(",").map((s) => s.trim());
    for (const ppart of parts)
      exports.add(ppart.replace(/as\s+.*$/, "").trim());
  }
  return Array.from(exports);
}

function main() {
  if (!fs.existsSync(enrichedPath)) {
    console.error("enriched mapping not found", enrichedPath);
    process.exit(1);
  }
  const mapping = readJson(enrichedPath);
  const resolved = {};
  for (const [routeFile, info] of Object.entries(mapping)) {
    resolved[routeFile] = Object.assign({}, info);
    resolved[routeFile].methods = {};
    for (const [method, mInfo] of Object.entries(info.methods || {})) {
      const r = Object.assign({}, mInfo);
      if (mInfo.resolved && mInfo.resolved.startsWith("import:")) {
        const target = resolveImportToken(mInfo.resolved, routeFile);
        r.importFile = target.file;
        r.importPath = target.path;
        r.exports = listExportsFromFile(target.path);
      }
      resolved[routeFile].methods[method] = r;
    }
  }
  fs.writeFileSync(outPath, JSON.stringify(resolved, null, 2), "utf8");
  console.log("wrote", outPath);
}

main();
