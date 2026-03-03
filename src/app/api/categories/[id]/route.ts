import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateCategorySchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateCategorySchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Category not found');
    }

    if (parsed.data.slug || parsed.data.name) {
      const existingConflict = await prisma.category.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(parsed.data.name ? [{ name: parsed.data.name }] : []),
            ...(parsed.data.slug ? [{ slug: parsed.data.slug }] : []),
          ],
        },
      });

      if (existingConflict) {
        return conflict('Category name or slug already exists');
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    return ok(category);
  } catch (error) {
    return serverError('PUT /api/categories/[id]', error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Category not found');
    }

    await prisma.category.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/categories/[id]', error);
  }
}
