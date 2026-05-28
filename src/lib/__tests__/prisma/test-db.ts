import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth";

let pool: Pool | null = null;
let client: PrismaClient | null = null;
let available: boolean | null = null;

function databaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "postgresql://devispropre:devispropre@localhost:5433/devispropre?schema=public"
  );
}

export async function isTestDatabaseAvailable(): Promise<boolean> {
  if (available !== null) return available;
  const probe = new Pool({
    connectionString: databaseUrl(),
    connectionTimeoutMillis: 2500,
    max: 1,
  });
  try {
    await probe.query("SELECT 1");
    available = true;
  } catch {
    available = false;
  } finally {
    await probe.end().catch(() => undefined);
  }
  return available;
}

export async function getTestPrisma(): Promise<PrismaClient> {
  if (client) return client;
  pool = new Pool({ connectionString: databaseUrl(), max: 5 });
  const adapter = new PrismaPg(pool);
  client = new PrismaClient({ adapter });
  return client;
}

export async function disconnectTestPrisma(): Promise<void> {
  await client?.$disconnect();
  await pool?.end().catch(() => undefined);
  client = null;
  pool = null;
}

export async function createIntegrationUser(prisma: PrismaClient) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return prisma.user.create({
    data: {
      email: `integration-${suffix}@devispropre.test`,
      name: "Integration Test",
      passwordHash: await hashPassword("integration-test-password"),
      plan: "STARTER",
    },
  });
}

export async function deleteIntegrationUser(prisma: PrismaClient, userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
