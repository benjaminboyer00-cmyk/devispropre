import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { assertCronAuth } from "../cron-auth";

describe("assertCronAuth", () => {
  it("rejette GET avec 405", () => {
    const req = new NextRequest("http://localhost/api/cron/reminders", { method: "GET" });
    const res = assertCronAuth(req);
    expect(res?.status).toBe(405);
  });

  it("rejette POST sans Bearer", () => {
    const req = new NextRequest("http://localhost/api/cron/reminders", { method: "POST" });
    const res = assertCronAuth(req);
    expect(res?.status).toBe(401);
  });
});
