import { NextRequest } from 'next/server';
import { badRequest, ok, serverError } from '@/lib/api';
import { requireAuth } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';
import { createFriendLinkSchema } from '@/lib/validations';

export async function GET() {
  try {
    const data = await prisma.friendLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return ok(data);
  } catch (error) {
    return serverError('GET /api/friend-links', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (!authResult.authorized) return authResult.response;

    const body = await request.json();
    const parsed = createFriendLinkSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest(parsed.error.flatten().fieldErrors, 'Validation failed');
    }

    const link = await prisma.friendLink.create({ data: parsed.data });
    return ok(link, { status: 201 });
  } catch (error) {
    return serverError('POST /api/friend-links', error);
  }
}
