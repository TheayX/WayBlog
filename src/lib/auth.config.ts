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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    // middleware 中用于路由保护的逻辑
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // /admin/login 不需要认证
      if (pathname === '/admin/login') {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin/dashboard', nextUrl));
        }
        return true;
      }

      // /admin/* 下的其他路由需要认证
      if (pathname.startsWith('/admin')) {
        return isLoggedIn; // false 会自动重定向到 signIn 页面
      }

      return true;
    },
  },
};

