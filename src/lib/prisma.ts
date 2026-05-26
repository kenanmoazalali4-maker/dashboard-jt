import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

// =============================================
// Raw SQL helpers for QBCore tables
// =============================================

export async function getPlayers(limit = 200) {
  const query = limit > 0
    ? `SELECT * FROM players ORDER BY id DESC LIMIT ${limit}`
    : `SELECT * FROM players ORDER BY id DESC`;
  const result: any[] = await prisma.$queryRawUnsafe(query);
  return result;
}

export async function getPlayerCount() {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM players`
  );
  return Number(result[0]?.count || 0);
}

export async function getVehicles(limit = 500) {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT pv.*, p.name as ownerName FROM player_vehicles pv LEFT JOIN players p ON pv.citizenid = p.citizenid ORDER BY pv.id DESC LIMIT ${limit}`
  );
  return result;
}

export async function getVehicleCount() {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM player_vehicles`
  );
  return Number(result[0]?.count || 0);
}

export async function deleteVehicle(id: number) {
  await prisma.$queryRawUnsafe(`DELETE FROM player_vehicles WHERE id = ?`, id);
}

export async function getBans() {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT * FROM bans ORDER BY id DESC`
  );
  return result;
}

export async function getBanCount() {
  const result: any[] = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*) as count FROM bans`
  );
  return Number(result[0]?.count || 0);
}

export async function addBan(name: string, license: string, reason: string, expire: Date | null, bannedby: string, permanent: number) {
  await prisma.$queryRawUnsafe(
    `INSERT INTO bans (name, license, reason, expire, bannedby, permanent) VALUES (?, ?, ?, ?, ?, ?)`,
    name, license, reason, expire, bannedby, permanent
  );
}

export async function deleteBan(id: number) {
  await prisma.$queryRawUnsafe(`DELETE FROM bans WHERE id = ?`, id);
}
