-- Slug public lisible (devis-dev-2026-0003) en complément du token opaque
ALTER TABLE "Devis" ADD COLUMN "shareSlug" TEXT;
ALTER TABLE "Facture" ADD COLUMN "shareSlug" TEXT;

CREATE UNIQUE INDEX "Devis_shareSlug_key" ON "Devis"("shareSlug");
CREATE UNIQUE INDEX "Facture_shareSlug_key" ON "Facture"("shareSlug");

WITH base AS (
  SELECT
    id,
    'devis-' || lower(regexp_replace(trim("numero"), '[^a-zA-Z0-9]+', '-', 'g')) AS slug
  FROM "Devis"
  WHERE "shareToken" IS NOT NULL AND trim("numero") <> ''
),
ranked AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY "sentAt" NULLS LAST, id) AS rn
  FROM base
  WHERE slug <> 'devis-' AND slug <> 'devis'
)
UPDATE "Devis" d
SET "shareSlug" = CASE WHEN r.rn = 1 THEN r.slug ELSE r.slug || '-' || left(d.id, 6) END
FROM ranked r
WHERE d.id = r.id;

WITH base AS (
  SELECT
    id,
    'facture-' || lower(regexp_replace(trim("numero"), '[^a-zA-Z0-9]+', '-', 'g')) AS slug
  FROM "Facture"
  WHERE "shareToken" IS NOT NULL AND trim("numero") <> ''
),
ranked AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY "issuedAt" NULLS LAST, id) AS rn
  FROM base
  WHERE slug <> 'facture-' AND slug <> 'facture'
)
UPDATE "Facture" f
SET "shareSlug" = CASE WHEN r.rn = 1 THEN r.slug ELSE r.slug || '-' || left(f.id, 6) END
FROM ranked r
WHERE f.id = r.id;
