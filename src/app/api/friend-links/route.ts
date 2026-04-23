/**
 * 友情链接集合路由处理器。
 *
 * - GET 可供公开页/前台页面直接读取展示数据，也可供管理后台列表复用。
 * - POST 仅允许管理后台创建友情链接，先完成鉴权与请求校验，再返回新建结果。
 * - 友情链接当前没有名称或 URL 的唯一性约束；该路由只负责结构校验与持久化。
 */
import { NextRequest } from 'next/server';
import { ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { prisma } from '@/lib/prisma';
import { createFriendLinkSchema } from '@/lib/validations';

/**
 * 获取友情链接列表。
 *
 * 该接口没有请求体验证，因为输入为空，只负责返回展示顺序稳定的链接集合。
 * 先按 sortOrder 升序，再按创建时间倒序，保证前台页面展示顺序稳定；
 * 当多个链接拥有相同排序值时，管理后台最近创建的记录会优先暴露，便于确认调整结果。
 */
export async function GET() {
  try {
    const data = await prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return ok(data);
  } catch (error) {
    return serverError('GET /api/friend-links', error);
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

    const link = await prisma.friendLink.create({ data: parsed.data });
    return ok(link, { status: 201 });
  } catch (error) {
    return serverError('POST /api/friend-links', error);
  }
}
