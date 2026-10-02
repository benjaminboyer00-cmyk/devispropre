-- Journal d'audit chaîné (hash de l'entrée précédente) et append-only.

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EXPORT_PROOF';

ALTER TABLE "AuditLog" ADD COLUMN "seq" INTEGER;
ALTER TABLE "AuditLog" ADD COLUMN "prevHash" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "entryHash" TEXT;

CREATE UNIQUE INDEX "AuditLog_userId_seq_key" ON "AuditLog"("userId", "seq");

-- Append-only : aucune suppression, et seules les FK devisId/factureId (hors empreinte)
-- peuvent changer. Les tests d'intégration lèvent le verrou via
-- SET LOCAL app.audit_maintenance = 'on' dans une transaction.
CREATE OR REPLACE FUNCTION audit_log_append_only() RETURNS trigger AS $$
BEGIN
  IF current_setting('app.audit_maintenance', true) = 'on' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'AuditLog est en ajout seul (suppression interdite)';
  END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."userId" IS DISTINCT FROM OLD."userId"
    OR NEW."action" IS DISTINCT FROM OLD."action"
    OR NEW."entityType" IS DISTINCT FROM OLD."entityType"
    OR NEW."entityId" IS DISTINCT FROM OLD."entityId"
    OR NEW."metadata" IS DISTINCT FROM OLD."metadata"
    OR NEW."ipAddress" IS DISTINCT FROM OLD."ipAddress"
    OR NEW."userAgent" IS DISTINCT FROM OLD."userAgent"
    OR NEW."contentHash" IS DISTINCT FROM OLD."contentHash"
    OR NEW."seq" IS DISTINCT FROM OLD."seq"
    OR NEW."prevHash" IS DISTINCT FROM OLD."prevHash"
    OR NEW."entryHash" IS DISTINCT FROM OLD."entryHash"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt" THEN
    RAISE EXCEPTION 'AuditLog est en ajout seul (modification interdite)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "AuditLog_append_only"
  BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
