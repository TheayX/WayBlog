import { NextRequest } from 'next/server';
import { badRequest, noContent, notFound, ok, serverError } from '@/lib/response';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { updateFriendLinkSchema } from '@/lib/validations';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateFriendLinkSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const existing = await prisma.friendLink.findUnique({ where: { id } });
    if (!existing) {
      return notFound('Friend link not found');
    }

    const link = await prisma.friendLink.update({
      where: { id },
      data: parsed.data,
    });

    return ok(link);
  } catch (error) {
    return serverError('PUT /api/friend-links/[id]', error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const { id } = await params;
    const existing = await prisma.friendLink.findUnique({ where: { id } });

    if (!existing) {
      return notFound('Friend link not found');
    }

    await prisma.friendLink.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return serverError('DELETE /api/friend-links/[id]', error);
  }
}
