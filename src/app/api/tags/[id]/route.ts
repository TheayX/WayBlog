import { NextRequest } from 'next/server';
import { badRequest, conflict, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateTagSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTagSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Tag not found');
    }

    if (parsed.data.slug || parsed.data.name) {
      const existingConflict = await prisma.tag.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(parsed.data.name ? [{ name: parsed.data.name }] : []),
            ...(parsed.data.slug ? [{ slug: parsed.data.slug }] : []),
          ],
        },
      });

      if (existingConflict) {
        return conflict('Tag name or slug already exists');
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: parsed.data,
    });

    return ok(tag);
  } catch (error) {
    return serverError('PUT /api/tags/[id]', error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.tag.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Tag not found');
    }

    await prisma.tag.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/tags/[id]', error);
  }
}
