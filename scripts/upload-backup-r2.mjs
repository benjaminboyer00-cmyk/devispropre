#!/usr/bin/env node
/**
 * Upload un dump SQL.gz vers R2 (bucket backups séparé des PDF).
 * Usage: node scripts/upload-backup-r2.mjs backups/devispropre-2026-05-28.sql.gz
 */
import { readFileSync } from "fs";
import { basename } from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/upload-backup-r2.mjs <fichier.sql.gz>");
  process.exit(1);
}

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKey = process.env.R2_ACCESS_KEY_ID?.trim();
const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = (process.env.R2_BACKUP_BUCKET || process.env.R2_BUCKET)?.trim();

if (!accountId || !accessKey || !secretKey || !bucket) {
  console.error("R2 non configuré (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BACKUP_BUCKET ou R2_BUCKET)");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
});

const body = readFileSync(filePath);
const key = `db/${basename(filePath)}`;

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: "application/gzip",
    CacheControl: "private, no-store",
  })
);

console.log(`✓ Backup offsite R2 : s3://${bucket}/${key} (${(body.length / 1024 / 1024).toFixed(2)} Mo)`);
