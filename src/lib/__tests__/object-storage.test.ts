import { afterEach, describe, expect, it } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  archivePdf,
  devisPdfKey,
  readArchivedPdf,
} from "../object-storage";

const PDF_DIR = path.join(process.cwd(), "storage", "pdfs");

describe("object-storage (local)", () => {
  const userId = "user-test";
  const devisId = "devis-test";
  const key = devisPdfKey(userId, devisId);
  const sample = Buffer.from("%PDF-1.4 test archive");

  afterEach(async () => {
    await fs.rm(path.join(PDF_DIR, key), { force: true }).catch(() => {});
  });

  it("archive et relit un PDF localement", async () => {
    const url = await archivePdf(key, sample, `/api/archives/devis/${devisId}`);
    expect(url).toBe(`/api/archives/devis/${devisId}`);

    const stored = await readArchivedPdf(key);
    expect(stored?.equals(sample)).toBe(true);
  });

  it("refuse un buffer vide", async () => {
    await expect(archivePdf(key, Buffer.alloc(0), "/api/archives/devis/x")).rejects.toThrow(
      "vide"
    );
  });
});
