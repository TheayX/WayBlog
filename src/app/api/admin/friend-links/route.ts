/**
 * 友情链接集合路由处理器。
 *
 * 该接口只服务管理后台：列表读取与创建都要求先通过鉴权；
 * 前台展示数据统一从查询层读取，不再借用后台接口路径。
 * 友情链接当前没有名称或 URL 的唯一性约束；该路由只负责结构校验与持久化。
 */
import { NextRequest } from 'next/server';
import { ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { createFriendLink, getAdminFriendLinks } from '@/lib/friend-links/admin-service';
import { createFriendLinkSchema } from '@/lib/validations';

/**
 * 获取后台友情链接列表。
 *
 * 请求体为空，但仍要求先鉴权，
 * 避免后台管理数据继续以“公开可读”的路径形式暴露。
 */
export async function GET() {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    return ok(await getAdminFriendLinks());
  } catch (error) {
    return serverError('GET /api/admin/friend-links', error);
  }
}

/**
 * 创建友情链接。
 *
 * 该接口面向管理后台，统一通过 schema 约束标题、URL 与排序字段，
 * 避免前台页面渲染时再处理脏数据。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createFriendLinkSchema);
    if (!parsed.success) return parsed.response;

    return ok(await createFriendLink(parsed.data), { status: 201 });
  } catch (error) {
    return serverError('POST /api/admin/friend-links', error);
  }
}
