import { NextRequest } from 'next/server';
import type { Prisma } from '@/generated/prisma';
import { PostStatus } from '@/generated/prisma';
import { badRequest, conflict, paged, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createPostSchema, postQuerySchema } from '@/lib/validations';

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
