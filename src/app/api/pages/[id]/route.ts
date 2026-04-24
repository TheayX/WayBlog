/**
 * 单个单页路由处理器。
 *
 * 这里只承载管理后台的更新与删除写操作；
 * 前台关于页等公开单页继续按 slug 从查询层读取，避免后台编辑边界和公开访问边界混用。
 */
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess, resolveRouteId } from '@/lib/api/admin';
import { deletePage, pageExists, pageSlugExists, updatePage } from '@/lib/pages/admin-service';
import { updatePageSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** 更新单页。 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    const parsed = await parseJsonBody(request, updatePageSchema);
    if (!parsed.success) return parsed.response;

    if (!(await pageExists(id))) {
      return notFound('Page not found');
    }

    if (parsed.data.slug && (await pageSlugExists(parsed.data.slug, id))) {
      return conflict('Page slug already exists');
    }

    const page = await updatePage(id, parsed.data);
    revalidateTag('public-pages', 'max');

    return ok(page);
  } catch (error) {
    return serverError('PUT /api/pages/[id]', error);
  }
}

/** 删除单页。 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const id = await resolveRouteId(params);
    if (!(await pageExists(id))) {
      return notFound('Page not found');
    }

    await deletePage(id);
    revalidateTag('public-pages', 'max');
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/pages/[id]', error);
  }
}
