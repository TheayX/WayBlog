import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updatePostSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!post) {
      return notFound('Post not found');
    }

    return ok(post);
  } catch (error) {
    return serverError('GET /api/posts/[id]', error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Post not found');
    }

    const { tagIds, ...postData } = parsed.data;

    if (postData.slug) {
      const slugExists = await prisma.post.findFirst({
        where: { id: { not: id }, slug: postData.slug },
      });

      if (slugExists) {
        return conflict('Post slug already exists');
      }
    }

    const publishedAt =
      postData.status === 'PUBLISHED' && !existing.publishedAt ? new Date() : undefined;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...postData,
        ...(publishedAt ? { publishedAt } : {}),
        ...(tagIds !== undefined ? { tags: { set: tagIds.map((tagId) => ({ id: tagId })) } } : {}),
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return ok(post);
  } catch (error) {
    return serverError('PUT /api/posts/[id]', error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.post.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Post not found');
    }

    await prisma.post.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/posts/[id]', error);
  }
}
