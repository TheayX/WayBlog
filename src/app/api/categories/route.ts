import { NextRequest } from 'next/server';
import { PostStatus } from '@/generated/prisma';
import { badRequest, conflict, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createCategorySchema } from '@/lib/validations';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            posts: { where: { status: PostStatus.PUBLISHED } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      postCount: category._count.posts,
      createdAt: category.createdAt,
    }));

    return ok(data);
  } catch (error) {
    return serverError('GET /api/categories', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.category.findFirst({
      where: {
        OR: [{ name: parsed.data.name }, { slug: parsed.data.slug }],
      },
    });

    if (existing) {
      return conflict('Category name or slug already exists');
    }

    const category = await prisma.category.create({ data: parsed.data });
    return ok(category, { status: 201 });
  } catch (error) {
    return serverError('POST /api/categories', error);
  }
}
