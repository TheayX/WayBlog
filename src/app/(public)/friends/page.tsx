import type { Metadata } from 'next';
import Image from 'next/image';
import { getPublicFriendLinks } from '@/lib/friend-links/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '友链',
  description: '友情链接。',
};

/**
 * 前台友链页。
 *
 * 展示后台维护的友情链接列表，并按排序权重与创建时间输出稳定顺序。
 */
export default async function FriendsPage() {
  const links = await getPublicFriendLinks();

  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">Friends</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
          友链
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          这里收录长期关注或值得推荐的站点，展示方式更偏名片与索引，而不是普通链接列表。
        </p>
      </header>

      {links.length === 0 ? (
        <div className="page-frame px-6 py-12 text-muted-foreground">暂无友链。</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group page-frame flex items-start gap-4 p-5"
            >
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
                <p className="text-base font-medium text-foreground transition-colors group-hover:text-primary">
                  {link.name}
                </p>
                {link.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
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
