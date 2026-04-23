/**
 * 帖子集合路由处理器。
 *
 * - GET 同时服务公开页/前台页面与管理后台列表；是否放宽到草稿等状态由鉴权结果决定。
 * - POST 仅允许管理后台在完成鉴权后创建内容，统一走 schema 校验与 slug 唯一性约束。
 * - 返回列表时直接附带分页元数据，避免调用方再额外推导总数与页码语义。
 */
import { NextRequest } from 'next/server';
import { badRequest, conflict, paged, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { createPost, getAdminPostList, postSlugExists } from '@/lib/posts/admin-service';
import { createPostSchema, postQuerySchema } from '@/lib/validations';

/**
 * 按查询参数返回帖子分页结果。
 *
 * 公开访问时只暴露已发布内容；管理后台在鉴权通过后才允许按 status 查看草稿或其他状态，
 * 这样可以复用同一路由处理器，同时避免前台页面通过构造查询参数读取未发布数据。
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = postQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Invalid query parameters');
    }

    const { page, pageSize, status, categoryId, tagId, pinned } = parsed.data;
    const authResult = await requireAdminAccess();
    const { data, total } = await getAdminPostList({
      page,
      pageSize,
      status,
      categoryId,
      tagId,
      pinned,
      isAdmin: authResult.authorized,
    });

    return paged(data, { total, page, pageSize });
  } catch (error) {
    return serverError('GET /api/posts', error);
  }
}

/**
 * 创建帖子。
 *
 * 该入口仅面向管理后台：先鉴权，再校验请求体，最后检查 slug 唯一性。
 * 对已发布内容在创建时立即写入 publishedAt，保证前台页面排序与发布时间语义一致。
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const parsed = await parseJsonBody(request, createPostSchema);
    if (!parsed.success) return parsed.response;

    // slug 是前台页面路由与管理后台编辑入口共享的稳定标识，冲突时必须提前返回 409。
    if (await postSlugExists(parsed.data.slug)) {
      return conflict('Post slug already exists');
    }

    const post = await createPost(parsed.data, authResult.user.id!);

    return ok(post, { status: 201 });
  } catch (error) {
    return serverError('POST /api/posts', error);
  }
}
