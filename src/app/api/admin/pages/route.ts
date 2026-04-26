/**
 * 单页集合路由处理器。
 *
 * 当前该接口只服务管理后台：列表、新建都需要先通过鉴权；
 * 单页公开读取统一由前台页面直接走查询层，不通过这里暴露。
 */
import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';
import { ok, conflict, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { createPage, getAdminPages, pageSlugExists } from '@/lib/pages/admin-service';
import { createPageSchema } from '@/lib/validations';

/** 获取后台单页列表。 */
export async function GET() {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    return ok(await getAdminPages());
  } catch (error) {
    return serverError('GET /api/admin/pages', error);
  }
}

/**
 * 创建单页。
 *
 * slug 会直接进入前台路由，因此创建前必须主动拦截冲突，
 * 避免后台保存成功但公开入口无法稳定定位内容。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createPageSchema);
    if (!parsed.success) return parsed.response;

    if (await pageSlugExists(parsed.data.slug)) {
      return conflict('Page slug already exists');
    }

    const page = await createPage(parsed.data);
    // 单页公开读取走 `public-pages` 缓存标签，保存后立即失效可避免后台更新后前台短时间继续展示旧内容。
    revalidateTag('public-pages', 'max');

    return ok(page, { status: 201 });
  } catch (error) {
    return serverError('POST /api/admin/pages', error);
  }
}
