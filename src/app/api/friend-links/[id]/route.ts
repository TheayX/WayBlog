/**
 * 单个友情链接路由处理器。
 *
 * 该文件只面向管理后台写操作：更新与删除都需要鉴权，
 * 并在请求校验、目标不存在、删除成功等分支上返回明确业务语义，便于后台表单处理。
 * 当前不存在名称或 URL 的唯一性约束，因此更新时不会额外执行冲突检查。
 */
import { NextRequest } from 'next/server';
import { noContent, notFound, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess, resolveRouteId } from '@/lib/api/admin';
import { prisma } from '@/lib/prisma';
import { updateFriendLinkSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 更新友情链接。
 *
 * 仅在鉴权通过后接受管理后台提交的局部更新，所有字段仍统一走 schema 校验，
 * 这样可以保证前台页面消费到的链接数据结构稳定。
 * 更新成功返回最新实体，便于管理后台立即同步当前编辑结果。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    const parsed = await parseJsonBody(request, updateFriendLinkSchema);
    if (!parsed.success) return parsed.response;

    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Friend link not found');
    }

    const link = await prisma.friendLink.update({
      where: { id },
      data: parsed.data,
    });

    return ok(link);
  } catch (error) {
    return serverError('PUT /api/friend-links/[id]', error);
  }
}

/**
 * 删除友情链接。
 *
 * 删除前先确认目标存在，避免管理后台在重复操作时把“已删除”误判为成功响应。
 * 删除成功返回 204 空响应，调用方应直接移除本地记录，而不是继续等待新的详情数据。
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    const existing = await prisma.friendLink.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Friend link not found');
    }

    await prisma.friendLink.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/friend-links/[id]', error);
  }
}
