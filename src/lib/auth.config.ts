/**
 * NextAuth 的共享基础配置。
 *
 * 这里刻意不依赖 Prisma 等 Node.js 专属能力，便于在 middleware 等 Edge 运行时复用，
 * 统一管理会话策略、登录页与路由级鉴权规则。
 */
import type { NextAuthConfig } from 'next-auth';

/**
 * NextAuth 核心配置（不含 Prisma 依赖）
 * 可安全在 Edge Runtime（middleware）中使用
 */
export const authConfig: NextAuthConfig = {
  providers: [], // providers 在 auth.ts 中完整配置
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    /**
     * 将数据库中的用户主键透传到 JWT，供后续会话归一化使用。
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }

      // 账号设置页更新资料后同步刷新 JWT，避免顶部栏继续展示旧昵称。
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.picture = session.user.image;
      }

      return token;
    },
    /**
     * 将 JWT 中的扩展字段映射回会话对象，保证服务端与前端读取到一致的 `session.user.id`。
     */
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    /**
     * middleware 中用于管理后台路由保护的统一入口。
     * 约束：只拦截 `/admin` 相关路径，公开页/前台页面保持可匿名访问。
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // 登录页允许匿名访问；已登录用户再次访问时直接送回后台首页，减少重复登录操作。
      if (pathname === '/admin/login') {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin/dashboard', nextUrl));
        }
        return true;
      }

      // 管理后台其余页面必须具备会话；返回 false 时由 NextAuth 自动跳转到 signIn 页面。
      if (pathname.startsWith('/admin')) {
        return isLoggedIn;
      }

      // 非后台路径一律放行，避免影响公开页/前台页面和其他路由处理器。
      return true;
    },
  },
};

