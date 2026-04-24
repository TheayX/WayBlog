import type { Metadata } from 'next';
import Image from 'next/image';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageIntro } from '@/components/ui/PageIntro';
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
      <PageIntro
        eyebrow="Friends"
        title="友链"
        description="这里收录长期关注或值得推荐的站点，展示方式更偏名片与索引，而不是普通链接列表。"
      />

      {links.length === 0 ? (
        <EmptyState description="当前还没有配置友链。" />
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
