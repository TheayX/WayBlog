import { NextRequest } from 'next/server';
import { notFound, ok, serverError, tooManyRequests } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getClientIp, viewsLimiter } from '@/lib/rate-limit';

const uvCache = new Map<string, Set<string>>();
let lastCleanDate = new Date().toISOString().slice(0, 10);

function cleanUvCache() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastCleanDate) {
    uvCache.clear();
    lastCleanDate = today;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const ip = getClientIp(request);
    const limitKey = `views:${ip}:${postId}`;

    if (!viewsLimiter.check(limitKey)) {
      return tooManyRequests();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return notFound('Post not found');
    }

    cleanUvCache();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().slice(0, 10);
    const uvKey = `${postId}:${dateKey}`;

    let isNewUv = false;
    if (!uvCache.has(uvKey)) {
      uvCache.set(uvKey, new Set());
    }

    const ipSet = uvCache.get(uvKey)!;
    if (!ipSet.has(ip)) {
      ipSet.add(ip);
      isNewUv = true;
    }

    const [, updatedPost] = await prisma.$transaction([
      prisma.pageView.upsert({
        where: { postId_date: { postId, date: today } },
        create: {
          postId,
          date: today,
          pvCount: 1,
          uvCount: isNewUv ? 1 : 0,
        },
        update: {
          pvCount: { increment: 1 },
          ...(isNewUv ? { uvCount: { increment: 1 } } : {}),
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      }),
    ]);

    return ok({ viewCount: updatedPost.viewCount });
  } catch (error) {
    return serverError('POST /api/posts/[id]/views', error);
  }
}
