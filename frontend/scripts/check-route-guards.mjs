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
 *        a handler that mentions 'refresh' or forwards the whole query string
 *        must use the refreshRequested() owner/guest shape (see REFRESH_BRANCH)
 *   2. still uses the old authGuard()
 *   3. puts an interpolated value in a backend path segment without seg(),
 *      e.g. `/people/${id}` instead of `/people/${seg(id)}`
 *   4. caches a response: `revalidate` (any spelling), `force-cache`, `fetchCache`,
 *      `next: { tags }`. Only the files in REVALIDATE_ALLOWLIST may use
 *      revalidate. Nothing user-shaped is cached until caching is decided per route.
 *   5. runs a backend call or reads the body before its first requireRole(...)
 *
 * Comments are stripped before any rule runs, so text in a comment never counts.
 *  * Mirrors the backend policy; the backend enforces it independently.
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

function routeFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...routeFiles(p));
    else if (e.name === "route.ts" || e.name === "route.js") out.push(p);
  }
  return out;
}

/**
 * Remove // and block comments so text in a comment can never satisfy a rule.
 * String, template and regex-free code only: quotes and template literals
 * (including nested `${ ... `...` ... }`) are skipped over untouched.
 */
function stripComments(src) {
  let out = "";
  let i = 0;
  // Stack of open contexts: "`" for template text, "{" for code inside `${`.
  const stack = [];
  const inTemplate = () => stack[stack.length - 1] === "`";
  while (i < src.length) {
    const c = src[i];
    const n = src[i + 1];
    if (inTemplate()) {
      if (c === "\\") { out += c + (n ?? ""); i += 2; continue; }
      if (c === "`") { stack.pop(); out += c; i += 1; continue; }
      if (c === "$" && n === "{") { stack.push("{"); out += "${"; i += 2; continue; }
      out += c; i += 1; continue;
    }
    if (c === "/" && n === "/") { while (i < src.length && src[i] !== "\n") i += 1; continue; }
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
      out += " ";
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (c === "`") { stack.push("`"); out += c; i += 1; continue; }
    if (c === "{" && stack.length) { stack.push("{"); out += c; i += 1; continue; }
    if (c === "}" && stack[stack.length - 1] === "{" ) { stack.pop(); out += c; i += 1; continue; }
    out += c; i += 1;
  }
  return out;
}

/**
 * Refresh handling. A handler that mentions 'refresh' or forwards a whole query
 * string must use exactly this shape (the only one accepted):
 *
 *   const wantsRefresh = refreshRequested(<x>.getAll('refresh'));
 *   if (wantsRefresh) await requireRole('owner');
 *   else await requireRole('guest');
 *
 * and any 'refresh' sent to the backend must come from that result:
 *   <p>.set('refresh', wantsRefresh ? 'true' : 'false')
 *   if (wantsRefresh) <p>.set('refresh', 'true')       (after <p>.delete('refresh'))
 * A handler that forwards the whole query string must also <p>.delete('refresh').
 * A raw .get('refresh') is never accepted.
 */
const REFRESH_BRANCH =
  /const\s+wantsRefresh\s*=\s*refreshRequested\(\s*[\w.]+\.getAll\(\s*['"]refresh['"]\s*\)\s*\)\s*;\s*if\s*\(\s*wantsRefresh\s*\)\s*await\s+requireRole\(\s*'owner'\s*\)\s*;\s*else\s+await\s+requireRole\(\s*'guest'\s*\)\s*;/;
const REFRESH_SETS = [
  /\w+\.set\(\s*'refresh'\s*,\s*wantsRefresh\s*\?\s*'true'\s*:\s*'false'\s*\)/g,
  /if\s*\(\s*wantsRefresh\s*\)\s*\w+\.set\(\s*'refresh'\s*,\s*'true'\s*\)/g,
];
// Every spelling of "send the client's whole query string to the backend".
const WHOLE_QUERY = [
  /\bsearchParams\.(?:toString|entries|forEach|keys|values)\s*\(/,
  /\.search\b(?!Params)/,
  /new\s+URLSearchParams\(\s*(?:request\.nextUrl\.searchParams|[\w.]*searchParams|[\w.]*\.search)\s*\)/,
  /Object\.fromEntries\(/,
  /\.\.\.\s*[\w.]*searchParams/,
];

// Calls that must not run before the guard.
const BEFORE_GUARD = /\b(?:backendFetch|fetch)\s*\(|\b\w*[rR]equest\.(?:json|text|formData)\s*\(/;

// Caching. Only these files may use revalidate; the `// public-market-data`
// comment in them is documentation, not a switch.
const REVALIDATE_ALLOWLIST = ["search/route.ts"];

/** Check one route file's source; returns { problems, handlers }. */
function checkSource(rel, rawSrc) {
  const src = stripComments(rawSrc);
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

    // The guard must run before any backend call or body read.
    const guardAt = body.indexOf("requireRole(");
    const work = body.match(BEFORE_GUARD);
    if (work && work.index < guardAt) {
      problems.push(`${rel} ${method}: requireRole(...) must come before ${work[0].trim()}`);
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

    // Refresh: owner only, decided by refreshRequested() in the one accepted shape.
    const wholeQuery = WHOLE_QUERY.some((re) => re.test(body));
    const mentionsRefresh = /['"]refresh['"]/.test(body);
    if (wholeQuery || mentionsRefresh) {
      if (!REFRESH_BRANCH.test(body)) {
        problems.push(
          `${rel} ${method}: forwards or reads refresh without the refreshRequested() owner/guest branch (see the shape at the top of the refresh rule)`,
        );
      }
      if (/\.get\(\s*['"]refresh['"]/.test(body)) {
        problems.push(`${rel} ${method}: reads a raw .get('refresh'); use refreshRequested(...getAll('refresh'))`);
      }
      let rest = body;
      for (const re of REFRESH_SETS) rest = rest.replace(re, "");
      if (/\.set\(\s*['"]refresh['"]/.test(rest)) {
        problems.push(`${rel} ${method}: sets refresh from something other than the refreshRequested() result`);
      }
      if (wholeQuery && !/\.delete\(\s*['"]refresh['"]\s*\)/.test(body)) {
        problems.push(`${rel} ${method}: forwards the whole query string without deleting the raw refresh`);
      }
    }
  });

  // Backend path segments: any `/${...}` inside a template literal must be seg(...).
  for (const lit of src.matchAll(/`(\/[^`]*)`/g)) {
    const pathPart = lit[1].split("?")[0];
    for (const hit of pathPart.matchAll(/\/\$\{\s*(?!seg\()([^}]*)\}/g)) {
      problems.push(`${rel}: path segment \${${hit[1].trim()}} is not wrapped in seg()`);
    }
  }

  // Caching: nothing user-shaped is cached until caching is decided per route.
  if (!REVALIDATE_ALLOWLIST.includes(rel) && /\brevalidate\b/.test(src)) {
    problems.push(`${rel}: uses revalidate; only ${REVALIDATE_ALLOWLIST.join(", ")} may cache`);
  }
  if (/\bforce-cache\b/.test(src)) problems.push(`${rel}: uses cache: 'force-cache'`);
  if (/export\s+const\s+fetchCache\b/.test(src)) problems.push(`${rel}: exports fetchCache`);
  if (/next\s*:\s*\{[^}]*\btags\b/.test(src)) problems.push(`${rel}: uses next: { tags }`);

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
    name: "allowlisted revalidate ok",
    rel: "search/route.ts",
    src: "export async function GET() { await requireRole('guest');\n await backendFetch('/x', { next: { revalidate: 30 } }); // public-market-data\n}",
    expectBad: false,
  },
  {
    name: "marker comment does not allow revalidate",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('guest');\n await backendFetch('/x', { next: { revalidate: 30 } }); // public-market-data\n}",
    expectBad: true,
  },
  {
    name: "multi-line next revalidate rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('guest');\n await backendFetch('/x', {\n next: {\n revalidate: 30,\n },\n });\n}",
    expectBad: true,
  },
  {
    name: "force-cache rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('guest'); await backendFetch('/x', { cache: 'force-cache' }); }",
    expectBad: true,
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
    name: "editor role rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await requireRole('editor'); }",
    expectBad: true,
  },
  {
    name: "guard only in a comment rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { // await requireRole('guest');\n await backendFetch('/x'); }",
    expectBad: true,
  },
  {
    name: "guard only in a block comment rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { /* requireRole('guest') */ await backendFetch('/x'); }",
    expectBad: true,
  },
  {
    name: "backendFetch before requireRole rejected",
    rel: "quotes/route.ts",
    src: "export async function GET() { await backendFetch('/x'); await requireRole('guest'); }",
    expectBad: true,
  },
  {
    name: "request.json before requireRole rejected",
    rel: "ideas/route.ts",
    src: "export async function POST(request) { const b = await request.json(); await requireRole('owner'); }",
    expectBad: true,
  },
  {
    name: "refresh branch ok",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh')); if (wantsRefresh) await requireRole('owner'); else await requireRole('guest'); const qs = new URLSearchParams(); qs.set('refresh', wantsRefresh ? 'true' : 'false'); }",
    expectBad: false,
  },
  {
    name: "refresh without owner branch rejected",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { await requireRole('guest'); request.nextUrl.searchParams.getAll('refresh'); }",
    expectBad: true,
  },
  {
    name: "refresh with unconnected owner call rejected",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { await requireRole('guest'); const w = refreshRequested(request.nextUrl.searchParams.getAll('refresh')); if (w) { await requireRole('owner'); } }",
    expectBad: true,
  },
  {
    name: "raw refresh read rejected",
    rel: "stocks/[ticker]/analysis/route.ts",
    src: "export async function GET(request) { const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh')); if (wantsRefresh) await requireRole('owner'); else await requireRole('guest'); qs.set('refresh', request.nextUrl.searchParams.get('refresh')); }",
    expectBad: true,
  },
  {
    name: "request.nextUrl.search without refresh handling rejected",
    rel: "quotes/route.ts",
    src: "export async function GET(request) { await requireRole('guest'); const qs = request.nextUrl.search; }",
    expectBad: true,
  },
  {
    name: "searchParams.toString() without refresh handling rejected",
    rel: "ideas/route.ts",
    src: "export async function GET(request) { await requireRole('guest'); const { searchParams } = new URL(request.url); const qs = searchParams.toString(); }",
    expectBad: true,
  },
  {
    name: "whole query string with branch and delete ok",
    rel: "ideas/route.ts",
    src: "export async function GET(request) { const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh')); if (wantsRefresh) await requireRole('owner'); else await requireRole('guest'); const { searchParams } = new URL(request.url); searchParams.delete('refresh'); if (wantsRefresh) searchParams.set('refresh', 'true'); const qs = searchParams.toString(); }",
    expectBad: false,
  },
  {
    name: "whole query string with branch but no delete rejected",
    rel: "ideas/route.ts",
    src: "export async function GET(request) { const wantsRefresh = refreshRequested(request.nextUrl.searchParams.getAll('refresh')); if (wantsRefresh) await requireRole('owner'); else await requireRole('guest'); const { searchParams } = new URL(request.url); const qs = searchParams.toString(); }",
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
