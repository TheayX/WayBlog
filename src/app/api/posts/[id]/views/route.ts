import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { viewsLimiter, getClientIp } from '@/lib/rate-limit';

// 内存缓存：UV 去重（每日清理）
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

// ─── POST /api/posts/[id]/views — 记录浏览量 ───
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: postId } = await params;
    const ip = getClientIp(request);

    // 限流检查
    const limitKey = `views:${ip}:${postId}`;
    if (!viewsLimiter.check(limitKey)) {
      return NextResponse.json({ error: '请求过于频繁' }, { status: 429 });
    }

    // 确认文章存在
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    cleanUvCache();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateKey = today.toISOString().slice(0, 10);
    const uvKey = `${postId}:${dateKey}`;

    // 判断是否新 UV
    let isNewUv = false;
    if (!uvCache.has(uvKey)) {
      uvCache.set(uvKey, new Set());
    }
    const ipSet = uvCache.get(uvKey)!;
    if (!ipSet.has(ip)) {
      ipSet.add(ip);
      isNewUv = true;
    }

    // 更新 PageView（upsert）
    await prisma.pageView.upsert({
      where: { postId_date: { postId, date: today } },
      create: {
        postId,
        date: today,
        pvCount: 1,
        uvCount: isNewUv ? 1 : 0,
      },
      update: {
        pvCount: { increment: 1 },
        ...(isNewUv && { uvCount: { increment: 1 } }),
      },
    });

    // 更新文章总浏览量
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });

    return NextResponse.json({ data: { viewCount: updated.viewCount } });
  } catch (error) {
    console.error('POST /api/posts/[id]/views error:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

