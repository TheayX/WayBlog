/**
 * 帖子集合路由处理器。
 *
 * - GET 只服务公开读取入口，始终返回已发布文章列表。
 * - 返回列表时直接附带分页元数据，避免调用方再额外推导总数与页码语义。
 */
import { NextRequest } from 'next/server';
import { badRequest, paged, serverError } from '@/lib/response';
import { getPublicPostList } from '@/lib/posts/queries';
import { publicPostQuerySchema } from '@/lib/validations';

/**
 * 按查询参数返回公开帖子分页结果。
 *
 * 该入口不承担管理后台列表职责，服务端会固定查询已发布文章；
 * 后台如需读取草稿或按状态筛选，应调用 `/api/admin/posts`。
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = publicPostQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Invalid query parameters');
    }

    const { page, pageSize, categoryId, tagId, pinned } = parsed.data;
    const { data, total } = await getPublicPostList({
      page,
      pageSize,
      categoryId,
      tagId,
      pinned,
    });

    return paged(data, { total, page, pageSize });
  } catch (error) {
    return serverError('GET /api/posts', error);
  }
}
