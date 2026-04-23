/**
 * 路由处理器层的轻量鉴权守卫。
 *
 * 适用于需要显式返回 JSON 错误的后台 API，而不是依赖 middleware 做页面跳转。
 * 这样可以让前端在调用受保护的路由处理器时获得稳定的 401 响应结构。
 */
import { auth } from '@/lib/auth';
import { unauthorized } from '@/lib/response';

/**
 * 检查当前请求是否已建立有效会话。
 *
 * 返回值采用判别联合风格：
 * - `authorized: false` 时附带标准化 401 响应，可直接 `return`
 * - `authorized: true` 时附带当前用户信息，供后续业务逻辑继续使用
 */
export async function requireAuth() {
  const session = await auth();

  // 未登录时直接在此短路，避免各路由处理器重复构造未认证响应。
  if (!session?.user) {
    return {
      authorized: false as const,
      response: unauthorized('未认证，请先登录'),
    };
  }

  return {
    authorized: true as const,
    user: session.user,
  };
}

