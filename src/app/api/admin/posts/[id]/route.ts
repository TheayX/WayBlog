/**
 * 后台单篇文章路由处理器。
 *
 * 该文件只承载管理后台对单篇文章的写操作；公开文章详情由前台页面按 slug 读取已发布内容，
 * 不通过 id 暴露后台编辑数据，避免公开与后台能力共用同一路由边界。
 */
import { NextRequest } from 'next/server';
import { conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess, resolveRouteId } from '@/lib/api/admin';
import {
  deletePost,
  getPostUpdateTarget,
  postExists,
  postSlugExists,
  updatePost,
} from '@/lib/posts/admin-service';
import { updatePostSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 更新文章。
 *
 * 后台编辑页提交已归一化的文章载荷；服务端负责再次校验、确认目标存在并拦截 slug 冲突。
 * 如果草稿首次切换为已发布，会补写 publishedAt，保证公开页排序语义稳定。
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    const parsed = await parseJsonBody(request, updatePostSchema);
    if (!parsed.success) return parsed.response;

    const existing = await getPostUpdateTarget(id);
    if (!existing) {
      return notFound('Post not found');
    }

    if (parsed.data.slug && (await postSlugExists(parsed.data.slug, id))) {
      return conflict('Post slug already exists');
    }

    return ok(await updatePost(id, parsed.data, existing.publishedAt));
  } catch (error) {
    return serverError('PUT /api/admin/posts/[id]', error);
  }
}

/**
 * 删除文章。
 *
 * 删除前先确认目标存在，让后台调用方能区分“无权限”“目标不存在”和“删除成功”。
 * 删除成功返回 204 空响应，调用方应直接刷新或移除本地列表项。
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    if (!(await postExists(id))) {
      return notFound('Post not found');
    }

    await deletePost(id);
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/admin/posts/[id]', error);
  }
}
