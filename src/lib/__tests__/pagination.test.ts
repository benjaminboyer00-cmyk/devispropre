import { describe, expect, it } from "vitest";
import {
  LIST_PAGE_SIZE,
  buildPageHref,
  paginationBounds,
  parsePageParam,
  totalPages,
} from "../pagination";

describe("pagination", () => {
  it("parsePageParam rejette les valeurs invalides", () => {
    expect(parsePageParam()).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-2")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("3")).toBe(3);
  });

  it("calcule skip/take", () => {
    expect(paginationBounds(1)).toEqual({ skip: 0, take: LIST_PAGE_SIZE });
    expect(paginationBounds(2)).toEqual({ skip: LIST_PAGE_SIZE, take: LIST_PAGE_SIZE });
  });

  it("totalPages et buildPageHref", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(buildPageHref("/dashboard/devis", 1)).toBe("/dashboard/devis");
    expect(buildPageHref("/dashboard/devis", 2)).toBe("/dashboard/devis?page=2");
    expect(buildPageHref("/dashboard/factures", 2, { vue: "brouillons" })).toBe(
      "/dashboard/factures?vue=brouillons&page=2"
    );
  });
});
