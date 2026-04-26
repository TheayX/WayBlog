/**
 * 分类集合路由处理器。
 *
 * 该接口只服务管理后台：读取列表与创建分类都需要先完成鉴权；
 * 公开页需要的分类数据统一走查询层，避免把后台边界伪装成公开接口。
 */
import { NextRequest } from 'next/server';
import { conflict, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import {
  categoryNameOrSlugExists,
  createCategory,
  getCategoriesWithPublishedPostCount,
} from '@/lib/taxonomies/admin-service';
import { createCategorySchema } from '@/lib/validations';

/**
 * 获取后台分类列表。
 *
 * 请求体为空，但仍要求先做后台鉴权，
 * 这样可以让接口路径语义、访问权限和文档说明保持一致，不再混入“看起来像公开接口”的历史残留。
 */
export async function GET() {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    return ok(await getCategoriesWithPublishedPostCount());
  } catch (error) {
    return serverError('GET /api/admin/categories', error);
  }
}

/**
 * 创建分类。
 *
 * 分类名称与 slug 都会进入公开页路由和管理后台筛选，因此在写库前显式拦截冲突，
 * 以返回明确的 409 语义，而不是依赖底层数据库异常。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createCategorySchema);
    if (!parsed.success) return parsed.response;

    if (await categoryNameOrSlugExists(parsed.data)) {
      return conflict('Category name or slug already exists');
    }

    return ok(await createCategory(parsed.data), { status: 201 });
  } catch (error) {
    return serverError('POST /api/admin/categories', error);
  }
}
