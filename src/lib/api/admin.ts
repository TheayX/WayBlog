import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth-guard';
import { badRequest } from '@/lib/response';

/**
 * 后台 API 的统一鉴权入口。
 *
 * 这里只收敛“先鉴权，不通过就直接返回响应”的重复模板，
 * 不承载任何业务权限判断，避免把领域规则错误地塞进通用层。
 */
export async function requireAdminAccess() {
  return requireAuth();
}

/**
 * 统一解析并校验 JSON 请求体。
 *
 * 后台写接口大多遵循“读 JSON -> safeParse -> 400”这一模板；
 * 抽到这里后可以减少各路由处理器重复拼装校验失败响应。
 */
export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema,
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    // JSON 语法错误属于客户端请求问题，应稳定返回 400，避免被统一异常处理误报为服务端故障。
    return {
      success: false as const,
      response: badRequest(undefined, 'Invalid JSON body'),
    };
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return {
      success: false as const,
      response: badRequest(parsed.error.flatten().fieldErrors, 'Validation failed'),
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

/**
 * 统一解析带 `id` 的路由参数。
 *
 * Next.js App Router 中的 `params` 在这些路由里都是异步对象；
 * 抽成辅助函数后，路由处理器可以把注意力放回业务分支本身。
 */
export async function resolveRouteId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return id;
}
