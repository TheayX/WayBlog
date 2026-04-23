import { NextRequest } from 'next/server';
import { badRequest, paged, serverError, tooManyRequests } from '@/lib/response';
import { searchSchema } from '@/lib/validations';
import { searchLimiter, getClientIp } from '@/lib/rate-limit';
import { searchPublishedPosts } from '@/lib/search/service';

/**
 * 前台页面搜索路由处理器。
 *
 * 该接口面向公开页搜索场景，不要求登录，但必须在入口处做限流与参数校验：
 * - 限流用于抑制高频爬取和无意义的全文检索压力，保护数据库全文索引；
 * - 校验用于归一化分页与关键词参数，避免把脏输入继续传入 SQL；
 * - 返回结果只包含已发布文章，确保草稿和管理后台内容不会泄露到公开页。
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!searchLimiter.check(`search:${ip}`)) {
      return tooManyRequests('搜索请求过于频繁');
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = searchSchema.safeParse(searchParams);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, '参数错误');
    }

    const { q, page, pageSize } = parsed.data;
    const { data, total } = await searchPublishedPosts({ q, page, pageSize });

    return paged(data, { total, page, pageSize });
  } catch (error) {
    return serverError('GET /api/search', error);
  }
}

