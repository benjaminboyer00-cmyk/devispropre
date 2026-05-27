import { describe, expect, it } from "vitest";
import { parseJwtSessionPayload } from "../jwt";

describe("parseJwtSessionPayload", () => {
  it("accepte un payload session complet", () => {
    const parsed = parseJwtSessionPayload({
      sub: "user_1",
      email: "a@b.fr",
      name: "Jean",
      plan: "FREE",
      jti: "sess_1",
      sv: 0,
    });

    expect(parsed).toEqual({
      sub: "user_1",
      email: "a@b.fr",
      name: "Jean",
      plan: "FREE",
      jti: "sess_1",
      sv: 0,
    });
  });

  it("rejette un JWT legacy sans jti", () => {
    expect(
      parseJwtSessionPayload({
        sub: "user_1",
        email: "a@b.fr",
        name: "Jean",
        plan: "FREE",
      })
    ).toBeNull();
  });
});
