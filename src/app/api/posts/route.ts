import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';
import { createPostSchema, postQuerySchema } from '@/lib/validations';
import { PostStatus } from '@/generated/prisma';

// ─── GET /api/posts — 获取文章列表 ───
export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = postQuerySchema.safeParse(searchParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数错误', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { page, pageSize, status, categoryId, tagId, pinned } = parsed.data;

    // 未认证用户只能查看已发布文章
    const authResult = await requireAuth();
    const isAdmin = authResult.authorized;

    const where: Record<string, unknown> = {};

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

    return NextResponse.json({ data, total, page, pageSize });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// ─── POST /api/posts — 创建文章 ───
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: '参数校验失败', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { tagIds, ...postData } = parsed.data;

    // 检查 slug 是否重复
    const existing = await prisma.post.findUnique({ where: { slug: postData.slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug 已存在' }, { status: 409 });
    }

    // 发布时自动设置 publishedAt
    const publishedAt =
      postData.status === 'PUBLISHED' ? new Date() : undefined;

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

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

