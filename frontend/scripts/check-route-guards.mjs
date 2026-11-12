#!/usr/bin/env node
/**
 * Build-time guard check for API routes (runs as `prebuild`).
 *
 * Fails the build when an API route handler:
 *   1. doesn't call requireRole(...), or calls it with too low a role:
 *        GET                          -> 'guest' or higher
 *        any other method            -> 'owner'
 *          (except GUEST_WRITES, e.g. POST stock chat -> 'guest')
 *        every method under connections/ and users/ -> 'owner'
 *        portfolio/equity-curve/      -> 'owner' on every method
 *        a GET that reads a `refresh` search parameter (or forwards the raw
 *        query string) must call requireRole('owner') for the refresh case
 *   2. still uses the old authGuard()
 *   3. puts an interpolated value in a backend path segment without seg(),
 *      e.g. `/people/${id}` instead of `/people/${seg(id)}`
 *   4. caches a fetch (`next: { revalidate`, `export const revalidate`)
 *      without the `// public-market-data` comment on that line. Nothing
 *      user-shaped is cached until caching is decided per route.
 *
 * Mirrors the backend policy; the backend enforces it independently.
 * Why: the 11/2026 security review found routes that only checked "signed
 * in", plus route params that could climb out to other backend endpoints.
 * Middleware also checks roles, but this keeps every route safe on its own.
 *
 * Run by hand: npm run check:routes
 * Rule self-check: node scripts/check-route-guards.mjs --self-test
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(here, "..", "src", "app", "api");

const RANK = { guest: 1, family: 1, owner: 3 };
const GUEST_WRITES = ["stocks/[ticker]/chat/route.ts:POST"];
const OWNER_ONLY_DIRS = ["connections/", "users/", "portfolio/equity-curve/"];
const PUBLIC_MARKET_DATA = "// public-market-data";

function routeFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...routeFiles(p));
    else if (e.name === "route.ts" || e.name === "route.js") out.push(p);
  }
  return out;
}

/** Check one route file's source; returns { problems, handlers }. */
function checkSource(rel, src) {
  const problems = [];
  let handlers = 0;

  if (/\bauthGuard\s*\(/.test(src)) {
    problems.push(`${rel}: uses authGuard(); use requireRole(...)`);
  }

  // Handlers: `export async function GET(` ... up to the next export.
  const marks = [...src.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)];
  if (/export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/.test(src)) {
    problems.push(`${rel}: handler exported as a const; use \`export async function\` so it can be checked`);
  }

  marks.forEach((m, i) => {
    handlers += 1;
    const method = m[1];
    const body = src.slice(m.index, i + 1 < marks.length ? marks[i + 1].index : src.length);
    const args = [...body.matchAll(/requireRole\(\s*([^)]*?)\s*\)/g)].map((g) => g[1]);

    let min = method === "GET" ? "guest" : "owner";
    if (GUEST_WRITES.includes(`${rel}:${method}`)) min = "guest";
    if (OWNER_ONLY_DIRS.some((d) => rel.startsWith(d))) min = "owner";

    if (!args.length) {
      problems.push(`${rel} ${method}: no requireRole(...) call`);
      return;
    }
    // Every call in the handler must be a known role and meet the minimum,
    // so a conditional branch cannot hide a low one.
    for (const arg of args) {
      const role = arg.match(/^['"](\w+)['"]$/)?.[1];
      if (!role || !(role in RANK)) {
        problems.push(`${rel} ${method}: requireRole(${arg}) is not one of guest, family, owner`);
      } else if (RANK[role] < RANK[min]) {
        problems.push(`${rel} ${method}: requireRole('${role}') is too low; needs '${min}' or higher`);
      }
    }

    // A refresh forces a backend recompute: owner only. Reading the
    // `refresh` parameter, or forwarding the raw query string, needs an owner branch.
    const forwardsRefresh =
      /get\(\s*['"]refresh['"]\s*\)/.test(body) || /searchParams\.toString\(\)|nextUrl\.search\b/.test(body);
    if (method === "GET" && forwardsRefresh && !/requireRole\(\s*['"]owner['"]\s*\)/.test(body)) {
      problems.push(`${rel} GET: forwards a refresh parameter but has no requireRole('owner') branch`);
    }
  });

  // Backend path segments: any `/${...}` inside a template literal must be seg(...).
  for (const lit of src.matchAll(/`(\/[^`]*)`/g)) {
    const pathPart = lit[1].split("?")[0];
    for (const hit of pathPart.matchAll(/\/\$\{\s*(?!seg\()([^}]*)\}/g)) {
      problems.push(`${rel}: path segment \${${hit[1].trim()}} is not wrapped in seg()`);
    }
  }

  // Caching: nothing user-shaped. Pure market-data lines carry the marker.
  src.split("\n").forEach((line, n) => {
    if (/next:\s*\{\s*revalidate\b|export\s+const\s+revalidate\b/.test(line) && !line.includes(PUBLIC_MARKET_DATA)) {
      problems.push(
        `${rel}:${n + 1}: caches a response; remove revalidate or mark pure market data with \`${PUBLIC_MARKET_DATA}\``,
      );
    }
  });

  return { problems, handlers };
}

// Each sample: the rules must report at least one problem (expectBad) or none.
const SAMPLES = [
  {
    name: "guest GET ok",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('guest'); }",
    expectBad: false,
  },
  {
    name: "viewer rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('viewer'); }",
    expectBad: true,
  },
  {
    name: "non-owner POST rejected",
    rel: "ideas/route.ts",
    src: "export async function POST() { await requireRole('guest'); }",
    expectBad: true,
  },
  {
    name: "chat POST guest ok",
    rel: "stocks/[ticker]/chat/route.ts",
    src: "export async function POST() { await requireRole('guest'); }",
    expectBad: false,
  },
  {
    name: "connections GET guest rejected",
    rel: "connections/route.ts",
    src: "export async function GET() { await requireRole('guest'); }",
    expectBad: true,
  },
  {
    name: "unmarked revalidate rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('guest'); await backendFetch('/x', { next: { revalidate: 30 } }); }",
    expectBad: true,
  },
  {
    name: "marked revalidate ok",
    rel: "search/route.ts",
    src: "export async function GET() { await requireRole('guest');\n await backendFetch('/x', { next: { revalidate: 30 } }); // public-market-data\n}",
    expectBad: false,
  },
  {
    name: "equity curve guest GET rejected",
    rel: "portfolio/equity-curve/route.ts",
    src: "export async function GET() { await requireRole('guest'); }",
    expectBad: true,
  },
  {
    name: "equity curve owner GET ok",
    rel: "portfolio/equity-curve/route.ts",
    src: "export async function GET() { await requireRole('owner'); }",
    expectBad: false,
  },
  {
    name: "refresh without owner branch rejected",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { await requireRole('guest'); request.nextUrl.searchParams.get('refresh'); }",
    expectBad: true,
  },
  {
    name: "refresh with owner branch ok",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { const r = request.nextUrl.searchParams.get('refresh'); if (r) await requireRole('owner'); else await requireRole('guest'); }",
    expectBad: false,
  },
  {
    name: "editor role rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('editor'); }",
    expectBad: true,
  },
];

if (process.argv.includes("--self-test")) {
  let failed = 0;
  for (const t of SAMPLES) {
    const bad = checkSource(t.rel, t.src).problems.length > 0;
    const ok = bad === t.expectBad;
    if (!ok) failed += 1;
    console.log(`${ok ? "ok  " : "FAIL"} ${t.name}`);
  }
  if (failed) {
    console.error(`\ncheck-route-guards self-test: ${failed} of ${SAMPLES.length} failed`);
    process.exit(1);
  }
  console.log(`check-route-guards self-test: ${SAMPLES.length} samples OK`);
  process.exit(0);
}

const problems = [];
let handlerCount = 0;

for (const file of routeFiles(apiRoot)) {
  const rel = path.relative(apiRoot, file).replaceAll("\\", "/");
  if (rel.startsWith("auth/")) continue; // NextAuth's own handlers
  const result = checkSource(rel, fs.readFileSync(file, "utf8"));
  problems.push(...result.problems);
  handlerCount += result.handlers;
}

if (problems.length) {
  console.error(`\ncheck-route-guards: ${problems.length} problem(s)\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nSee the requireRole / seg docs in src/lib/api-client.ts.\n");
  process.exit(1);
}

console.log(`check-route-guards: ${handlerCount} API handlers OK`);
