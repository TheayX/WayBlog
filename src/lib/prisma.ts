/**
 * Prisma 客户端单例入口。
 *
 * Next.js 在开发环境会频繁触发模块热重载；如果每次都新建 PrismaClient，容易产生过多连接。
 * 因此这里在非生产环境挂载到 `globalThis`，生产环境则保持进程内正常初始化。
 */
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * 基于 `DATABASE_URL` 创建 Prisma 客户端。
 * 这里显式使用 pg adapter，确保 Prisma 通过同一套 PostgreSQL 连接配置访问数据库。
 */
function makePrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') {
  // 仅在开发环境缓存实例，避免 HMR 导致连接数膨胀。
  globalForPrisma.prisma = prisma;
}

