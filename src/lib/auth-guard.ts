import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * API 路由认证守卫
 * 用于保护需要登录的 API 端点（POST/PUT/DELETE）
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: '未认证，请先登录' }, { status: 401 }),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}

