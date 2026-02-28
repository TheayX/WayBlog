import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Middleware 运行在 Edge Runtime
 * 只导入 authConfig（无 Prisma 依赖），避免 Node.js 模块报错
 * 路由保护逻辑在 authConfig.callbacks.authorized 中实现
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ['/admin/:path*'],
};
