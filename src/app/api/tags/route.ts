/**
 * 标签集合路由处理器。
 *
 * - GET 同时供公开页/前台页面与管理后台读取标签列表，并返回已发布文章数。
 * - POST 仅供管理后台创建标签，依次执行鉴权、请求校验与名称/slug 唯一性检查。
 */
import { NextRequest } from 'next/server';
import { PostStatus } from '@/generated/prisma/client';
import { conflict, ok, serverError } from '@/lib/response';
import { parseJsonBody, requireAdminAccess } from '@/lib/api/admin';
import { prisma } from '@/lib/prisma';
import { createTagSchema } from '@/lib/validations';

/**
 * 获取标签列表。
 *
 * 该接口没有请求体验证，因为输入为空，仅返回当前标签集合。
 * 统计口径只包含已发布帖子，原因是标签常直接用于公开页聚合页或筛选器，
 * 返回草稿数量会让前台页面看到与实际可访问内容不一致的计数。
 */
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            posts: { where: { status: PostStatus.PUBLISHED } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      postCount: tag._count.posts,
      createdAt: tag.createdAt,
    }));

    return ok(data);
  } catch (error) {
    return serverError('GET /api/tags', error);
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

    const existing = await prisma.tag.findFirst({
      where: {
        OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
      },
    });

    if (existing) {
      return conflict('Tag name or slug already exists');
    }

    const tag = await prisma.tag.create({ data: parsed.data });
    return ok(tag, { status: 201 });
  } catch (error) {
    return serverError('POST /api/tags', error);
  }
}
