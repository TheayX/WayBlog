import { NextRequest } from 'next/server';
import { PostStatus } from '@/generated/prisma';
import { badRequest, conflict, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createTagSchema } from '@/lib/validations';

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createTagSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

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
