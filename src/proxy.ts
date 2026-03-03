import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Proxy 运行在 Edge Runtime
 * 只导入 authConfig，避免引入 Prisma 等 Node.js 依赖
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*'],
};
