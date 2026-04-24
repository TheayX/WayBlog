import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedArchivePosts } from '@/lib/posts/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '归档',
  description: '按时间线浏览所有文章。',
};

interface ArchiveGroup {
  year: number;
  months: {
    month: number;
    posts: {
      slug: string;
      title: string;
      publishedAt: Date | null;
    }[];
  }[];
}

/**
 * 前台归档页。
 *
 * 把所有已发布文章按年/月分组展示，方便读者按时间线回看内容演进。
 */
export default async function ArchivesPage() {
  const posts = await getPublishedArchivePosts();

  const groupMap = new Map<number, Map<number, typeof posts>>();

  for (const post of posts) {
    if (!post.publishedAt) continue;
    const year = post.publishedAt.getFullYear();
    const month = post.publishedAt.getMonth() + 1;

    if (!groupMap.has(year)) groupMap.set(year, new Map());
    const yearMap = groupMap.get(year)!;
    if (!yearMap.has(month)) yearMap.set(month, []);
    yearMap.get(month)!.push(post);
  }

  const groups: ArchiveGroup[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, monthMap]) => ({
      year,
      months: Array.from(monthMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([month, monthPosts]) => ({ month, posts: monthPosts })),
    }));

  const totalPosts = posts.length;

  return (
    <div className="space-y-8">
      <header className="page-frame px-6 py-8 sm:px-8">
        <p className="eyebrow">Archive</p>
        <h1 className="editorial-title mt-3 text-4xl font-semibold text-foreground sm:text-5xl">
          按时间线回看内容更新
        </h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          共 {totalPosts} 篇文章。归档页强调时间秩序，方便从长期积累里回看主题变化与写作节奏。
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="page-frame px-6 py-12 text-muted-foreground">暂无文章。</div>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.year} className="page-frame px-6 py-6 sm:px-8">
              <h2 className="editorial-title mb-6 text-4xl font-semibold text-foreground">
                {group.year}
              </h2>
              <div className="space-y-6">
                {group.months.map(({ month, posts: monthPosts }) => (
                  <div key={month}>
                    <h3 className="mb-4 text-lg font-semibold text-muted-foreground">{month} 月</h3>
                    <ul className="space-y-3 border-l border-border pl-5">
                      {monthPosts.map((post) => (
                        <li key={post.slug} className="flex items-baseline gap-4">
                          <time
                            dateTime={post.publishedAt!.toISOString()}
                            className="shrink-0 text-sm tabular-nums text-muted-foreground"
                          >
                            {String(post.publishedAt!.getMonth() + 1).padStart(2, '0')}-
                            {String(post.publishedAt!.getDate()).padStart(2, '0')}
                          </time>
                          <Link
                            href={`/posts/${post.slug}`}
                            className="text-sm text-foreground transition-colors hover:text-primary sm:text-base"
                          >
                            {post.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
