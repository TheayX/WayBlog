/**
 * 帖子集合路由处理器。
 *
 * - GET 同时服务公开页/前台页面与管理后台列表；是否放宽到草稿等状态由鉴权结果决定。
 * - POST 仅允许管理后台在完成鉴权后创建内容，统一走 schema 校验与 slug 唯一性约束。
 * - 返回列表时直接附带分页元数据，避免调用方再额外推导总数与页码语义。
 */
import { NextRequest } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import { PostStatus } from '@/generated/prisma/client';
import { badRequest, conflict, paged, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
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
    const authResult = await requireAuth();
    const isAdmin = authResult.authorized;

    const where: Prisma.PostWhereInput = {};

    // 仅管理后台允许显式筛选草稿等状态；公开页/前台页面始终锁定为已发布内容。
    if (status && isAdmin) {
      where.status = status;
    } else if (!isAdmin) {
      where.status = PostStatus.PUBLISHED;
    }

    if (categoryId) where.categoryId = categoryId;
    if (tagId) where.tags = { some: { id: tagId } };
    if (pinned !== undefined) where.pinned = pinned;

    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          status: true,
          pinned: true,
          publishedAt: true,
          viewCount: true,
          createdAt: true,
          author: { select: { id: true, name: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

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
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const { tagIds, ...postData } = parsed.data;
    const existing = await prisma.post.findUnique({ where: { slug: postData.slug } });

    // slug 是前台页面路由与管理后台编辑入口共享的稳定标识，冲突时必须提前返回 409。
    if (existing) {
      return conflict('Post slug already exists');
    }

    const publishedAt = postData.status === 'PUBLISHED' ? new Date() : undefined;

    const post = await prisma.post.create({
      data: {
        ...postData,
        publishedAt,
        authorId: authResult.user.id!,
        tags: tagIds.length > 0 ? { connect: tagIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return ok(post, { status: 201 });
  } catch (error) {
    return serverError('POST /api/posts', error);
  }
}
