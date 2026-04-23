/**
 * 后台文章列表路由处理器。
 *
 * 该入口只服务管理后台列表读取：先完成鉴权，再允许按状态、分类、标签和置顶状态筛选。
 * 公开文章列表由 `/api/posts` 提供，二者不共享可见性判断，避免公开/后台权限语义混在同一路由中。
 */
import { NextRequest } from 'next/server';
import { badRequest, conflict, ok, paged, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { createPost, getAdminPostList, postSlugExists } from '@/lib/posts/admin-service';
import { adminPostQuerySchema, createPostSchema } from '@/lib/validations';

/**
 * 获取后台文章分页列表。
 *
 * 管理端列表需要读取草稿和已发布文章，因此必须先鉴权；
 * 鉴权完成后再解析查询参数，避免未登录调用方获得任何后台筛选能力。
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminAccess();
    if (!authResult.authorized) return authResult.response;

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = adminPostQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Invalid query parameters');
    }

    const { page, pageSize, status, categoryId, tagId, pinned } = parsed.data;
    const { data, total } = await getAdminPostList({
      page,
      pageSize,
      status,
      categoryId,
      tagId,
      pinned,
      isAdmin: true,
    });

    return paged(data, { total, page, pageSize });
  } catch (error) {
    return serverError('GET /api/admin/posts', error);
  }
}

/**
 * 创建文章。
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
    return serverError('POST /api/admin/posts', error);
  }
}
