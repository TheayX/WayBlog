/**
 * 标签集合路由处理器。
 *
 * 该接口只服务管理后台：读取列表与创建标签都需要先完成鉴权；
 * 公开页需要的标签数据统一走查询层，避免继续暴露历史遗留的后台专用路径。
 */
import { NextRequest } from 'next/server';
import { conflict, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import {
  createTag,
  getTagsWithPublishedPostCount,
  tagNameOrSlugExists,
} from '@/lib/taxonomies/admin-service';
import { createTagSchema } from '@/lib/validations';

/**
 * 获取后台标签列表。
 *
 * 请求体为空，但仍要求先鉴权，
 * 这样后台数据入口不会再和公开接口混在同一路径语义下。
 */
export async function GET() {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    return ok(await getTagsWithPublishedPostCount());
  } catch (error) {
    return serverError('GET /api/admin/tags', error);
  }
}

/**
 * 创建标签。
 *
 * 标签名称与 slug 都会影响前台页面聚合入口与后台筛选体验，
 * 因此在创建前主动拦截重复值，向调用方返回稳定的业务错误语义。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createTagSchema);
    if (!parsed.success) return parsed.response;

    if (await tagNameOrSlugExists(parsed.data)) {
      return conflict('Tag name or slug already exists');
    }

    return ok(await createTag(parsed.data), { status: 201 });
  } catch (error) {
    return serverError('POST /api/admin/tags', error);
  }
}
