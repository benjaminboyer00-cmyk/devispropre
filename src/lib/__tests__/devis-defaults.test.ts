import { describe, expect, it } from "vitest";
import {
  defaultValidUntilDate,
  defaultValidUntilInputValue,
  formatDateInputValue,
  parseValidUntilInput,
} from "../devis-defaults";

describe("devis-defaults", () => {
  it("ajoute 30 jours par défaut", () => {
    const from = new Date(2026, 0, 1, 12, 0, 0);
    const until = defaultValidUntilDate(from);
    expect(until.getFullYear()).toBe(2026);
    expect(until.getMonth()).toBe(0);
    expect(until.getDate()).toBe(31);
  });

  it("parse une date input YYYY-MM-DD en local", () => {
    const d = parseValidUntilInput("2026-06-15");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(15);
  });

  it("formatDateInputValue évite le décalage UTC", () => {
    const local = new Date(2026, 5, 15, 12, 0, 0);
    expect(formatDateInputValue(local)).toBe("2026-06-15");
  });

  it("fournit une valeur date input", () => {
    expect(defaultValidUntilInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
