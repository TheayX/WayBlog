import type { Metadata } from 'next';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '友链',
  description: '友情链接',
};

export default async function FriendsPage() {
  const links = await prisma.friendLink.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <header className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">🔗 友链</h1>
        <p className="text-muted-foreground">一些有趣的朋友们</p>
      </header>

      {links.length === 0 ? (
        <p className="text-muted-foreground">暂无友链。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
            >
              {/* 头像 */}
              {link.avatar ? (
                <Image
                  src={link.avatar}
                  alt={link.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground">
                  {link.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-medium group-hover:text-primary transition-colors">
                  {link.name}
                </p>
                {link.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

