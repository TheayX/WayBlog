import type { Metadata } from 'next';
import { MarkdownRenderer } from '@/components/post/MarkdownRenderer';
import { getPublicPageBySlug } from '@/lib/pages/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '关于',
  description: '关于站点与作者。',
};

/**
 * 前台关于页。
 *
 * 通过 slug 为 `about` 的单页内容承载站点介绍；
 * 如果后台尚未创建该页面，则展示创建提示而不是 404。
 */
export default async function AboutPage() {
  const page = await getPublicPageBySlug('about');

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{page?.title || '关于'}</h1>
      </header>

      {page?.content ? (
        <MarkdownRenderer content={page.content} />
      ) : (
        <p className="text-muted-foreground">
          这里还没有内容，去后台创建一个 slug 为
          {' '}
          <code>about</code>
          {' '}
          的页面即可。
        </p>
      )}
    </div>
  );
}
