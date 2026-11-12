#!/usr/bin/env node
/**
 * Build-time guard check for API routes (runs as `prebuild`).
 *
 * Fails the build when an API route handler:
 *   1. doesn't call requireRole(...), or calls it with too low a role:
 *        GET                          -> 'viewer' or higher
 *        POST / PUT / PATCH / DELETE  -> 'editor' or higher
 *        mutations under /api/connections -> 'owner'
 *   2. still uses the old authGuard()
 *   3. puts an interpolated value in a backend path segment without seg(),
 *      e.g. `/people/${id}` instead of `/people/${seg(id)}`
 *
 * Why: the 11/2026 security review found routes that only checked "signed
 * in", plus route params that could climb out to other backend endpoints.
 * Middleware also checks roles, but this keeps every route safe on its own.
 *
 * Run by hand: npm run check:routes
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(here, "..", "src", "app", "api");

const RANK = { viewer: 1, editor: 2, owner: 3 };
const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function routeFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...routeFiles(p));
    else if (e.name === "route.ts" || e.name === "route.js") out.push(p);
  }
  return out;
}

const problems = [];
let handlerCount = 0;

for (const file of routeFiles(apiRoot)) {
  const rel = path.relative(apiRoot, file).replaceAll("\\", "/");
  if (rel.startsWith("auth/")) continue; // NextAuth's own handlers

  const src = fs.readFileSync(file, "utf8");

  if (/\bauthGuard\s*\(/.test(src)) {
    problems.push(`${rel}: uses authGuard(); use requireRole(...)`);
  }

  // Handlers: `export async function GET(` ... up to the next export.
  const marks = [...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)];
  if (/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/.test(src)) {
    problems.push(`${rel}: handler exported as a const; use \`export async function\` so it can be checked`);
  }

  marks.forEach((m, i) => {
    handlerCount += 1;
    const method = m[1];
    const body = src.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : src.length);
    const guard = body.match(/requireRole\(\s*['"](viewer|editor|owner)['"]\s*\)/);

    let min = "viewer";
    if (MUTATING.has(method)) min = rel.startsWith("connections/") ? "owner" : "editor";

    if (!guard) {
      problems.push(`${rel} ${method}: no requireRole(...) call`);
    } else if (RANK[guard[1]] < RANK[min]) {
      problems.push(`${rel} ${method}: requireRole('${guard[1]}') is too low; needs '${min}' or higher`);
    }
  });

  // Backend path segments: any `/${...}` inside a template literal must be seg(...).
  for (const lit of src.matchAll(/`(\/[^`]*)`/g)) {
    const pathPart = lit[1].split("?")[0];
    for (const hit of pathPart.matchAll(/\/\$\{\s*(?!seg\()([^}]*)\}/g)) {
      problems.push(`${rel}: path segment \${${hit[1].trim()}} is not wrapped in seg()`);
    }
  }
}

if (problems.length) {
  console.error(`\ncheck-route-guards: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nSee the requireRole / seg docs in src/lib/api-client.ts.\n");
  process.exit(1);
}

console.log(`check-route-guards: ${handlerCount} API handlers OK`);
