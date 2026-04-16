/**
 * 认证主入口。
 *
 * 该模块负责组装 NextAuth 的完整运行时配置，并导出路由处理器、会话读取函数和登录/登出能力。
 * 与 `auth.config.ts` 的分层点在于：这里可以安全依赖 Prisma 与密码校验，仅在 Node.js 运行时使用，
 * 避免将数据库依赖带入 middleware / Edge 场景。
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/lib/auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      /**
       * 管理后台登录使用邮箱 + 密码进行鉴权。
       * 返回 `null` 表示认证失败，NextAuth 会据此拒绝建立会话。
       */
      async authorize(credentials) {
        // 缺少必填凭据时直接失败，避免继续访问数据库。
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // 用户不存在与密码错误都返回 null，避免向外暴露账户存在性。
        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);

        if (!isPasswordValid) {
          return null;
        }

        // 仅向会话写入前台/后台都需要的最小用户信息，避免泄露敏感字段。
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
});
