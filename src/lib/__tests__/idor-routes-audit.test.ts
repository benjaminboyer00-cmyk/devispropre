import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = join(process.cwd(), "src/app/api");

/** Routes authentifiées avec segment dynamique — doivent filtrer par userId / workspace. */
const IDOR_ROUTE_PATTERNS = [
  /\[id\]/,
  /\[userId\]/,
];

/** Routes publiques ou système — exemptées de requireAuth. */
const EXEMPT_PATH_FRAGMENTS = [
  "api/public/",
  "api/auth/",
  "api/cron/",
  "api/health",
  "api/stripe/webhook",
  "api/stripe/dev-activate",
  "api/support",
];

function collectRouteFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectRouteFiles(full));
    } else if (entry === "route.ts") {
      out.push(full);
    }
  }
  return out;
}

function isIdorCandidate(relPath: string): boolean {
  if (!IDOR_ROUTE_PATTERNS.some((re) => re.test(relPath))) return false;
  return !EXEMPT_PATH_FRAGMENTS.some((frag) => relPath.includes(frag));
}

describe("Audit IDOR — routes API dynamiques", () => {
  it("chaque route [id] authentifiée référence requireAuth ou assertCronAuth", () => {
    const files = collectRouteFiles(API_ROOT);
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      if (!isIdorCandidate(rel)) continue;

      const src = readFileSync(file, "utf8");
      const hasAuth =
        src.includes("requireAuth") ||
        src.includes("assertCronAuth") ||
        src.includes("getSession");

      if (!hasAuth) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  it("les routes devis/factures/clients [id] filtrent par userId ou workspaceUserId", () => {
    const sensitive = collectRouteFiles(API_ROOT).filter((f) => {
      const rel = relative(process.cwd(), f).replace(/\\/g, "/");
      return (
        isIdorCandidate(rel) &&
        (rel.includes("/devis/") ||
          rel.includes("/factures/") ||
          rel.includes("/clients/") ||
          rel.includes("/archives/"))
      );
    });

    const violations: string[] = [];

    for (const file of sensitive) {
      const rel = relative(process.cwd(), file).replace(/\\/g, "/");
      const src = readFileSync(file, "utf8");
      const filtersUser =
        src.includes("userId:") ||
        src.includes("ctx.userId") ||
        src.includes("auth.workspaceUserId") ||
        src.includes("workspaceUserId");

      if (!filtersUser) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });
});
